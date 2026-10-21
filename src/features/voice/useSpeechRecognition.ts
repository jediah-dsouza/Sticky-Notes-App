import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

// lib.dom provides result/error events, but not the vendor recognition controller.
export interface RecognitionController {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: Pick<SpeechRecognitionEvent, 'results'>) => void) | null;
  onerror: ((event: Pick<SpeechRecognitionErrorEvent, 'error'>) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SpeechWindow = Window & {
  SpeechRecognition?: new () => RecognitionController;
  webkitSpeechRecognition?: new () => RecognitionController;
};
type State =
  'unavailable' | 'idle' | 'starting' | 'listening' | 'processing' | 'error';
const errors: Record<string, string> = {
  'not-allowed':
    'Microphone permission was denied. Allow microphone access in your browser’s site settings, then try again. You can still type.',
  'service-not-allowed':
    'Your browser or device has blocked the speech service. Check its speech settings or continue typing.',
  'audio-capture':
    'No microphone is available. Check that a microphone is connected and allowed, then try again.',
  'no-speech':
    'No speech was recognized. Try again when ready, or continue typing.',
  network:
    'The speech service could not connect. Check your connection, then try again or continue typing.',
  aborted:
    'Dictation was interrupted. Your finalized text is still here. Start again when ready.',
  'language-not-supported':
    'The speech service does not support this page’s language. You can still type your note.',
};
function capability() {
  const scope = window as SpeechWindow;
  if (window.isSecureContext === false)
    return {
      reason:
        'Dictation needs HTTPS or localhost. You can still type your note.',
    };
  const Controller = scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
  return typeof Controller === 'function'
    ? { Controller, reason: '' }
    : {
        reason:
          'Voice input isn’t available in this browser. You can still type your note.',
      };
}

export function useSpeechRecognition(onFinal: (text: string) => void) {
  const [support] = useState(capability);
  const [state, setState] = useState<State>(
    support.Controller ? 'idle' : 'unavailable',
  );
  const [message, setMessage] = useState(
    support.reason || 'Dictation is ready.',
  );
  const [interim, setInterim] = useState('');
  const callback = useRef(onFinal);
  useLayoutEffect(() => {
    callback.current = onFinal;
  }, [onFinal]);
  const session = useRef<{
    recognition: RecognitionController;
    stopping: boolean;
    finals: Set<number>;
    timer?: ReturnType<typeof setTimeout>;
  } | null>(null);

  const release = useCallback((abort = true) => {
    const current = session.current;
    if (!current) return;
    session.current = null; // Invalidate captured callbacks before invoking native code.
    clearTimeout(current.timer);
    const recognition = current.recognition;
    recognition.onstart =
      recognition.onresult =
      recognition.onerror =
      recognition.onend =
        null;
    if (abort) {
      try {
        recognition.abort();
      } catch {
        /* Already ended in the browser. */
      }
    }
  }, []);

  const interrupt = useCallback(() => {
    if (!session.current) return;
    release();
    setInterim('');
    setState('idle');
    setMessage(
      'Dictation stopped because you left the composer or page. Your finalized text is still here.',
    );
  }, [release]);
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) interrupt();
    };
    const focusMoved = (event: FocusEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest('dialog[open]')
      )
        interrupt();
    };
    document.addEventListener('focusin', focusMoved);
    window.addEventListener('pagehide', interrupt);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      document.removeEventListener('focusin', focusMoved);
      window.removeEventListener('pagehide', interrupt);
      document.removeEventListener('visibilitychange', hidden);
      release();
    };
  }, [interrupt, release]);

  function start() {
    if (session.current || !support.Controller) return;
    setInterim('');
    setState('starting');
    setMessage(
      'Starting dictation. Allow microphone access if your browser asks.',
    );
    try {
      const recognition = new support.Controller();
      const current = {
        recognition,
        stopping: false,
        finals: new Set<number>(),
        timer: undefined as ReturnType<typeof setTimeout> | undefined,
      };
      session.current = current;
      const live = () => session.current === current;
      const fail = (message: string) => {
        if (!live()) return;
        release();
        setState('error');
        setInterim('');
        setMessage(message + ' Your draft is still here.');
      };
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = document.documentElement.lang || 'en';
      recognition.onstart = () => {
        if (!live() || current.stopping) return;
        clearTimeout(current.timer);
        setState('listening');
        setMessage('Listening. Speak when ready; you can keep typing.');
      };
      recognition.onresult = (event) => {
        if (!live()) return;
        const provisional: string[] = [];
        for (let index = 0; index < event.results.length; index++) {
          const result = event.results[index];
          const text = result[0]?.transcript ?? '';
          if (result.isFinal) {
            if (!current.finals.has(index)) {
              current.finals.add(index);
              if (text.trim()) {
                callback.current(text);
                setMessage(
                  current.stopping
                    ? 'Text added. Finishing dictation…'
                    : 'Text added to the end of your draft. Still listening.',
                );
              }
            }
          } else if (!current.finals.has(index)) provisional.push(text);
        }
        setInterim(provisional.join(' '));
      };
      recognition.onerror = (event) =>
        fail(
          errors[event.error] ||
            'Dictation failed. Try again or continue typing.',
        );
      recognition.onend = () => {
        if (!live()) return;
        release(false);
        setInterim('');
        setState('idle');
        setMessage(
          current.stopping
            ? 'Dictation stopped. Review your text before saving.'
            : 'Dictation ended. Review your text, or start again to add more.',
        );
      };
      current.timer = setTimeout(
        () =>
          fail(
            'Dictation did not start. Check microphone permissions and try again.',
          ),
        15000,
      );
      recognition.start();
    } catch {
      release();
      setState('error');
      setMessage(
        'Dictation could not start. Check microphone permissions and try again. Your draft is still here.',
      );
    }
  }
  function stop() {
    const current = session.current;
    if (!current || current.stopping) return;
    current.stopping = true;
    clearTimeout(current.timer);
    setState('processing');
    setMessage(
      'Finishing dictation. Waiting for final text; your draft is still editable.',
    );
    current.timer = setTimeout(() => {
      if (session.current !== current) return;
      release();
      setInterim('');
      setState('error');
      setMessage(
        'The speech service did not finish. Dictation stopped; finalized text is still here. Try again or continue typing.',
      );
    }, 8000);
    try {
      current.recognition.stop();
    } catch {
      release();
      setInterim('');
      setState('error');
      setMessage(
        'Dictation stopped unexpectedly. Your finalized text is still here. Try again or continue typing.',
      );
    }
  }
  function reset() {
    if (session.current) return;
    setState(support.Controller ? 'idle' : 'unavailable');
    setInterim('');
    setMessage(support.reason || 'Dictation is ready.');
  }
  const active =
    state === 'starting' || state === 'listening' || state === 'processing';
  return {
    state,
    message,
    interim,
    active,
    start,
    stop,
    reset,
    isActive: () => session.current !== null,
  };
}
