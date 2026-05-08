declare module '@elevenlabs/elevenlabs-js' {
  export class ElevenLabsClient {
    constructor(options: { apiKey: string });
    textToSpeech: {
      convert(voiceId: string, options: Record<string, unknown>): Promise<ReadableStream<Uint8Array>>;
    };
    voices: {
      getAll(): Promise<{ voices: Array<Record<string, unknown>> }>;
      get(voiceId: string): Promise<Record<string, unknown>>;
    };
  }
}
