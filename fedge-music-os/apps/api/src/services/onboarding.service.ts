import { Injectable } from '@nestjs/common';
import { prisma } from '@fedge/database';

@Injectable()
export class OnboardingService {
  
  generateTrackingCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'F2O-';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async handleNewUser(phoneNumber: string, profileName?: string) {
    // 1. Check if an approval request already exists for this phone
    const existingReq = await prisma.approvalRequest.findFirst({
      where: {
        type: 'ONBOARDING',
        payload: { path: ['phone'], equals: phoneNumber }
      } as any // Prisma Json filtering type workaround
    });

    if (existingReq) {
      if (existingReq.status === 'PENDING') {
         return \`Your request is still pending admin approval. Please wait for confirmation.\`;
      } else if (existingReq.status === 'DENIED') {
         return \`Access has been denied.\`;
      }
    }

    // 2. Generate the tracking code
    const trackingCode = this.generateTrackingCode();

    // 3. Instead of requiring a requester user ID, we will link it to a System Admin or use a nullable requester.
    // Wait, the schema requires a requesterId. Let's assume user id "SYSTEM" or we create a temporary stub user.
    // For this boilerplate, let's create a stub "GUEST" user to hold the request.
    const guestUser = await prisma.user.create({
      data: {
        phone: phoneNumber,
        role: 'ARTIST' // Temporary role until approved
      }
    });

    await prisma.approvalRequest.create({
      data: {
        requesterId: guestUser.id,
        type: 'ONBOARDING',
        payload: {
          phone: phoneNumber,
          profileName: profileName || 'Unknown',
          trackingCode: trackingCode
        }
      }
    });

    // 4. Return the Canvas Message Template Payload
    return \`Welcome to FEDGE 2.0 Music Division.\\nYour onboarding tracking code is: \${trackingCode}.\\nAn Admin must approve your access before you can use the system.\`;
  }
}
