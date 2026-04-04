#!/bin/bash

# ============================================================
# COH: Telnyx + Eleven Labs Setup & Deployment Guide
# ============================================================
# This script guides you through integrating communications (SMS/video)
# and audio-enhanced course content with your platform.

echo "🚀 Cipher of Healing: Communications & Audio Enhancement Setup"
echo "=============================================================="

# Step 1: Get API Keys
echo "
STEP 1: Obtain API Credentials
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You'll need:

📱 TELNYX (SMS + Video Conferencing)
   1. Go to: https://portal.telnyx.com/
   2. Sign up / log in
   3. Under 'API Keys', generate a new key → save as TELNYX_API_KEY
   4. Also generate 'API V2' key → save as TELNYX_API_V2_KEY
   5. Get your dedicated phone number for SMS (Messages → Inbound)
      → save as TELNYX_PHONE_NUMBER (format: +1234567890)

🎙️ ELEVEN LABS (Text-to-Speech)
   1. Go to: https://elevenlabs.io/
   2. Sign up / log in
   3. Under 'API Keys', generate a new key → save as ELEVEN_LABS_API_KEY
   4. Under 'Voices', select or create a voice → copy Voice ID
      → save as ELEVEN_LABS_VOICE_ID (format: 21m00Tcm4TlvDq8ikWAM)

✅ When ready, press Enter to continue..."
read

# Step 2: Add to wrangler.toml
echo "
STEP 2: Update wrangler.toml
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Add to your [env.production] section in wrangler.toml:

  [env.production]
  vars = { ... your existing vars ... }
  
  # Add these:
  [env.production.secrets]
  TELNYX_API_KEY = \"your-key-here\"
  TELNYX_API_V2_KEY = \"your-v2-key-here\"
  TELNYX_PHONE_NUMBER = \"+1234567890\"
  ELEVEN_LABS_API_KEY = \"your-key-here\"
  ELEVEN_LABS_VOICE_ID = \"voice-id-here\"
"

# Step 3: Deploy
echo "
STEP 3: Deploy to Cloudflare Workers
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
From the root directory, run:

  npm run deploy

This will:
  ✓ Build the backend API
  ✓ Deploy to Cloudflare Workers with new secret keys
  ✓ Migrate database with new schema fields
  ✓ Make all new endpoints live
"

# Step 4: Test SMS
echo "
STEP 4: Test SMS Reminders
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Create a test appointment:
   - Go to /booking page
   - Select a service
   - Use your phone number
   - Make sure 'SMS Opt-In' is checked

2. Trigger reminders (admin):
   curl -X POST https://your-api.workers.dev/api/comms/appointments/send-reminders \\
     -H \"Authorization: Bearer YOUR_JWT_TOKEN\"

3. Check your phone for SMS reminder message

✅ SMS working? Press Enter to continue..."
read

# Step 5: Test Video Rooms
echo "
STEP 5: Test Telnyx RTC Video Rooms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Create a video room for an event (admin):
   curl -X POST https://your-api.workers.dev/api/comms/events/{eventId}/video-room \\
     -H \"Authorization: Bearer YOUR_JWT_TOKEN\"

   Response will include:
   {
     \"roomId\": \"uuid\",
     \"roomName\": \"event-slug-12345\",
     \"token\": \"video-token-here\",
     \"expiresAt\": \"2026-04-05T15:30:00Z\"
   }

2. Register for event as attendee, then get room token:
   curl https://your-api.workers.dev/api/comms/events/{eventId}/video-room \\
     -H \"Authorization: Bearer YOUR_JWT_TOKEN\"

✅ Video rooms working? Press Enter to continue..."
read

# Step 6: Audio for Courses
echo "
STEP 6: Add Audio Narration to Lessons
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The LessonViewer component supports audio automatically.

To add audio to a lesson:

1. Backend: Generate TTS using Eleven Labs
   import { generateAndUploadSpeech } from '@/utils/elevenlabs';
   
   const { audioUrl, durationSeconds } = await generateAndUploadSpeech(
     env.ELEVEN_LABS_API_KEY,
     env.ELEVEN_LABS_VOICE_ID,
     env.MEDIA,  // R2 bucket
     lessonId,
     lessonTextContent
   );

2. Save to database:
   UPDATE lessons 
   SET audioNarrationUrl = audioUrl,
       audioNarrationDurationSeconds = durationSeconds,
       hasTranscript = true
   WHERE id = lessonId;

3. Frontend: LessonViewer auto-detects audio:
   <LessonViewer lesson={lesson} onComplete={handleComplete} />
   
   Shows:
   ✓ Play/Pause buttons
   ✓ Progress bar
   ✓ Transcript toggle
   ✓ Duration display

📚 Lessons with audio are ready for students!
"

# Step 7: Admin Dashboard
echo "
STEP 7: (OPTIONAL) Create Admin Dashboard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You can add admin controls to send reminders in batch:

Button 1: 'Send Appointment Reminders'
  → POST /api/comms/appointments/send-reminders
  → Returns: list of sent SMS + failures

Button 2: 'Send Event Reminders'  
  → POST /api/comms/events/send-reminders
  → Returns: count of messages sent

Button 3: 'Create Event Video Room'
  → POST /api/comms/events/{eventId}/video-room
  → Returns: room token + meeting link for attendees

See AdminDashboard.tsx example for implementation.
"

# Completion
echo "
✅ SETUP COMPLETE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your platform now has:
✓ SMS appointment reminders (reduces no-shows)
✓ Telnyx RTC video rooms (integrated webinars)
✓ Audio-narrated course lessons (Eleven Labs TTS)
✓ Transcript support (accessibility)
✓ Smart practitioner coordination

Next: Monitor your Telnyx & Eleven Labs dashboards for usage.

Questions? Check the implementation guide:
/memories/session/telnyx-elevenlabs-implementation.md
"
