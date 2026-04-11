import { Controller, Get, Post, Body, Headers, HttpCode, Query } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Controller('webhooks/whatsapp')
export class WhatsappController {
  constructor(
    @InjectQueue('message-router') private readonly messageQueue: Queue,
  ) {}

  @Get()
  verifyChallenge(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string
  ) {
     // Optional: Validate that 'token' matches your internal VERIFY_TOKEN if set.
     if (mode === 'subscribe' && challenge) {
        return challenge;
     }
     return 'Invalid Request';
  }

  @Post()
  @HttpCode(200)
  async handleIncomingMessage(
    @Body() payload: any,
    @Headers('x-hub-signature-256') signature: string,
  ) {
    // 1. Verify Meta Signature here (Skipped for boilerplate simplicity)

    // 2. Extract message details from WhatsApp Cloud API's nested structure
    if (payload.object === 'whatsapp_business_account') {
       for (const entry of payload.entry) {
         for (const change of entry.changes) {
            const value = change.value;
            const contactInfo = value?.contacts?.[0];
            const messageDetails = value?.messages?.[0];

            if (messageDetails && messageDetails.type === 'text') {
               // 3. Offload heavy processing to BullMQ worker
               await this.messageQueue.add('inbound-message', {
                 from: messageDetails.from,
                 text: messageDetails.text?.body,
                 profileName: contactInfo?.profile?.name,
                 timestamp: messageDetails.timestamp,
               });
            }
         }
       }
    }

    // Must return 200 OK rapidly to Meta to prevent retries
    return 'EVENT_RECEIVED';
  }
}
