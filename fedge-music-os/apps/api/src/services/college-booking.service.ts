import { Injectable } from '@nestjs/common';
import { prisma } from '@fedge/database';

@Injectable()
export class CollegeBookingService {
  async logCollegeOffer(artistId: string, schoolName: string, dateStr: string, offerAmount: string, offerStatus: string) {
    // Treat an incoming college show as a Campaign Pipeline item
    const routingCampaign = await prisma.campaign.create({
       data: {
          artistId: artistId,
          name: \`NACA Circuit: \${schoolName} - \${dateStr}\`,
          status: offerStatus === 'PENDING' ? 'PLANNING' : 'ACTIVE',
          description: \`Financial Offer: \${offerAmount}\`
       }
    });

    return \`Routing update: Logged a \${offerAmount} offer from \${schoolName} for \${dateStr}. Status: \${offerStatus}.\`;
  }
}
