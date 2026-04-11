import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { prisma } from '@fedge/database';

@Injectable()
export class CalendarService {
  private oauth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  async pushToGoogle(artistUserId: string, title: string, startTime: Date, endTime: Date) {
    const user = await prisma.user.findUnique({ where: { id: artistUserId } });
    if (!user || !user.googleRefreshToken) {
       console.log('[CalendarService] User has not authenticated with Google. Skipping push.');
       return;
    }

    this.oauth2Client.setCredentials({
       access_token: user.googleAccessToken,
       refresh_token: user.googleRefreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    try {
       const response = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: {
             summary: title,
             start: { dateTime: startTime.toISOString() },
             end: { dateTime: endTime.toISOString() }
          }
       });
       console.log(\`[CalendarService] Successfully pushed "\${title}" to Google Calendar (ID: \${response.data.id})\`);
       return response.data.id;
    } catch (e) {
       console.error('[CalendarService] Failed to insert event into Google Calendar:', e);
    }
  }

  async handleInboundGoogleWebhook(headers: any, body: any) {
    // When Google fires a notification that a calendar changed:
    const channelId = headers['x-goog-channel-id'];
    const resourceId = headers['x-goog-resource-id'];
    const resourceState = headers['x-goog-resource-state'];
    
    if (resourceState === 'sync') {
       return 'SYNC_ACKNOWLEDGED';
    }

    console.log('[CalendarService] Inbound Google Sync Triggered.', { channelId, resourceId });
    // Production logic will do a calendar.events.list() with syncToken to pull the exact changes
    // and write them back into our Prisma 'CalendarEvent' table.
    return 'PROCESSED';
  }
}
