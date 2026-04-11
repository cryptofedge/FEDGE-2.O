import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { prisma } from '@fedge/database';

@Controller('v1/admin/approvals')
export class AdminController {

  @Get()
  async getPendingApprovals() {
    return await prisma.approvalRequest.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' }
    });
  }

  @Post(':id/decide')
  async decideApproval(
    @Param('id') id: string,
    @Body() body: { action: 'APPROVE' | 'DENY'; stageName?: string }
  ) {
    const { action, stageName } = body;
    
    const request = await prisma.approvalRequest.findUnique({ where: { id } });
    if (!request) throw new Error('Not found');

    if (action === 'DENY') {
       await prisma.approvalRequest.update({
         where: { id },
         data: { status: 'DENIED' }
       });
       return { success: true, message: 'Request denied.' };
    }

    if (action === 'APPROVE') {
       // 1. Update the request status
       await prisma.approvalRequest.update({
         where: { id },
         data: { status: 'APPROVED' }
       });

       // 2. Complete the user profile creation
       // The guest user must now receive an ArtistProfile
       await prisma.artistProfile.create({
         data: {
           userId: request.requesterId,
           stageName: stageName || (request.payload as any)?.profileName || 'Unknown Artist'
         }
       });

       return { success: true, message: 'Request approved and Artist Profile created.' };
    }
  }
}
