import Anthropic from '@anthropic-ai/sdk';
import { ARTIST_CHIEF_OF_STAFF_PROMPT, CHIEF_OF_STAFF_TOOLS } from './prompts/artist_chief_of_staff';

export class AgentOrchestrator {
  private anthropic: Anthropic;

  constructor(apiKey: string) {
    this.anthropic = new Anthropic({
      apiKey: apiKey,
    });
  }

  async runChiefOfStaff(message: string, context: string) {
    const systemPrompt = \`\${ARTIST_CHIEF_OF_STAFF_PROMPT}\\n\\nCURRENT DRIVING CONTEXT:\\n\${context}\`;

    // Map internal tool schemas to Anthropic format
    const tools: Anthropic.Tool[] = CHIEF_OF_STAFF_TOOLS.map(t => ({
      name: t.name,
      description: t.description,
      input_schema: {
        type: 'object',
        properties: this.buildSchemaProps(t.schema),
        required: Object.keys(t.schema).filter(k => !t.schema[k as keyof typeof t.schema].startsWith('optional'))
      }
    }));

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      system: systemPrompt,
      max_tokens: 1024,
      messages: [{ role: 'user', content: message }],
      tools: tools,
    });

    return response;
  }

  private buildSchemaProps(schemaObj: any) {
    const props: any = {};
    for (const [key, typeDef] of Object.entries(schemaObj)) {
      props[key] = { type: (typeDef as string).replace('optional_', '') };
    }
    return props;
  }
}
