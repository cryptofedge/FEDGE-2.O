import { Injectable } from '@nestjs/common';
import { prisma } from '@fedge/database';

@Injectable()
export class PromoService {
  async logDjSpin(artistId: string, stationName: string, djName: string, spinCount: string) {
    // 1. Find or Create the Contact dynamically
    let contact = await prisma.contact.findFirst({
       where: { name: djName, roleType: 'DJ' }
    });

    if (!contact) {
       contact = await prisma.contact.create({
          data: { name: djName, roleType: 'DJ' }
       });
    }

    // 2. Log the interaction with the Artist
    await prisma.contactRelationship.create({
       data: {
          artistId: artistId,
          contactId: contact.id,
          status: 'ACTIVE_SPINNING',
          notes: \`Logged \${spinCount} spins on station: \${stationName}\`
       }
    });

    return \`Successfully logged \${spinCount} spins by \${djName} at \${stationName} into the CRM.\`;
  }
}
