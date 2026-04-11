import { Injectable } from '@nestjs/common';
import { prisma } from '@fedge/database';

@Injectable()
export class SponsorshipService {
  async logSponsorshipDeal(artistId: string, brandName: string, fitScore: string, dealNotes: string, status: string) {
    // Treat a brand sponsorship as an active Project Pipeline
    const sponsorshipProject = await prisma.project.create({
       data: {
          artistId: artistId,
          title: \`Brand Sync: \${brandName}\`,
          status: status === 'REJECTED' ? 'ARCHIVED' : 'DEVELOPMENT',
          description: \`Fit Score: \${fitScore}/100. Deal Notes: \${dealNotes}\`
       }
    });

    return \`Brand Partnership logged. Computed Fit Score for \${brandName} is \${fitScore}. Pitch status: \${status}\`;
  }
}
