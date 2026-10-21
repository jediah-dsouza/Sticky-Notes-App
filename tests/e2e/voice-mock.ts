// Serialized into the page before React loads. No microphone or network required.
export function installSpeechMock() {
  type Segment = [string, boolean];
  type Controller = {
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onerror: ((event: { error: string }) => void) | null;
    onresult: ((event: { results: unknown }) => void) | null;
    starts: number;
    stops: number;
    aborts: number;
  };
  const instances: Controller[] = [];
  const scope = window as unknown as Record<string, unknown>;
  class MockRecognition {
    continuous = false;
    interimResults = false;
    lang = '';
    onstart = null;
    onend = null;
    onerror = null;
    onresult = null;
    starts = 0;
    stops = 0;
    aborts = 0;
    constructor() {
      instances.push(this);
    }
    start() {
      this.starts++;
    }
    stop() {
      this.stops++;
    }
    abort() {
      this.aborts++;
    }
  }
  scope.SpeechRecognition = MockRecognition;
  scope.webkitSpeechRecognition = undefined;
  scope.voiceTest = {
    count: () => instances.length,
    listening: () => instances.at(-1)?.onstart?.(),
    end: () => instances.at(-1)?.onend?.(),
    error: (error: string) => instances.at(-1)?.onerror?.({ error }),
    result: (segments: Segment[]) =>
      instances.at(-1)?.onresult?.({
        results: segments.map(([transcript, isFinal]) =>
          Object.assign([{ transcript, confidence: 1 }], { isFinal }),
        ),
      }),
  };
}
export interface VoiceTest {
  count(): number;
  listening(): void;
  end(): void;
  error(code: string): void;
  result(segments: [string, boolean][]): void;
}
declare global {
  interface Window {
    voiceTest: VoiceTest;
  }
}
