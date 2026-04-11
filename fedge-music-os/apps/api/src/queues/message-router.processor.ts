import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ChiefOfStaffService } from '../services/chief-of-staff.service';
import { OnboardingService } from '../services/onboarding.service';
import { WhatsAppService } from '../services/whatsapp.service';
import { prisma } from '@fedge/database';

@Processor('message-router')
export class MessageRouterProcessor extends WorkerHost {
  constructor(
    private readonly chiefOfStaff: ChiefOfStaffService,
    private readonly onboardingService: OnboardingService,
    private readonly whatsappService: WhatsAppService
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { from, text, profileName } = job.data;
    
    const user = await prisma.user.findUnique({ 
      where: { phone: from },
      include: { artistProfile: true }
    });

    // 1. Onboarding Gatekeeper Flow
    if (!user || !user.artistProfile) {
       console.log(\`[Gatekeeper] Triggering onboarding sequence for \${profileName} (\${from})\`);
       const reply = await this.onboardingService.handleNewUser(from, profileName);
       
       await this.whatsappService.sendMessage(from, reply);
       return 'ONBOARDING_INITIALIZED';
    }

    // 2. AI Orchestrator Main Branch
    console.log(\`[Router] Delegating to Chief of Staff for \${user.id}\`);
    const aiResponse = await this.chiefOfStaff.handleArtistMessage(user.id, text);
    
    await this.whatsappService.sendMessage(from, aiResponse);
    return 'PROCESSED';
  }
}
