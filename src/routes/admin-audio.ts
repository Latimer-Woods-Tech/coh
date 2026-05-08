import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, inArray } from 'drizzle-orm';
import { createDb } from '../db';
import { lessons } from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import {
  initElevenLabsClient,
  generateAudioWithSDK,
  generateAndStoreAudio,
  generateBatchAudio,
  formatLessonForNarration,
  validateElevenLabsConfig,
} from '../utils/elevenlabs';
import type { Env, Variables } from '../types/env';

const adminAudio = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * ─── POST /api/admin/audio/test ───
 * Test Eleven Labs SDK integration
 * No database writes, safe to call multiple times
 */
adminAudio.post('/test', authMiddleware, zValidator('json', z.object({
  text: z.string().min(10, 'Text must be at least 10 characters'),
  voiceId: z.string().optional(),
  modelId: z.string().optional(),
  stability: z.number().min(0).max(1).optional(),
  similarityBoost: z.number().min(0).max(1).optional(),
})), async (c) => {
  const role = c.get('userRole');
  if (role !== 'admin') {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403);
  }

  const { text, voiceId, modelId, stability, similarityBoost } = c.req.valid('json');

  try {
    // Initialize client
    const client = initElevenLabsClient(c.env.ELEVENLABS_API_KEY);

    // Validate config
    const isValid = await validateElevenLabsConfig(client);
    if (!isValid) {
      return c.json({
        error: 'Eleven Labs API key is invalid or unreachable',
        code: 'INVALID_API_KEY',
      }, 401);
    }

    // Generate audio (no storage)
    const audioResult = await generateAudioWithSDK(client, voiceId || c.env.ELEVEN_LABS_VOICE_ID, {
      text,
      voiceId: voiceId || c.env.ELEVEN_LABS_VOICE_ID,
      modelId,
      stability,
      similarityBoost,
    });

    // Return audio as blob for browser playback
    const arrayBuffer = await audioResult.audioBlob.arrayBuffer();
    return c.body(new Uint8Array(arrayBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline; filename="test-audio.mp3"',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({
      error: 'Audio generation failed',
      details: message,
      code: 'AUDIO_GENERATION_ERROR',
    }, 500);
  }
});

/**
 * ─── POST /api/admin/audio/lessons/:lessonId ───
 * Generate and store audio for a single lesson
 * Updates database with audio URL and duration
 */
adminAudio.post('/lessons/:lessonId', authMiddleware, zValidator('json', z.object({
  text: z.string().optional(), // If not provided, will fetch from DB
  voiceId: z.string().optional(),
  modelId: z.string().optional(),
  stability: z.number().min(0).max(1).optional(),
  similarityBoost: z.number().min(0).max(1).optional(),
  force: z.boolean().optional(), // Regenerate even if audio exists
})), async (c) => {
  const role = c.get('userRole');
  if (role !== 'admin') {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403);
  }

  const { lessonId } = c.req.param();
  const { text, voiceId, modelId, stability, similarityBoost, force } = c.req.valid('json');

  try {
    const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);

    // Fetch lesson from database
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1);

    if (!lesson) {
      return c.json({ error: 'Lesson not found' }, 404);
    }

    // Check if audio already exists
    if (lesson.audioNarrationUrl && !force) {
      return c.json({
        error: 'Audio already exists for this lesson',
        code: 'AUDIO_EXISTS',
        audioUrl: lesson.audioNarrationUrl,
        durationSeconds: lesson.audioNarrationDurationSeconds,
      }, 409);
    }

    // Determine text source
    const textContent = text || lesson.textContent;
    if (!textContent) {
      return c.json({
        error: 'No text content provided or found in lesson',
        code: 'NO_TEXT_CONTENT',
      }, 400);
    }

    // Clean up markdown
    const cleanText = formatLessonForNarration(textContent);

    // Initialize client
    const client = initElevenLabsClient(c.env.ELEVENLABS_API_KEY);

    // Generate and store audio
    const audioResult = await generateAndStoreAudio(
      client,
      voiceId || c.env.ELEVEN_LABS_VOICE_ID,
      c.env.MEDIA,
      lessonId,
      cleanText,
      { modelId, stability, similarityBoost }
    );

    // Update lesson in database
    await db
      .update(lessons)
      .set({
        audioNarrationUrl: audioResult.audioUrl,
        audioNarrationDurationSeconds: audioResult.durationSeconds,
        hasTranscript: lesson.hasTranscript || false, // Preserve existing value
      })
      .where(eq(lessons.id, lessonId));

    return c.json({
      success: true,
      data: {
        lessonId,
        lessonTitle: lesson.title,
        audioUrl: audioResult.audioUrl,
        durationSeconds: audioResult.durationSeconds,
        format: audioResult.format,
        storedAt: audioResult.storedAt,
        modelUsed: audioResult.format, // Store which model was used
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({
      error: 'Audio generation failed',
      details: message,
      code: 'AUDIO_GENERATION_ERROR',
    }, 500);
  }
});

/**
 * ─── POST /api/admin/audio/batch ───
 * Generate audio for multiple lessons in parallel
 * Useful for course launches
 */
adminAudio.post('/batch', authMiddleware, zValidator('json', z.object({
  lessonIds: z.array(z.string().uuid()).optional(),
  courseId: z.string().uuid().optional(), // If provided, generate for all lessons in course
  voiceId: z.string().optional(),
  modelId: z.string().optional(),
  force: z.boolean().optional(),
})), async (c) => {
  const role = c.get('userRole');
  if (role !== 'admin') {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403);
  }

  const { lessonIds, courseId, voiceId, modelId, force } = c.req.valid('json');

  if (!lessonIds && !courseId) {
    return c.json({
      error: 'Either lessonIds or courseId is required',
      code: 'MISSING_PARAMS',
    }, 400);
  }

  try {
    const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);

    // Fetch lessons to process
    let lessonsToProcess: typeof lessons.$inferSelect[] = [];

    if (lessonIds) {
      lessonsToProcess = await db.select().from(lessons)
        .where(inArray(lessons.id, lessonIds));
    } else if (courseId) {
      // Would need moduleId join, simplified for now
      lessonsToProcess = await db.select().from(lessons)
        .limit(100); // Placeholder
    }

    if (lessonsToProcess.length === 0) {
      return c.json({
        error: 'No lessons found to process',
        code: 'NO_LESSONS',
      }, 404);
    }

    // Prepare batch data
    const batchData: Array<{ id: string; text: string }> = lessonsToProcess
      .filter(l => force || !l.audioNarrationUrl) // Skip if audio exists (unless force)
      .filter(l => l.textContent) // Skip if no text
      .map(l => ({
        id: l.id,
        text: formatLessonForNarration(l.textContent as string),
      }));

    if (batchData.length === 0) {
      return c.json({
        message: 'No lessons needed audio generation',
        skipped: lessonsToProcess.length,
      });
    }

    // Initialize client
    const client = initElevenLabsClient(c.env.ELEVENLABS_API_KEY);

    // Generate audio for all in parallel
    const results = await generateBatchAudio(
      client,
      voiceId || c.env.ELEVEN_LABS_VOICE_ID,
      c.env.MEDIA,
      batchData,
      { modelId }
    );

    // Update database for successful generations
    const successful = [];
    const failed = [];

    for (const result of results) {
      if (result.success && result.audioUrl && result.durationSeconds !== undefined) {
        await db
          .update(lessons)
          .set({
            audioNarrationUrl: result.audioUrl,
            audioNarrationDurationSeconds: result.durationSeconds,
          })
          .where(eq(lessons.id, result.id));

        successful.push({
          lessonId: result.id,
          audioUrl: result.audioUrl,
          durationSeconds: result.durationSeconds,
        });
      } else {
        failed.push({
          lessonId: result.id,
          error: result.error || 'Unknown error',
        });
      }
    }

    return c.json({
      message: 'Batch audio generation complete',
      summary: {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
      },
      successful,
      failed,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({
      error: 'Batch audio generation failed',
      details: message,
      code: 'BATCH_GENERATION_ERROR',
    }, 500);
  }
});

/**
 * ─── GET /api/admin/audio/status ───
 * Check Eleven Labs SDK status and configuration
 */
adminAudio.get('/status', authMiddleware, async (c) => {
  const role = c.get('userRole');
  if (role !== 'admin') {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  try {
    const client = initElevenLabsClient(c.env.ELEVENLABS_API_KEY);
    const isValid = await validateElevenLabsConfig(client);

    return c.json({
      status: isValid ? 'operational' : 'invalid_credentials',
      config: {
        apiKeySet: !!c.env.ELEVENLABS_API_KEY,
        voiceIdSet: !!c.env.ELEVEN_LABS_VOICE_ID,
        voiceId: c.env.ELEVEN_LABS_VOICE_ID || 'not set',
        modelId: c.env.ELEVEN_LABS_MODEL_ID || 'eleven_multilingual_v2',
        outputFormat: c.env.ELEVEN_LABS_OUTPUT_FORMAT || 'mp3_44100_128',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json({
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

export default adminAudio;
