import { StrictMode } from 'react';
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../../app/App';
import { NOTES_STORAGE_KEY } from '../../services/noteStorage';
import {
  useSpeechRecognition,
  type RecognitionController,
} from './useSpeechRecognition';

class MockRecognition implements RecognitionController {
  static instances: MockRecognition[] = [];
  static throwStart = false;
  continuous = false;
  interimResults = false;
  lang = '';
  onstart: RecognitionController['onstart'] = null;
  onresult: RecognitionController['onresult'] = null;
  onerror: RecognitionController['onerror'] = null;
  onend: RecognitionController['onend'] = null;
  constructor() {
    MockRecognition.instances.push(this);
  }
  start = vi.fn(() => {
    if (MockRecognition.throwStart) throw Error('start failed');
  });
  stop = vi.fn();
  abort = vi.fn();
  results(...segments: [string, boolean][]) {
    this.onresult?.({
      results: segments.map(([transcript, isFinal]) =>
        Object.assign([{ transcript, confidence: 1 }], { isFinal }),
      ) as unknown as SpeechRecognitionResultList,
    });
  }
}
const last = () => MockRecognition.instances.at(-1)!;
const content = () => screen.getByRole('textbox', { name: /Content/ });
const save = () => screen.getByRole('button', { name: 'Save note' });
const clickStart = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Start dictation' }));
const input = (text: string) =>
  fireEvent.change(content(), { target: { value: text } });
beforeEach(() => {
  vi.stubGlobal('SpeechRecognition', MockRecognition);
  vi.stubGlobal('webkitSpeechRecognition', undefined);
  MockRecognition.instances = [];
  MockRecognition.throwStart = false;
  localStorage.clear();
  window.history.replaceState({}, '', '/');
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it('unsupported browsers retain fully functional typed save and reload', () => {
  vi.stubGlobal('SpeechRecognition', undefined);
  const view = render(<App />);
  expect(
    screen.getByRole('button', { name: 'Dictation unavailable' }),
  ).toBeDisabled();
  expect(screen.getByText(/Voice input isn’t available/)).toBeVisible();
  input('Typed safely');
  fireEvent.click(save());
  view.unmount();
  render(<App />);
  expect(screen.getByRole('article')).toHaveTextContent('Typed safely');
});
it('insecure environments retain typing and explain HTTPS or localhost', () => {
  vi.stubGlobal('isSecureContext', false);
  render(<App />);
  expect(screen.getByText(/Dictation needs HTTPS/)).toBeVisible();
  expect(content()).toBeEnabled();
});
it('does not instantiate or request recognition on mount, including StrictMode', () => {
  render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  expect(MockRecognition.instances).toHaveLength(0);
});
it('starts explicitly, configures the native controller, and announces actual listening', () => {
  render(<App />);
  clickStart();
  expect(last().start).toHaveBeenCalledTimes(1);
  expect(last().continuous && last().interimResults).toBe(true);
  expect(last().lang).toBe('en');
  expect(screen.getByText(/Starting dictation/)).toHaveAttribute(
    'aria-live',
    'polite',
  );
  act(() => last().onstart?.());
  expect(screen.getByText(/Listening\. Speak/)).toHaveAttribute(
    'aria-atomic',
    'true',
  );
  expect(screen.getByRole('button', { name: 'Stop dictation' })).toBeEnabled();
  expect(save()).toBeDisabled();
  expect(content()).toBeEnabled();
});
it('accepts the webkit prefixed implementation', () => {
  vi.stubGlobal('SpeechRecognition', undefined);
  vi.stubGlobal('webkitSpeechRecognition', MockRecognition);
  render(<App />);
  clickStart();
  expect(last().start).toHaveBeenCalledTimes(1);
});
it('appends final results to current typed text without altering whitespace', () => {
  render(<App />);
  input('  Typed\n  ');
  clickStart();
  act(() => last().results(['  Spoken\nwords  ', true]));
  expect(content()).toHaveValue('  Typed\n  \n  Spoken\nwords  ');
});
it('does not add an extra separator after an existing newline', () => {
  render(<App />);
  input('Typed\n');
  clickStart();
  act(() => last().results(['Spoken', true]));
  expect(content()).toHaveValue('Typed\nSpoken');
});
it('interim remains provisional, is never inserted, and is replaced once by the final', () => {
  render(<App />);
  clickStart();
  act(() => last().results(['Maybe', false]));
  expect(content()).toHaveValue('');
  expect(screen.getByText('Provisional (not saved): Maybe')).toBeVisible();
  act(() => last().results(['Maybe so', true]));
  expect(content()).toHaveValue('Maybe so');
  expect(screen.queryByText(/Provisional/)).not.toBeInTheDocument();
  expect(localStorage.getItem(NOTES_STORAGE_KEY)).toBeNull();
});
it('deduplicates final indexes, including identical text at distinct indexes', () => {
  render(<App />);
  clickStart();
  act(() => {
    last().results(['Again', true]);
    last().results(['Again', true], ['Again', true]);
    last().results(['Again', true], ['Again', true]);
  });
  expect(content()).toHaveValue('Again\nAgain');
});
it('simultaneous edits are preserved and subsequent speech appends to the edited end', () => {
  render(<App />);
  clickStart();
  act(() => last().results(['First', true]));
  input('My revision');
  act(() => last().results(['First', true], ['Second', true]));
  expect(content()).toHaveValue('My revision\nSecond');
});
it('stop waits for final text then permits explicit save; resume starts a new index set', () => {
  render(<App />);
  clickStart();
  const first = last();
  act(() => first.onstart?.());
  act(() => first.results(['One', true]));
  fireEvent.click(screen.getByRole('button', { name: 'Stop dictation' }));
  expect(first.stop).toHaveBeenCalledTimes(1);
  expect(screen.getByText(/Finishing dictation\. Waiting/)).toBeVisible();
  act(() => {
    first.results(['One', true], ['Two', true]);
    first.onend?.();
  });
  expect(save()).toBeEnabled();
  expect(localStorage.getItem(NOTES_STORAGE_KEY)).toBeNull();
  clickStart();
  act(() => {
    last().results(['Three', true]);
    last().onend?.();
  });
  expect(content()).toHaveValue('One\nTwo\nThree');
});
it('natural end clears provisional text and does not automatically restart or save', () => {
  render(<App />);
  clickStart();
  act(() => {
    last().results(['Not final', false]);
    last().onend?.();
  });
  expect(content()).toHaveValue('');
  expect(MockRecognition.instances).toHaveLength(1);
  expect(localStorage.getItem(NOTES_STORAGE_KEY)).toBeNull();
  expect(screen.getByText(/Dictation ended/)).toBeVisible();
});
it.each([
  ['not-allowed', /site settings/],
  ['audio-capture', /No microphone/],
  ['network', /could not connect/],
  ['no-speech', /No speech was recognized/],
  ['aborted', /interrupted/],
  ['service-not-allowed', /blocked the speech service/],
  ['language-not-supported', /does not support/],
] as const)(
  'handles %s without losing typed or finalized text',
  (error, message) => {
    render(<App />);
    input('Typed');
    clickStart();
    act(() => {
      last().results(['Final', true]);
      last().onerror?.({ error });
    });
    expect(content()).toHaveValue('Typed\nFinal');
    expect(screen.getByText(message)).toHaveAttribute('aria-live', 'polite');
    expect(last().abort).toHaveBeenCalledTimes(1);
    expect(save()).toBeEnabled();
  },
);
it('thrown start releases handlers and keeps the draft', () => {
  MockRecognition.throwStart = true;
  render(<App />);
  input('Keep');
  clickStart();
  expect(screen.getByText(/Dictation could not start/)).toBeVisible();
  expect(content()).toHaveValue('Keep');
  expect(last().onresult).toBeNull();
});
it('rapid start/stop uses one controller until end', () => {
  const { result } = renderHook(() => useSpeechRecognition(vi.fn()));
  act(() => {
    result.current.start();
    result.current.start();
    result.current.stop();
    result.current.stop();
    result.current.start();
  });
  expect(MockRecognition.instances).toHaveLength(1);
  expect(last().start).toHaveBeenCalledTimes(1);
  expect(last().stop).toHaveBeenCalledTimes(1);
  act(() => last().onstart?.());
  expect(result.current.state).toBe('processing');
});
it('unmount aborts, detaches all handlers, and ignores retained late callbacks', () => {
  const append = vi.fn();
  const view = renderHook(() => useSpeechRecognition(append));
  act(() => view.result.current.start());
  const recognition = last();
  const late = recognition.onresult!;
  view.unmount();
  late({
    results: Object.assign([], {
      length: 0,
    }) as unknown as SpeechRecognitionResultList,
  });
  expect(append).not.toHaveBeenCalled();
  expect(recognition.abort).toHaveBeenCalledTimes(1);
  expect([
    recognition.onstart,
    recognition.onresult,
    recognition.onerror,
    recognition.onend,
  ]).toEqual([null, null, null, null]);
});
it('callbacks captured before end cannot mutate a replacement session', () => {
  render(<App />);
  clickStart();
  const old = last();
  const late = old.onresult!;
  const lateError = old.onerror!;
  const lateEnd = old.onend!;
  act(() => old.onend?.());
  clickStart();
  const next = last();
  act(() => {
    lateError({ error: 'network' });
    lateEnd();
    late({
      results: [
        [{ transcript: 'Wrong' }],
      ] as unknown as SpeechRecognitionResultList,
    });
    next.results(['Right', true]);
  });
  expect(content()).toHaveValue('Right');
  expect(next.abort).not.toHaveBeenCalled();
});
it('pagehide aborts listening and preserves the draft', () => {
  render(<App />);
  clickStart();
  act(() => last().results(['Keep', true]));
  fireEvent(window, new Event('pagehide'));
  expect(last().abort).toHaveBeenCalledTimes(1);
  expect(content()).toHaveValue('Keep');
  expect(screen.getByText(/left the composer or page/)).toBeVisible();
});
it.each(['start', 'stop'])(
  '%s timeout recovers rather than leaving a stuck microphone session',
  (stage) => {
    vi.useFakeTimers();
    render(<App />);
    clickStart();
    if (stage === 'stop') {
      act(() => last().onstart?.());
      fireEvent.click(screen.getByRole('button', { name: 'Stop dictation' }));
    }
    act(() => vi.advanceTimersByTime(16000));
    expect(last().abort).toHaveBeenCalledTimes(1);
    expect(save()).toBeEnabled();
  },
);
it('dictated text is editable, saved explicitly, and rendered literally after reload', () => {
  const view = render(<App />);
  clickStart();
  act(() => {
    last().results(['<img src=x onerror=alert(1)>', true]);
    last().onend?.();
  });
  input('<img src=x onerror=alert(1)>\nReviewed');
  fireEvent.click(save());
  expect(screen.getByRole('article').querySelector('img')).toBeNull();
  view.unmount();
  render(<App />);
  expect(screen.getByRole('article')).toHaveTextContent(
    '<img src=x onerror=alert(1)>',
  );
  expect(JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY)!)[0].content).toBe(
    '<img src=x onerror=alert(1)>\nReviewed',
  );
});
it('interim-only or removed transcription still requires nonblank content', () => {
  render(<App />);
  clickStart();
  act(() => {
    last().results(['   ', true]);
    last().onend?.();
  });
  fireEvent.click(save());
  expect(screen.getByRole('alert')).toHaveTextContent('Write something');
  expect(localStorage.getItem(NOTES_STORAGE_KEY)).toBeNull();
});
it('failed storage preserves dictated draft; retry uses the same safe save path', () => {
  render(<App />);
  input('Typed');
  clickStart();
  act(() => {
    last().results(['Spoken', true]);
    last().onend?.();
  });
  const write = vi
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementationOnce(() => {
      throw Error('quota');
    });
  fireEvent.click(save());
  expect(content()).toHaveValue('Typed\nSpoken');
  expect(screen.getByRole('alert')).toHaveTextContent("couldn't be saved");
  expect(localStorage.getItem(NOTES_STORAGE_KEY)).toBeNull();
  write.mockRestore();
  fireEvent.click(save());
  expect(JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY)!)[0].content).toBe(
    'Typed\nSpoken',
  );
});
it('corrupt storage blocks dictated draft writes without repair', () => {
  localStorage.setItem(NOTES_STORAGE_KEY, '{corrupt');
  render(<App />);
  clickStart();
  act(() => {
    last().results(['Keep', true]);
    last().onend?.();
  });
  expect(save()).toBeDisabled();
  expect(content()).toHaveValue('Keep');
  expect(localStorage.getItem(NOTES_STORAGE_KEY)).toBe('{corrupt');
});

it('focus entering an open dialog stops dictation rather than listening behind it', () => {
  render(<App />);
  clickStart();
  act(() => last().results(['Draft', true]));
  const dialog = document.createElement('dialog');
  dialog.setAttribute('open', '');
  const button = document.createElement('button');
  dialog.append(button);
  document.body.append(dialog);
  fireEvent.focusIn(button);
  expect(last().abort).toHaveBeenCalledTimes(1);
  expect(content()).toHaveValue('Draft');
  expect(screen.getByText(/left the composer or page/)).toBeInTheDocument();
  dialog.remove();
});
it('hidden-page cleanup ignores late results and leaves finalized text intact', () => {
  render(<App />);
  clickStart();
  const late = last().onresult!;
  act(() => last().results(['Keep', true]));
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  fireEvent(document, new Event('visibilitychange'));
  act(() =>
    late({
      results: [
        Object.assign([{ transcript: 'Lost' }], { isFinal: true }),
      ] as unknown as SpeechRecognitionResultList,
    }),
  );
  expect(content()).toHaveValue('Keep');
  expect(last().abort).toHaveBeenCalledTimes(1);
});
it('a thrown stop releases the controller and keeps finalized text', () => {
  render(<App />);
  clickStart();
  act(() => last().results(['Keep', true]));
  last().stop.mockImplementation(() => {
    throw Error('native stop');
  });
  fireEvent.click(screen.getByRole('button', { name: 'Stop dictation' }));
  expect(screen.getByText(/Dictation stopped unexpectedly/)).toBeVisible();
  expect(content()).toHaveValue('Keep');
  expect(last().onresult).toBeNull();
});

it('saving after a failed speech session resets outdated dictation feedback', () => {
  render(<App />);
  input('Ready to save');
  clickStart();
  act(() => last().onerror?.({ error: 'network' }));
  fireEvent.click(save());
  expect(screen.getByText('Dictation is ready.')).toBeVisible();
  expect(screen.queryByText(/could not connect/)).not.toBeInTheDocument();
});

it('empty result lists and blank finals preserve typed text without saving', () => {
  render(<App />);
  input('Typed first.');
  clickStart();
  act(() => {
    last().onstart?.();
    last().results();
    last().results(['   \n', true]);
    last().onend?.();
  });
  expect(content()).toHaveValue('Typed first.');
  expect(localStorage.getItem(NOTES_STORAGE_KEY)).toBeNull();
  expect(screen.getByText(/Dictation ended/)).toBeVisible();
  expect(save()).toBeEnabled();
});

it('unmapped service errors have a fallback and invalidate retained result/end callbacks', () => {
  render(<App />);
  input('Keep this.');
  clickStart();
  const recognition = last();
  const lateResult = recognition.onresult;
  const lateEnd = recognition.onend;
  act(() => recognition.onerror?.({ error: 'phrases-not-supported' }));
  expect(
    screen.getByText(/Dictation failed\. Try again or continue typing/),
  ).toBeVisible();
  clickStart();
  act(() => {
    lateResult?.({
      results: [
        Object.assign([{ transcript: 'Stale text.', confidence: 1 }], {
          isFinal: true,
        }),
      ] as unknown as SpeechRecognitionResultList,
    });
    lateEnd?.();
    last().results(['New session.', true]);
  });
  expect(content()).toHaveValue('Keep this.\nNew session.');
  expect(screen.getByRole('button', { name: 'Stop dictation' })).toBeEnabled();
  expect(recognition.abort).toHaveBeenCalledTimes(1);
});

it('stop before onstart ignores late start and preserves final text until end', () => {
  render(<App />);
  clickStart();
  fireEvent.click(screen.getByRole('button', { name: 'Stop dictation' }));
  act(() => {
    last().onstart?.();
    last().results(['Final after stop.', true]);
  });
  expect(content()).toHaveValue('Final after stop.');
  expect(screen.queryByText(/Listening\. Speak/)).not.toBeInTheDocument();
  expect(save()).toBeDisabled();
  act(() => last().onend?.());
  expect(content()).toHaveValue('Final after stop.');
  expect(save()).toBeEnabled();
  expect(localStorage.getItem(NOTES_STORAGE_KEY)).toBeNull();
});

it('unmount removes lifecycle listener identities even if abort throws', () => {
  const documentAdd = vi.spyOn(document, 'addEventListener');
  const documentRemove = vi.spyOn(document, 'removeEventListener');
  const windowAdd = vi.spyOn(window, 'addEventListener');
  const windowRemove = vi.spyOn(window, 'removeEventListener');
  const view = renderHook(() => useSpeechRecognition(vi.fn()));
  act(() => view.result.current.start());
  last().abort.mockImplementation(() => {
    throw Error('already released');
  });
  view.unmount();
  for (const type of ['visibilitychange', 'focusin']) {
    const listener = documentAdd.mock.calls.find(
      ([name]) => name === type,
    )?.[1];
    expect(listener).toBeTypeOf('function');
    expect(documentRemove).toHaveBeenCalledWith(type, listener);
  }
  const pagehide = windowAdd.mock.calls.find(
    ([name]) => name === 'pagehide',
  )?.[1];
  expect(pagehide).toBeTypeOf('function');
  expect(windowRemove).toHaveBeenCalledWith('pagehide', pagehide);
  expect(last().onresult).toBeNull();
  expect(last().onstart).toBeNull();
  expect(last().onerror).toBeNull();
  expect(last().onend).toBeNull();
});
