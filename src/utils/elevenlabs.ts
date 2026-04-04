/**
 * Eleven Labs Text-to-Speech Integration (Official SDK)
 * Generate high-quality audio narration for course lessons
 *
 * Uses the official @elevenlabs/elevenlabs-js SDK for:
 * - Automatic retry logic
 * - Type-safe API calls
 * - Built-in error handling
 * - Support for all Eleven Labs features
 */

import * as ElevenLabsSDK from '@elevenlabs/elevenlabs-js';

export interface AudioGenerationOptions {
  text: string;
  voiceId: string;
  modelId?: string; // 'eleven_multilingual_v2' | 'eleven_monolingual_v1'
  stability?: number; // 0-1 (0.5 recommended)
  similarityBoost?: number; // 0-1 (0.75 recommended)
  outputFormat?: string; // 'mp3_44100_128' | 'mp3_22050_32' | etc.
}

export interface AudioResult {
  audioBlob: Blob;
  durationSeconds: number;
  format: string;
  modelUsed: string;
}

export interface StoredAudio {
  audioUrl: string;
  durationSeconds: number;
  format: string;
  storedAt: string;
}

// Singleton client instance
let _client: ElevenLabsSDK.ElevenLabsClient | null = null;

/**
 * Initialize Eleven Labs SDK client
 * Called once at startup, reused for all requests
 */
export function initElevenLabsClient(apiKey: string): ElevenLabsSDK.ElevenLabsClient {
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is required but not set');
  }

  if (!_client) {
    _client = new ElevenLabsSDK.ElevenLabsClient({ apiKey });
  }

  return _client;
}

/**
 * Get the initialized client (must call initElevenLabsClient first)
 */
export function getElevenLabsClient(): ElevenLabsSDK.ElevenLabsClient {
  if (!_client) {
    throw new Error('Eleven Labs client not initialized. Call initElevenLabsClient first.');
  }
  return _client;
}

/**
 * Generate audio using the Eleven Labs SDK
 * Returns Blob format ready for storage or playback
 */
export async function generateAudioWithSDK(
  client: ElevenLabsSDK.ElevenLabsClient,
  voiceId: string,
  options: AudioGenerationOptions
): Promise<AudioResult> {
  if (!options.text || options.text.trim().length === 0) {
    throw new Error('Text is required for audio generation');
  }

  if (!voiceId) {
    throw new Error('Voice ID is required');
  }

  const modelId = options.modelId || 'eleven_multilingual_v2';
  const outputFormat = (options.outputFormat || 'mp3_44100_128') as 'mp3_44100_128' | 'mp3_22050_32';

  try {
    const audio = await client.textToSpeech.convert(voiceId, {
      text: options.text,
      modelId: modelId as 'eleven_multilingual_v2' | 'eleven_monolingual_v1',
      outputFormat,
      voiceSettings: {
        stability: options.stability ?? 0.5,
        similarityBoost: options.similarityBoost ?? 0.75,
      },
    });

    // Convert ReadableStream to Blob
    const reader = audio.getReader?.();
    const chunks: Uint8Array[] = [];
    
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value instanceof Uint8Array) {
          chunks.push(value);
        }
      }
    } else if (audio instanceof Uint8Array) {
      // Handle if audio is already Uint8Array
      chunks.push(audio);
    } else if (audio instanceof Blob) {
      // Handle if audio is already a Blob
      return {
        audioBlob: audio,
        durationSeconds: Math.round((audio.size * 8) / (128 * 1000)),
        format: 'mp3',
        modelUsed: modelId,
      };
    }

    const audioBlob = new Blob(chunks, { type: 'audio/mpeg' });

    // Estimate duration: MP3 at 128kbps = (bytes * 8) / (128 * 1000)
    const durationSeconds = Math.round((audioBlob.size * 8) / (128 * 1000));

    return {
      audioBlob,
      durationSeconds,
      format: 'mp3',
      modelUsed: modelId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Eleven Labs TTS failed: ${message}`);
  }
}

/**
 * Upload audio Blob to R2 bucket
 * Handles CORS headers and caching for CDN
 */
export async function uploadAudioToR2(
  bucket: R2Bucket,
  audioBlob: Blob,
  keyPath: string
): Promise<string> {
  if (!bucket) {
    throw new Error('R2 bucket is required');
  }

  if (!keyPath) {
    throw new Error('Key path is required for R2 upload');
  }

  try {
    // Convert Blob to Uint8Array for R2
    const arrayBuffer = await audioBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload with proper headers
    await bucket.put(keyPath, uint8Array, {
      httpMetadata: {
        contentType: 'audio/mpeg',
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        format: 'mp3',
      },
    });

    // Return R2 URL (update this with your actual R2 domain)
    return `https://cdn.cipherofhealing.com/${keyPath}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`R2 upload failed: ${message}`);
  }
}

/**
 * End-to-end: Generate audio and store in R2
 * Production-ready function used by admin endpoints
 */
export async function generateAndStoreAudio(
  client: ElevenLabsSDK.ElevenLabsClient,
  voiceId: string,
  bucket: R2Bucket,
  lessonId: string,
  text: string,
  options?: Partial<AudioGenerationOptions>
): Promise<StoredAudio> {
  // Generate audio
  const audioResult = await generateAudioWithSDK(client, voiceId, {
    text,
    voiceId,
    modelId: options?.modelId,
    stability: options?.stability,
    similarityBoost: options?.similarityBoost,
    outputFormat: options?.outputFormat,
  });

  // Upload to R2
  const keyPath = `lessons/${lessonId}/narration.mp3`;
  const audioUrl = await uploadAudioToR2(bucket, audioResult.audioBlob, keyPath);

  return {
    audioUrl,
    durationSeconds: audioResult.durationSeconds,
    format: audioResult.format,
    storedAt: new Date().toISOString(),
  };
}

/**
 * Generate audio for multiple lessons in parallel
 * Useful for course launches or bulk operations
 */
export async function generateBatchAudio(
  client: ElevenLabsSDK.ElevenLabsClient,
  voiceId: string,
  bucket: R2Bucket,
  lessons: Array<{ id: string; text: string }>,
  options?: Partial<AudioGenerationOptions>
): Promise<
  Array<{
    id: string;
    success: boolean;
    audioUrl?: string;
    durationSeconds?: number;
    error?: string;
  }>
> {
  const results = await Promise.allSettled(
    lessons.map((lesson) =>
      generateAndStoreAudio(client, voiceId, bucket, lesson.id, lesson.text, options).then(
        (result) => ({
          id: lesson.id,
          success: true as const,
          audioUrl: result.audioUrl,
          durationSeconds: result.durationSeconds,
        })
      )
    )
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        id: lessons[index].id,
        success: false as const,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      };
    }
  });
}

/**
 * Calculate audio duration from Blob size (MP3 at 128kbps)
 * More accurate calculation if needed
 */
export function calculateAudioDuration(audioBlob: Blob, bitrateKbps: number = 128): number {
  // Formula: duration = (size in bits) / (bitrate in bits per second)
  const sizeInBits = audioBlob.size * 8;
  const bitrateInBits = bitrateKbps * 1000;
  return Math.round(sizeInBits / bitrateInBits);
}

/**
 * Format lesson content for narration (clean up markdown, etc.)
 * Makes text suitable for natural speech
 */
export function formatLessonForNarration(textContent: string): string {
  return (
    textContent
      // Remove markdown bold/italic
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      // Remove links but keep text
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      // Remove headings but keep text
      .replace(/^#+\s+(.+?)$/gm, '$1')
      // Remove code blocks but keep content
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`(.+?)`/g, '$1')
      // Remove HTML tags
      .replace(/<[^>]+>/g, '')
      // Clean extra whitespace
      .replace(/\n\n+/g, '\n\n')
      .trim()
  );
}

/**
 * Split long text into chunks for TTS
 * Eleven Labs has character limits per request
 */
export function chunkTextForTTS(
  text: string,
  maxChars: number = 3000
): string[] {
  const chunks: string[] = [];
  let currentChunk = '';

  // Split by sentences while respecting maxChars
  const sentences = text.split(/(?<=[.!?])\s+/);

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChars) {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}

/**
 * Generate and concatenate audio for long text
 * Splits text, generates chunks, returns merged audio
 */
export async function generateLongAudio(
  client: ElevenLabsSDK.ElevenLabsClient,
  voiceId: string,
  text: string,
  options?: Partial<AudioGenerationOptions>
): Promise<AudioResult> {
  const chunks = chunkTextForTTS(text, 3000);

  if (chunks.length === 1) {
    // Simple case: text fits in one request
    return generateAudioWithSDK(client, voiceId, {
      text: chunks[0],
      voiceId,
      ...options,
    });
  }

  // Complex case: generate multiple chunks and merge
  console.log(`Generating ${chunks.length} audio chunks...`);

  const audioChunks = await Promise.all(
    chunks.map((chunk) =>
      generateAudioWithSDK(client, voiceId, {
        text: chunk,
        voiceId,
        ...options,
      })
    )
  );

  // Merge audio blobs
  const mergedBuffer = await mergeAudioBlobs(audioChunks.map((c) => c.audioBlob));
  const totalDuration = audioChunks.reduce((sum, c) => sum + c.durationSeconds, 0);

  return {
    audioBlob: mergedBuffer,
    durationSeconds: totalDuration,
    format: 'mp3',
    modelUsed: options?.modelId || 'eleven_multilingual_v2',
  };
}

/**
 * Merge multiple audio Blobs into one
 * Simple concatenation (works for MP3s with same bitrate)
 */
async function mergeAudioBlobs(blobs: Blob[]): Promise<Blob> {
  if (blobs.length === 0) {
    throw new Error('No audio blobs to merge');
  }

  if (blobs.length === 1) {
    return blobs[0];
  }

  // Concatenate all blobs
  const arrayBuffers = await Promise.all(blobs.map((b) => b.arrayBuffer()));
  const mergedBuffer = new Uint8Array(
    arrayBuffers.reduce((sum, buffer) => sum + buffer.byteLength, 0)
  );

  let offset = 0;
  for (const buffer of arrayBuffers) {
    mergedBuffer.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }

  return new Blob([mergedBuffer], { type: 'audio/mpeg' });
}

/**
 * Create metadata object for stored audio
 * Useful for tracking generation details
 */
export function createAudioMetadata(
  lessonId: string,
  lessonTitle: string,
  voiceId: string,
  modelId: string = 'eleven_multilingual_v2'
) {
  return {
    lessonId,
    title: lessonTitle,
    voiceId,
    model: modelId,
    generatedAt: new Date().toISOString(),
    format: 'mp3',
    bitrate: '128k',
    sdk: '@elevenlabs/elevenlabs-js',
  };
}

/**
 * Validate Eleven Labs credentials before use
 * Call at startup to catch config issues early
 */
export async function validateElevenLabsConfig(client: ElevenLabsSDK.ElevenLabsClient): Promise<boolean> {
  try {
    // Try to get account info (lightweight API call)
    // If this fails, credentials are invalid
    const voice = await client.voices.get('21m00Tcm4TlvDq8ikWAM'); // Default voice
    return !!voice;
  } catch (error) {
    console.error('Eleven Labs config validation failed:', error);
    return false;
  }
}
