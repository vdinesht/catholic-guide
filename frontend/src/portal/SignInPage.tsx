import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { LogoMark } from '../components/Logo';
import { api, ApiError } from '../lib/api';
import type { Me } from '../lib/types';
import { useAuth } from './PortalContext';

const RESEND_AFTER = 30;

/** Passwordless sign-in: email → 6-digit code → signed in. */
export function SignInPage() {
  const { me, setMe } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next')?.startsWith('/portal') ? params.get('next')! : '/portal';
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const id = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(id);
  }, [wait]);

  if (me) return <Navigate to={next} replace />;

  const sendCode = async (e?: FormEvent) => {
    e?.preventDefault();
    setError('');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/api/auth/code', { email: email.trim() });
      setStep('code');
      setWait(RESEND_AFTER);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError('Enter all 6 digits from the email.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const user = await api.post<Me>('/api/auth/verify', { email: email.trim(), code });
      setMe(user);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="signin" lang="en">
      <div className="signin-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LogoMark size={36} inverse />
          <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>Catholic Guide</span>
        </div>
        <div style={{ maxWidth: 460 }}>
          <p className="serif" style={{ margin: 0, fontSize: 30, lineHeight: '42px' }}>
            “Thy word is a lamp to my feet, and a light to my paths.”
          </p>
          <p style={{ margin: '14px 0 0', fontSize: 14, color: '#a9a59c' }}>Psalm 119:105</p>
        </div>
        <p style={{ margin: 0, fontSize: 14, lineHeight: '20px', color: '#a9a59c' }}>Content portal for the Catholic Guide editorial team.</p>
      </div>

      <main className="signin-form">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LogoMark />
            <span className="muted" style={{ fontSize: 15, fontWeight: 600 }}>
              Portal
            </span>
          </div>

          {step === 'email' ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <h1>Sign in</h1>
                <p className="muted" style={{ margin: 0, fontSize: 15, lineHeight: '22px' }}>
                  No password needed. We'll email you a 6-digit code.
                </p>
              </div>
              <form onSubmit={sendCode} noValidate>
                <div>
                  <label htmlFor="em" className="lbl" style={{ fontSize: 14 }}>
                    Email address
                  </label>
                  <input
                    id="em"
                    className="inp lg"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!error}
                    aria-describedby={error ? 'em-err' : undefined}
                    autoFocus
                  />
                  {error && (
                    <p id="em-err" role="alert" className="field-error">
                      <Icon name="alert" size={16} strokeWidth={2} />
                      {error}
                    </p>
                  )}
                </div>
                <button type="submit" className="btn btn-p btn-lg" disabled={busy}>
                  Email me a code
                </button>
              </form>
              <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: '20px' }}>
                Don't have access? Ask a portal admin to invite you.
              </p>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <h1>Check your email</h1>
                <p className="muted" style={{ margin: 0, fontSize: 15, lineHeight: '22px' }}>
                  If <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{email.trim()}</strong> has portal access, a 6-digit code is on its way.
                </p>
              </div>
              <form onSubmit={verify} noValidate>
                <div>
                  <label htmlFor="cd" className="lbl" style={{ fontSize: 14 }}>
                    6-digit code
                  </label>
                  <input
                    id="cd"
                    className="inp code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="••••••"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.replace(/\D/g, ''));
                      setError('');
                    }}
                    aria-invalid={!!error}
                    aria-describedby={error ? 'cd-err' : undefined}
                    style={error ? { borderColor: 'var(--danger)' } : undefined}
                    autoFocus
                  />
                  {error && (
                    <p id="cd-err" role="alert" className="field-error">
                      <Icon name="alert" size={16} strokeWidth={2} />
                      {error}
                    </p>
                  )}
                </div>
                <button type="submit" className="btn btn-p btn-lg" disabled={busy}>
                  Sign in
                </button>
              </form>
              <div className="muted" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, fontSize: 14 }}>
                {wait > 0 ? (
                  <span>Didn't get it? Resend in 0:{String(wait).padStart(2, '0')}</span>
                ) : (
                  <button type="button" className="rowbtn" style={{ fontSize: 14, textDecoration: 'underline' }} onClick={() => sendCode()}>
                    Send a new code
                  </button>
                )}
                <button
                  type="button"
                  className="rowbtn"
                  style={{ fontSize: 14, textDecoration: 'underline' }}
                  onClick={() => {
                    setStep('email');
                    setCode('');
                    setError('');
                  }}
                >
                  Use a different email
                </button>
              </div>
              <p className="muted" style={{ margin: 0, padding: '12px 14px', borderRadius: 6, background: 'var(--surface-300)', fontSize: 13, lineHeight: '20px' }}>
                Check your spam folder. The email has the subject “Your Catholic Guide sign-in code”.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
