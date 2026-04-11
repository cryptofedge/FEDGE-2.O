import { Injectable } from '@nestjs/common';
import { prisma } from '@fedge/database';

@Injectable()
export class AnalyticsService {
  async getSystemOverview() {
    const totalArtists = await prisma.artistProfile.count();
    
    // Aggregation: Find how many predictive red flags were hit
    const legalTasks = await prisma.task.count({
      where: { sourceAgent: 'CONTRACT_TRIAGE' }
    });

    const activeAITasks = await prisma.task.count({
      where: { status: 'TODO', sourceAgent: { not: null } }
    });

    // Sub-query to fetch average A&R score
    const agg = await prisma.scoutingReport.aggregate({
      _avg: { score: true }
    });
    
    return {
       totalArtists,
       activeAITasks,
       blockedLegalThreats: legalTasks,
       averageProspectScore: agg._avg.score ? Math.round(agg._avg.score) : 0
    };
  }
}
