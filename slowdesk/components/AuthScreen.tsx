'use client';
import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Icon from './Icon';

function Field({ label, type, value, onChange, placeholder, error }: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string; error?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-faint)' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: focused ? 'var(--accent)' : 'var(--ink-faint)', transition: 'color 0.15s', pointerEvents: 'none' }}>
          <Icon name={type === 'email' ? 'mail' : type === 'password' ? 'lock' : 'user'} size={14} />
        </div>
        <input
          type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: '100%', padding: '11px 12px 11px 38px', borderRadius: 10, boxSizing: 'border-box',
            border: `1.5px solid ${error ? '#e05c3c' : focused ? 'var(--accent)' : 'var(--line)'}`,
            background: 'var(--bg)', fontSize: 13, color: 'var(--ink)',
            outline: 'none', fontFamily: 'var(--font-sans)', transition: 'border-color 0.15s',
          }}
        />
      </div>
      {error && <span style={{ fontSize: 11, color: '#e05c3c', fontFamily: 'var(--font-mono)' }}>{error}</span>}
    </div>
  );
}

export default function AuthScreen({ onClose }: { onClose?: () => void } = {}) {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(bgRef.current, { opacity: 0 }, { opacity: 1, duration: 0.6 });
    gsap.fromTo(cardRef.current,
      { y: 32, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.55, ease: 'power3.out', delay: 0.15 }
    );
  }, []);

  useEffect(() => {
    if (!formRef.current) return;
    const fields = formRef.current.querySelectorAll('[data-field]');
    gsap.fromTo(fields, { x: -10, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.06, duration: 0.3, ease: 'power2.out' });
    setErrors({});
    setName(''); setEmail(''); setPassword('');
  }, [tab]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (tab === 'signup' && !name.trim()) e.name = 'Name is required';
    if (!email.includes('@')) e.email = 'Enter a valid email';
    if (password.length < 6) e.password = 'At least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate() || loading) return;
    setLoading(true);
    try {
      if (tab === 'signup') {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), email, password }),
        });
        const data = await res.json();
        if (!res.ok) { setErrors({ email: data.error }); setLoading(false); return; }
      }
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        setErrors({ password: 'Invalid email or password' });
        setLoading(false);
      } else {
        router.refresh();
      }
    } catch {
      setErrors({ email: 'Something went wrong. Please try again.' });
      setLoading(false);
    }
  };

  const handleGoogle = () => signIn('google', { callbackUrl: '/' });

  const QUOTES = [
    'A good workspace makes good work.',
    'Every task completed is a small victory.',
    'Clarity is the first step to focus.',
  ];
  const quoteIdx = new Date().getDate() % QUOTES.length;

  return (
    <div ref={bgRef} style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      background: 'linear-gradient(135deg, #2a1a12 0%, #3d2318 35%, #1e2d22 70%, #1a1f2e 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      {/* ambient glows */}
      <div style={{ position: 'absolute', top: '15%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(193,98,63,0.12)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '20%', right: '8%', width: 320, height: 320, borderRadius: '50%', background: 'rgba(122,158,126,0.10)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      {onClose && (
        <button onClick={onClose} style={{
          position: 'absolute', top: 20, right: 20,
          width: 34, height: 34, borderRadius: '50%', border: 'none',
          background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)',
          fontSize: 18, cursor: 'pointer', display: 'grid', placeItems: 'center',
          transition: 'background 0.15s',
          zIndex: 10,
        }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
        >×</button>
      )}

      <div ref={cardRef} style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        width: '100%', maxWidth: 860, minHeight: 520,
        background: 'rgba(250,248,243,0.97)', borderRadius: 20,
        boxShadow: '0 40px 100px rgba(0,0,0,0.45)', overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.15)',
      }}>
        {/* left panel — brand */}
        <div style={{
          background: 'linear-gradient(160deg, #c1623f 0%, #9a3d20 55%, #2a1a12 100%)',
          padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', bottom: -40, right: -40, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ position: 'absolute', top: 40, right: 20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div>
            <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontStyle: 'italic', color: '#fff', fontWeight: 400, marginBottom: 8 }}>
              slow<em style={{ fontStyle: 'normal', opacity: 0.7 }}>desk</em>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              your cozy workspace
            </div>
          </div>
          <div>
            <div style={{ fontSize: 22, color: '#fff', fontFamily: 'var(--font-display)', fontStyle: 'italic', lineHeight: 1.5, marginBottom: 16, fontWeight: 400 }}>
              "{QUOTES[quoteIdx]}"
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {['Tasks', 'Habits', 'Notes', 'Projects'].map(f => (
                <div key={f} style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{f}</div>
              ))}
            </div>
          </div>
        </div>

        {/* right panel — form */}
        <div style={{ padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 28 }}>
          {/* Google button */}
          <button onClick={handleGoogle} style={{
            width: '100%', padding: '11px 0', borderRadius: 10,
            border: '1.5px solid var(--line)', background: 'var(--bg-sunk)',
            fontSize: 13, fontWeight: 500, cursor: 'pointer', color: 'var(--ink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            fontFamily: 'var(--font-sans)', transition: 'border-color 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--line)')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            <span style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          </div>

          {/* tab toggle */}
          <div>
            <div style={{ display: 'flex', gap: 0, background: 'var(--bg-sunk)', borderRadius: 10, padding: 4, marginBottom: 28, width: 'fit-content' }}>
              {(['login', 'signup'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding: '7px 20px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  background: tab === t ? '#fff' : 'transparent',
                  color: tab === t ? 'var(--ink)' : 'var(--ink-soft)',
                  fontSize: 13, fontWeight: 600,
                  boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s',
                  fontFamily: 'var(--font-sans)',
                }}>
                  {t === 'login' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
              {tab === 'login' ? 'Welcome back' : 'Get started'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
              {tab === 'login' ? 'Sign in to your workspace.' : 'Create your cozy workspace.'}
            </p>
          </div>

          <div ref={formRef} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {tab === 'signup' && (
              <div data-field>
                <Field label="Full name" type="text" value={name} onChange={setName} placeholder="Saumya Vishnoi" error={errors.name} />
              </div>
            )}
            <div data-field>
              <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" error={errors.email} />
            </div>
            <div data-field>
              <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" error={errors.password} />
            </div>

            <div data-field style={{ marginTop: 4 }}>
              <button onClick={submit} disabled={loading} onKeyDown={e => e.key === 'Enter' && submit()}
                style={{
                  width: '100%', padding: '13px', borderRadius: 10, border: 'none',
                  background: loading ? 'var(--bg-sunk)' : 'var(--accent)',
                  color: loading ? 'var(--ink-faint)' : '#fff',
                  fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
                  fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                {loading ? (
                  <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid var(--ink-faint)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                ) : (
                  <>{tab === 'login' ? 'Sign in' : 'Create account'} →</>
                )}
              </button>
            </div>

            <div data-field style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
                {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button onClick={() => setTab(tab === 'login' ? 'signup' : 'login')} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', padding: 0 }}>
                  {tab === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
