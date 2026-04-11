import { Injectable } from '@nestjs/common';
import { prisma } from '@fedge/database';
import { AgentOrchestrator } from '@fedge/agents';
import { CalendarService } from './calendar.service';

@Injectable()
export class ChiefOfStaffService {
  private orchestrator: AgentOrchestrator;
  
  constructor(private calendarService: CalendarService) {
    this.orchestrator = new AgentOrchestrator(process.env.ANTHROPIC_API_KEY || 'sk-test');
  }

  async handleArtistMessage(userId: string, message: string): Promise<string> {
    const artistProfile = await prisma.artistProfile.findUnique({ where: { userId }});
    if (!artistProfile) return "Artist Profile not found.";

    const todayTasks = await prisma.task.findMany({
      where: { artistId: artistProfile.id, status: 'TODO' }
    });

    const context = \`Context: You are speaking with \${artistProfile.stageName}. 
The artist has \${todayTasks.length} pending tasks:
\${todayTasks.map(t => \`- \${t.title} (Due: \${t.dueDate || 'No Date'})\`).join('\\n')}
\`;

    const response = await this.orchestrator.runChiefOfStaff(message, context);
    
    // Process Intercepted LLM Tool Calls
    for (const block of response.content) {
      if (block.type === 'tool_use') {
        const toolName = block.name;
        const toolInput = block.input as any;
        
        if (toolName === 'create_task') {
          console.log(\`[Tool] create_task triggered: \${toolInput.title}\`);
          await prisma.task.create({
            data: {
               artistId: artistProfile.id,
               title: toolInput.title,
               dueDate: toolInput.dueDate ? new Date(toolInput.dueDate) : null,
               sourceAgent: 'ARTIST_CHIEF_OF_STAFF'
            }
          });
          return \`Added "\${toolInput.title}" to your pending tasks schedule.\`;
        }

        if (toolName === 'schedule_event') {
          console.log(\`[Tool] schedule_event triggered: \${toolInput.title}\`);
          const start = new Date(toolInput.startTime);
          const end = new Date(toolInput.endTime);
          
          // 1. Save to local Postgres
          const calendarEvent = await prisma.calendarEvent.create({
             data: {
                artistId: artistProfile.id,
                title: toolInput.title,
                startTime: start,
                endTime: end
             }
          });

          // 2. Sync to External Google Calendar Cloud instantly
          const gcalId = await this.calendarService.pushToGoogle(userId, toolInput.title, start, end);
          
          if (gcalId) {
             // Link the external ID back to Postgres memory
             await prisma.calendarEvent.update({
                where: { id: calendarEvent.id },
                data: { externalId: gcalId }
             });
          }

          return \`Event scheduled: "\${toolInput.title}". It has been successfully pushed to your Google Calendar.\`;
        }
      }
    }

    const textBlock = response.content.find(b => b.type === 'text');
    return (textBlock as any)?.text || "Understood. Is there anything else you need me to schedule?";
  }

  async generateDailyBriefing(artistId: string) {}
}
