'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { Task } from '@/lib/data';

interface ParsedTask {
  title: string;
  due: Task['due'];
  time: string;
  priority: Task['priority'];
  project: string;
}

type CaptureState = 'listening' | 'processing' | 'done' | 'error' | 'unsupported';

interface Props {
  onTaskCreated: (task: Omit<Task, 'id'>) => Promise<void>;
  onClose: () => void;
}

export default function VoiceCapture({ onTaskCreated, onClose }: Props) {
  const [captureState,      setCaptureState]      = useState<CaptureState>('listening');
  const [displayText,       setDisplayText]       = useState('');
  const [createdTask,       setCreatedTask]        = useState<ParsedTask | null>(null);
  const [errorMsg,          setErrorMsg]           = useState('');
  const [isPermissionError, setIsPermissionError]  = useState(false);
  const [retryKey,          setRetryKey]           = useState(0);

  const overlayRef     = useRef<HTMLDivElement>(null);
  const panelRef       = useRef<HTMLDivElement>(null);
  const transcriptRef  = useRef('');  // final results
  const interimRef     = useRef('');  // latest interim — fallback if recognition ends before finalizing
  const endHandledRef  = useRef(false); // prevents onend running after onerror already acted
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const closingRef     = useRef(false);

  const doClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    recognitionRef.current?.abort();
    gsap.to(panelRef.current,   { y: 14, opacity: 0, scale: 0.96, duration: 0.16, ease: 'power2.in' });
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.18, onComplete: onClose });
  }, [onClose]);

  const processTranscript = useCallback(async (text: string) => {
    setCaptureState('processing');
    try {
      const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
      const res = await fetch('/api/tasks/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text, today }),
      });
      if (!res.ok) throw new Error('Could not parse task');
      const parsed: ParsedTask = await res.json();
      setCreatedTask(parsed);
      setCaptureState('done');

      await onTaskCreated({
        title:    parsed.title,
        done:     false,
        project:  parsed.project,
        tone:     'terra',
        attach:   0,
        due:      parsed.due,
        time:     parsed.time,
        priority: parsed.priority,
      });

      setTimeout(doClose, 2200);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
      setCaptureState('error');
    }
  }, [onTaskCreated, doClose]);

  useEffect(() => {
    // On retry: reset all transient state
    if (retryKey > 0) {
      setCaptureState('listening');
      setDisplayText('');
      setErrorMsg('');
      setIsPermissionError(false);
      transcriptRef.current  = '';
      interimRef.current     = '';
      endHandledRef.current  = false;
    }

    // Only animate on first mount
    if (retryKey === 0) {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 });
      gsap.fromTo(panelRef.current,
        { y: 24, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 0.3, ease: 'power3.out' },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognitionAPI = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setCaptureState('unsupported');
      return;
    }

    let aborted = false;

    // getUserMedia explicitly triggers the browser permission dialog.
    // SpeechRecognition alone often skips the prompt silently.
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        stream.getTracks().forEach(t => t.stop()); // release immediately — only needed to prompt
        if (aborted) return;

        const recognition = new SpeechRecognitionAPI();
        recognition.continuous     = false;
        recognition.interimResults = true;
        recognition.lang           = 'en-US';
        recognitionRef.current     = recognition;

        recognition.onresult = (event: { resultIndex: number; results: { isFinal: boolean; [0]: { transcript: string } }[] }) => {
          let interim = '';
          let final   = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const r = event.results[i];
            if (r.isFinal) final   += r[0].transcript;
            else           interim += r[0].transcript;
          }
          if (final) transcriptRef.current += final;
          interimRef.current = interim;
          setDisplayText(transcriptRef.current + interim);
        };

        recognition.onerror = (event: { error: string }) => {
          if (event.error === 'no-speech') return;
          endHandledRef.current = true;
          setErrorMsg(`Microphone error: ${event.error}`);
          setCaptureState('error');
        };

        recognition.onend = () => {
          if (endHandledRef.current) return;
          const text = (transcriptRef.current || interimRef.current).trim();
          if (text) {
            processTranscript(text);
          } else {
            setErrorMsg('No speech detected. Please try again.');
            setCaptureState('error');
          }
        };

        recognition.start();
      })
      .catch(() => {
        if (aborted) return;
        endHandledRef.current = true;
        setIsPermissionError(true);
        setCaptureState('error');
      });

    return () => {
      aborted = true;
      recognitionRef.current?.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processTranscript, retryKey]);

  const PRIORITY_COLOR: Record<string, string> = {
    high:   '#c1623f',
    medium: '#c9943a',
    low:    '#7a9e7e',
  };

  return (
    <>
      <style>{`
        @keyframes vc-pulse {
          0%, 100% { transform: scale(1);   opacity: 0.55; }
          50%       { transform: scale(1.18); opacity: 0.25; }
        }
        @keyframes vc-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes vc-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>

      <div
        ref={overlayRef}
        onClick={e => { if (e.target === overlayRef.current) doClose(); }}
        style={{
          position: 'fixed', inset: 0, zIndex: 3100,
          background: 'rgba(10, 6, 4, 0.88)',
          backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div
          ref={panelRef}
          style={{
            position: 'relative',
            width: 380,
            background: 'linear-gradient(160deg, #1e1410 0%, #2c1e16 55%, #1a1218 100%)',
            borderRadius: 28,
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 48px 96px rgba(0,0,0,0.6)',
            padding: '40px 32px 36px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
          }}
        >
          {/* Close */}
          <button
            onClick={doClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              width: 30, height: 30, borderRadius: 8, border: 'none',
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)',
              display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: 16,
            }}
          >×</button>

          {/* Label */}
          <div style={{
            fontSize: 9.5, fontFamily: 'var(--font-mono)', letterSpacing: '0.18em',
            color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', marginBottom: 28,
          }}>
            {captureState === 'listening'   ? 'Voice task capture'  :
             captureState === 'processing'  ? 'Creating task…'      :
             captureState === 'done'        ? 'Task created'        :
             captureState === 'error'       ? (isPermissionError ? 'Microphone blocked' : 'Something went wrong') :
             'Not supported'}
          </div>

          {/* ── Listening state ── */}
          {captureState === 'listening' && (
            <>
              {/* Pulse rings + mic */}
              <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
                <div style={{
                  position: 'absolute', width: 120, height: 120, borderRadius: '50%',
                  background: 'rgba(193,98,63,0.18)',
                  animation: 'vc-pulse 1.4s ease-in-out infinite',
                }} />
                <div style={{
                  position: 'absolute', width: 90, height: 90, borderRadius: '50%',
                  background: 'rgba(193,98,63,0.22)',
                  animation: 'vc-pulse 1.4s ease-in-out 0.3s infinite',
                }} />
                <div style={{
                  position: 'relative', zIndex: 1,
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #c1623f, #d4735a)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 28px rgba(193,98,63,0.45)',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                </div>
              </div>

              {/* Transcript preview */}
              <div style={{
                minHeight: 48, width: '100%', textAlign: 'center',
                fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.75)',
                lineHeight: 1.55, fontFamily: 'var(--font-sans)',
                marginBottom: 16,
              }}>
                {displayText || (
                  <span style={{ color: 'rgba(255,255,255,0.28)', fontStyle: 'italic', animation: 'vc-blink 1.8s ease-in-out infinite', display: 'inline-block' }}>
                    Speak your task…
                  </span>
                )}
              </div>

              <div style={{
                fontSize: 11.5, color: 'rgba(255,255,255,0.22)',
                fontFamily: 'var(--font-sans)', textAlign: 'center', lineHeight: 1.5,
              }}>
                e.g. "Finish report by Friday, high priority"
              </div>
            </>
          )}

          {/* ── Processing state ── */}
          {captureState === 'processing' && (
            <>
              {/* Spinner */}
              <div style={{ position: 'relative', width: 80, height: 80, marginBottom: 28 }}>
                <svg
                  width="80" height="80"
                  style={{ animation: 'vc-spin 1s linear infinite' }}
                >
                  <circle
                    cx="40" cy="40" r="34"
                    fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4"
                  />
                  <circle
                    cx="40" cy="40" r="34"
                    fill="none" stroke="#c1623f" strokeWidth="4"
                    strokeDasharray="50 165"
                    strokeLinecap="round"
                  />
                </svg>
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontFamily: 'var(--font-mono)',
                  color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em',
                }}>AI</div>
              </div>

              {displayText && (
                <div style={{
                  fontSize: 13, color: 'rgba(255,255,255,0.45)',
                  fontFamily: 'var(--font-sans)', textAlign: 'center',
                  lineHeight: 1.55, fontStyle: 'italic', maxWidth: 280,
                }}>
                  "{displayText}"
                </div>
              )}
            </>
          )}

          {/* ── Done state ── */}
          {captureState === 'done' && createdTask && (
            <>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(122,158,126,0.18)',
                border: '2px solid #7a9e7e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 24,
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7a9e7e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>

              <div style={{
                width: '100%', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 14, padding: '16px 18px',
                display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>
                  {createdTask.title}
                </div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' as const }}>
                  <Tag color="rgba(255,255,255,0.16)">{createdTask.due}</Tag>
                  {createdTask.time !== '—' && <Tag color="rgba(255,255,255,0.16)">{createdTask.time}</Tag>}
                  <Tag color={PRIORITY_COLOR[createdTask.priority] + '33'} textColor={PRIORITY_COLOR[createdTask.priority]}>
                    {createdTask.priority}
                  </Tag>
                  {createdTask.project && <Tag color="rgba(255,255,255,0.16)">{createdTask.project}</Tag>}
                </div>
              </div>
            </>
          )}

          {/* ── Error / unsupported state ── */}
          {(captureState === 'error' || captureState === 'unsupported') && (
            <>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(193,98,63,0.15)',
                border: '2px solid rgba(193,98,63,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 22,
              }}>
                {isPermissionError ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c1623f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                    <line x1="2" y1="2" x2="22" y2="22"/>
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c1623f" strokeWidth="2.2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                )}
              </div>

              {captureState === 'unsupported' ? (
                <p style={{ margin: '0 0 24px', fontSize: 13.5, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 1.6, fontFamily: 'var(--font-sans)' }}>
                  Voice input requires Chrome or Edge. Try opening SlowDesk in one of those browsers.
                </p>
              ) : isPermissionError ? (
                <>
                  <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.75)', textAlign: 'center', fontFamily: 'var(--font-sans)' }}>
                    Microphone blocked
                  </p>
                  <p style={{ margin: '0 0 20px', fontSize: 12.5, color: 'rgba(255,255,255,0.38)', textAlign: 'center', lineHeight: 1.6, fontFamily: 'var(--font-sans)' }}>
                    Your browser has microphone access blocked for this site. To fix it:
                  </p>
                  {/* Step-by-step instructions */}
                  <div style={{
                    width: '100%', background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12, padding: '14px 16px', marginBottom: 22,
                    display: 'flex', flexDirection: 'column', gap: 10,
                  }}>
                    {[
                      { n: '1', text: 'Click the lock icon 🔒 in your browser\'s address bar' },
                      { n: '2', text: 'Find "Microphone" and change it to Allow' },
                      { n: '3', text: 'Click "Try again" below' },
                    ].map(step => (
                      <div key={step.n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{
                          flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                          background: 'rgba(193,98,63,0.25)', border: '1px solid rgba(193,98,63,0.4)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 700, color: '#c1623f', fontFamily: 'var(--font-mono)',
                        }}>{step.n}</span>
                        <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.55, fontFamily: 'var(--font-sans)' }}>
                          {step.text}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setRetryKey(k => k + 1)}
                      style={{
                        flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
                        background: '#c1623f', color: '#fff',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                      }}
                    >
                      Try again
                    </button>
                    <button
                      onClick={doClose}
                      style={{
                        padding: '10px 18px', borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'transparent', color: 'rgba(255,255,255,0.4)',
                        fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                      }}
                    >
                      Close
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ margin: '0 0 24px', fontSize: 13.5, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 1.6, fontFamily: 'var(--font-sans)' }}>
                    {errorMsg}
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setRetryKey(k => k + 1)}
                      style={{
                        padding: '9px 22px', borderRadius: 10, border: 'none',
                        background: '#c1623f', color: '#fff',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                      }}
                    >Try again</button>
                    <button
                      onClick={doClose}
                      style={{
                        padding: '9px 18px', borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'transparent', color: 'rgba(255,255,255,0.4)',
                        fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                      }}
                    >Close</button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Tag({ color, textColor, children }: { color: string; textColor?: string; children: React.ReactNode }) {
  return (
    <span style={{
      padding: '3px 9px', borderRadius: 20,
      background: color,
      color: textColor || 'rgba(255,255,255,0.55)',
      fontSize: 11, fontWeight: 500, fontFamily: 'var(--font-sans)',
      textTransform: 'capitalize' as const,
    }}>
      {children}
    </span>
  );
}
