import { Injectable } from '@nestjs/common';
import { prisma } from '@fedge/database';

@Injectable()
export class ScoutingService {
  async evaluateArtist(operatorArtistProfileId: string, prospectName: string, scoreTotal: string, evaluationNotes: string) {
    
    // In this Architecture, the ArtistProfile making the command operates as the logging entity (i.e. the Label/A&R rep)
    const report = await prisma.scoutingReport.create({
       data: {
          artistId: operatorArtistProfileId, 
          score: parseInt(scoreTotal),
          notes: \`[Prospect: \${prospectName}] \${evaluationNotes}\`
       }
    });

    return \`Scouting Report for \${prospectName} successfully saved. Final A&R Score: \${scoreTotal}/100.\`;
  }
}
