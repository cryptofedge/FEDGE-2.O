import { Injectable } from '@nestjs/common';
import { prisma } from '@fedge/database';

@Injectable()
export class ContractService {
  async logContractReview(artistId: string, documentName: string, extractedSplits: string, redFlags: string, riskLevel: string) {
    
    // Create a high-priority system task bound exactly to the Artist
    // This forces human lawyers/managers to clear the obstacle before AI considers the document safe.
    const task = await prisma.task.create({
       data: {
          artistId: artistId,
          title: \`LEGAL REVIEW REQUIRED: \${documentName}\`,
          status: 'TODO',
          description: \`RISK: \${riskLevel}\\nSPLITS: \${extractedSplits}\\nRED FLAGS: \${redFlags}\\n[SYSTEM HALT]: Do not sign until human attorney overrides this warning.\`,
          sourceAgent: 'CONTRACT_TRIAGE'
       }
    });

    return \`Contract \${documentName} has been flagged for human review. Identified Risk Level: \${riskLevel}. Task \${task.id} placed in OS Commander.\`;
  }
}
