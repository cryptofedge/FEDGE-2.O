import { Controller, Post, Headers, Body, HttpCode } from '@nestjs/common';
import { CalendarService } from '../services/calendar.service';

@Controller('webhooks/google-calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  @HttpCode(200)
  async handleGoogleWebhook(
    @Headers() headers: any,
    @Body() body: any
  ) {
    if (!headers['x-goog-channel-id']) {
      return 'Invalid Hook';
    }
    
    // Pass the headers off to the service to decipher the Google Sync State
    await this.calendarService.handleInboundGoogleWebhook(headers, body);
    
    // Always return 200 Fast to Google to prevent backlogs
    return 'OK';
  }
}
