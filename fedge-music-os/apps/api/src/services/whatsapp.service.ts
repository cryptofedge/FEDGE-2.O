import { Injectable } from '@nestjs/common';

@Injectable()
export class WhatsAppService {
  private readonly GRAPH_API_URL = 'https://graph.facebook.com/v19.0';
  private readonly phoneNumberId: string;
  private readonly apiToken: string;

  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.apiToken = process.env.WHATSAPP_API_TOKEN || '';
  }

  async sendMessage(toPhone: string, text: string) {
    if (!this.phoneNumberId || !this.apiToken) {
       console.warn('[WhatsAppService] Missing credentials. Simulating outbound message:', text);
       return;
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'text',
      text: {
        body: text
      }
    };

    try {
      const response = await fetch(\`\${this.GRAPH_API_URL}/\${this.phoneNumberId}/messages\`, {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${this.apiToken}\`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
         const err = await response.json();
         console.error('[WhatsAppService] Failed to send message:', err);
      }
      
      return response.ok;
    } catch (e) {
      console.error('[WhatsAppService] Network exception trying to reach Meta API.', e);
      return false;
    }
  }
}
