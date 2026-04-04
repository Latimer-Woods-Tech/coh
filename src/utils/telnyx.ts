/**
 * Telnyx Integration Utilities
 * SMS reminders, voice calls, and RTC room management
 */

export interface TelnyxSmsOptions {
  to: string;
  message: string;
  from?: string;
}

export interface TelnyxRTCRoomOptions {
  roomName: string;
  maxParticipants?: number;
  recordingEnabled?: boolean;
  expirationTime?: number; // seconds
}

export interface TelnyxVideoToken {
  token: string;
  roomName: string;
  expiresAt: string;
}

/** Send SMS via Telnyx API */
export async function sendSms(
  apiKey: string,
  phoneNumber: string,
  options: TelnyxSmsOptions
): Promise<{ messageId: string; status: string }> {
  const response = await fetch('https://api.telnyx.com/v2/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: options.from || phoneNumber,
      to: options.to,
      text: options.message,
    }),
  });

  if (!response.ok) {
    const error = (await response.json()) as any;
    throw new Error(`Telnyx SMS failed: ${error?.errors?.[0]?.detail || response.statusText}`);
  }

  const data = (await response.json()) as any;
  return {
    messageId: data?.data?.id as string,
    status: data?.data?.status as string,
  };
}

/** Create Telnyx RTC room and generate token */
export async function createRTCRoom(
  apiKey: string,
  options: TelnyxRTCRoomOptions
): Promise<{ roomId: string; token: string; expiresAt: string }> {
  // Create room
  const roomResponse = await fetch('https://api.telnyx.com/v2/video/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      unique_name: options.roomName,
      max_participants: options.maxParticipants || 50,
      record_on_start: options.recordingEnabled || false,
    }),
  });

  if (!roomResponse.ok) {
    const error = (await roomResponse.json()) as any;
    throw new Error(`Failed to create RTC room: ${error?.errors?.[0]?.detail || roomResponse.statusText}`);
  }

  const roomData = (await roomResponse.json()) as any;
  const roomId = roomData?.data?.id as string;

  // Generate participant token
  const expiresAt = new Date(Date.now() + (options.expirationTime || 3600) * 1000);
  const tokenResponse = await fetch(`https://api.telnyx.com/v2/video/rooms/${roomId}/participants/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      participant_name: 'participant',
      permissions: {
        can_publish: true,
        can_subscribe: true,
      },
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Failed to generate RTC token: ${tokenResponse.statusText}`);
  }

  const tokenData = (await tokenResponse.json()) as any;
  return {
    roomId,
    token: tokenData?.data?.token as string,
    expiresAt: expiresAt.toISOString(),
  };
}

/** Format phone number for SMS (international format) */
export function formatPhoneForSms(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // If 10 digits (US), prepend +1
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // If already has country code
  if (cleaned.length > 10) {
    return `+${cleaned}`;
  }
  
  // Fallback: return as-is
  return phone;
}

/** Build appointment reminder message */
export function buildAppointmentReminder(
  appointmentDate: Date,
  serviceName: string,
  practitionerName: string = 'The Cypher'
): string {
  const time = appointmentDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  });

  const day = appointmentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    timeZone: 'America/New_York',
  });

  return `Reminder: Your ${serviceName} session with ${practitionerName} is ${day} at ${time} EST. Confirm here: [link]`;
}

/** Build event registration reminder message */
export function buildEventReminder(eventTitle: string, eventDate: Date): string {
  const time = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  });

  return `Join us for "${eventTitle}" on ${eventDate.toLocaleDateString()} at ${time} EST. Get your link: [link]`;
}
