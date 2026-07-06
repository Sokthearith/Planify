/* Landing, SignIn, CreateAccount */

import React from 'react';
import PlanifyAPI from '../api.jsx';
import {
  IconArrow,
  IconBack,
  IconEye,
  IconEyeOff,
  IconProgress,
  IconSpark,
  IconTasks,
} from '../components/icons.jsx';

function PasswordField({ value, onChange, placeholder }) {
  const [visible, setVisible] = React.useState(false);
  return (
    <div className="password-wrap">
      <input
        className="input"
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        title={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <IconEyeOff size={16} /> : <IconEye size={16} />}
      </button>
    </div>
  );
}

function LandingPage({ onSignIn, onGetStarted, auth, onOpenApp, onSignOut }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="brand">Planify<span className="dot"></span></div>
        <div className="ctas">
          {auth ? (
            <>
              <button className="btn sm" onClick={onOpenApp}>Open dashboard <IconArrow size={12} /></button>
              <div style={{ position: 'relative' }}>
                <button
                  className="avatar"
                  style={{ width: 36, height: 36, fontSize: 11, cursor: 'pointer', border: 'none' }}
                  onClick={() => setMenuOpen(o => !o)}
                  aria-label="Account menu"
                >{auth.initials}</button>
                {menuOpen ? (
                  <div className="land-menu" onMouseLeave={() => setMenuOpen(false)}>
                    <div className="land-menu-head">
                      <div className="name">{auth.name}</div>
                      <div className="sub">Signed in</div>
                    </div>
                    <button onClick={() => { setMenuOpen(false); onOpenApp(); }}>Open dashboard</button>
                    <button onClick={() => { setMenuOpen(false); onSignOut(); }}>Sign out</button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <button className="btn ghost sm" onClick={onSignIn}>Sign in</button>
              <button className="btn sm" onClick={onGetStarted}>Get started</button>
            </>
          )}
        </div>
      </header>

      <section className="hero">
        <div>
          <div className="eyebrow">
            {auth ? (
              <>
                <span className="pill" style={{ borderColor: 'var(--ink)', color: 'var(--ink)' }}>BACK</span>
                <span>Welcome back, {auth.name.split(' ')[0]}</span>
              </>
            ) : (
              <>
                <span className="pill">NEW</span>
                <span>v2.0 · AI-powered scheduling</span>
              </>
            )}
          </div>
          <h1>
            Study{' '}<br />
            <span className="accent">smarter,</span>{' '}<br />
            not harder.
          </h1>
          <p className="desc">
            Planify is an AI-powered planner built for university students.
            Sharp deadlines, intelligent schedules, and zero busywork.
          </p>
          <div className="cta-row">
            {auth ? (
              <>
                <button className="btn" onClick={onOpenApp}>Open Planify <IconArrow size={14} /></button>
                <button className="btn ghost" onClick={onSignOut}>Sign out</button>
              </>
            ) : (
              <>
                <button className="btn" onClick={onGetStarted}>Start free <IconArrow size={14} /></button>
                <button className="btn ghost" onClick={onSignIn}>I have an account</button>
              </>
            )}
          </div>
        </div>

        <div className="hero-frame">
          <span className="label">PLANIFY / TODAY</span>
          <span className="label r">WED · JUN 5</span>
          <div className="center">
            <div className="glyph">
              <div className="ring" />
              <span className="num">12</span>
            </div>
          </div>
          <div className="strip">
            <span>4 tasks open</span>
            <span className="due">2 urgent</span>
          </div>
        </div>
      </section>

      <section className="stats-row" id="stats">
        <div><div className="num">10K+</div><div className="lbl">Active students</div></div>
        <div><div className="num">95%</div><div className="lbl">On-time rate</div></div>
        <div><div className="num">50+</div><div className="lbl">Universities</div></div>
        <div><div className="num">24/7</div><div className="lbl">AI support</div></div>
      </section>

      <section className="features" id="features">
        <div className="feat">
          <div className="mark"><IconSpark size={20} /></div>
          <div className="num">01 / FEATURE</div>
          <h3>AI Scheduling</h3>
          <p>Personalized study plans optimized around your deadlines, productivity peaks and habit data.</p>
        </div>
        <div className="feat">
          <div className="mark"><IconTasks size={20} /></div>
          <div className="num">02 / FEATURE</div>
          <h3>Task Management</h3>
          <p>Track assignments, exams and projects with smart priority detection, reminders and shared groups.</p>
        </div>
        <div className="feat">
          <div className="mark"><IconProgress size={20} /></div>
          <div className="num">03 / FEATURE</div>
          <h3>Progress Tracking</h3>
          <p>Editorial-grade analytics. See exactly what you're learning, where you slip, and what's next.</p>
        </div>
      </section>

      <div className="section-h" id="how">
        <h2>How it works</h2>
        <span className="eyebrow">Three steps · ten minutes</span>
      </div>
      <div className="steps">
        <div className="step">
          <div className="n">01</div>
          <h4>Add what's on your plate</h4>
          <p>Drop in assignments, exams and lectures. Or sync your university calendar — we pick up the rest.</p>
        </div>
        <div className="step">
          <div className="n">02</div>
          <h4>Let the AI sequence your week</h4>
          <p>Planify generates a study plan that respects your deadlines, energy curve and study preferences.</p>
        </div>
        <div className="step">
          <div className="n">03</div>
          <h4>Ship it. Repeat.</h4>
          <p>Check items off, watch your streak climb, and let the system adapt as your semester changes.</p>
        </div>
      </div>

      <section className="cta-band">
        <div className="eyebrow">{auth ? 'Your plan is waiting' : 'Ready to start?'}</div>
        <h2>Plan less. <br />Do more.</h2>
        <p>{auth ? `Pick up where you left off, ${auth.name.split(' ')[0]}.` : 'Join thousands of students who are already studying smarter with Planify.'}</p>
        <button className="start" onClick={auth ? onOpenApp : onGetStarted}>
          {auth ? 'Open dashboard' : 'Get started free'} <IconArrow size={14} />
        </button>
        <div className="row-marks">
          <span>Free forever</span>
          <span>·</span>
          <span>No card</span>
          <span>·</span>
          <span>10K+ students</span>
        </div>
      </section>

      <footer className="foot">
        <span>© 2026 Planify. All rights reserved.</span>
        <div className="links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Contact</a>
        </div>
      </footer>
    </div>
  );
}

function AuthMessage({ type = 'error', children }) {
  if (!children) return null;
  return (
    <div className={'auth-message ' + type}>
      {children}
    </div>
  );
}

const strongPassword = (value) => (
  value.length >= 8 &&
  /[a-z]/.test(value) &&
  /[A-Z]/.test(value) &&
  /\d/.test(value) &&
  /[!@#$%^&*(),.?":{}|<>]/.test(value)
);

function SignInPage({ onBack, onSubmit, onSwitchToRegister, onForgotPassword }) {
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const submit = async e => {
    e.preventDefault();
    if (!email.trim() || !pw) { setError('Enter your email and password to continue.'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('That email address doesn’t look right.'); return; }
    setError('');
    setLoading(true);
    try {
      await onSubmit({ email, password: pw });
    } catch (err) {
      setError(err.message || 'Could not sign in.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="auth">
      <div className="auth-left">
        <div>
          <div className="brand">Planify<span className="dot"></span></div>
          <div className="lead">Welcome back to your personalized study companion.</div>
        </div>
        <div className="marquee">SIGN<br />IN.</div>
        <div className="bullets">
          <div>Track every assignment</div>
          <div>AI-optimized schedules</div>
          <div>Never miss a deadline</div>
        </div>
      </div>

      <div className="auth-right">
        <button className="back-btn" onClick={onBack}><IconBack size={12} /> Back</button>
        <h1 className="title">Sign in.</h1>
        <p className="sub">Enter your credentials to continue.</p>

        <form className="form" onSubmit={submit}>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" placeholder="josh@university.edu" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
          </div>
          <div className="field">
            <label>Password</label>
            <PasswordField placeholder="••••••••" value={pw} onChange={e => setPw(e.target.value)} />
          </div>

          <AuthMessage>{error}</AuthMessage>

          <div className="row-between">
            <label className="check-inline">
              <input type="checkbox" /> Remember me
            </label>
            <button type="button" className="link muted" onClick={onForgotPassword}>Forgot password?</button>
          </div>

          <button type="submit" className="big-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'} <IconArrow size={14} />
          </button>

          <div className="alt">
            Don't have an account?
            <button type="button" className="link" onClick={onSwitchToRegister}>Create one</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ForgotPasswordPage({ onBack, onDone }) {
  const [step, setStep] = React.useState('email');
  const [email, setEmail] = React.useState('');
  const [code, setCode] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [confirmPw, setConfirmPw] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [devCode, setDevCode] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const requestCode = async e => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!/\S+@\S+\.\S+/.test(cleanEmail)) { setError('Enter the email for your account.'); return; }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const data = await PlanifyAPI.requestPasswordReset(cleanEmail);
      setEmail(cleanEmail);
      setMessage(data.message || 'Verification code sent.');
      setDevCode(data.devCode || '');
      setStep('code');
    } catch (err) {
      setError(err.message || 'Could not send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async e => {
    e.preventDefault();
    if (!code.trim()) { setError('Enter the verification code.'); return; }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const data = await PlanifyAPI.verifyPasswordResetCode(email, code);
      setMessage(data.message || 'Code verified.');
      setStep('password');
    } catch (err) {
      setError(err.message || 'Could not verify code.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async e => {
    e.preventDefault();
    if (!strongPassword(pw)) {
      setError('Use 8+ characters with upper/lowercase, a number, and a special character.');
      return;
    }
    if (pw !== confirmPw) { setError('Passwords do not match.'); return; }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const data = await PlanifyAPI.resetPassword(email, code, pw);
      setMessage(data.message || 'Password reset successfully.');
      setTimeout(onDone, 900);
    } catch (err) {
      setError(err.message || 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-left">
        <div>
          <div className="brand">Planify<span className="dot"></span></div>
          <div className="lead">Reset your password with a short verification code.</div>
        </div>
        <div className="marquee">RESET<br />ACCESS.</div>
        <div className="bullets">
          <div>Request a code</div>
          <div>Verify ownership</div>
          <div>Choose a new password</div>
        </div>
      </div>

      <div className="auth-right">
        <button className="back-btn" onClick={onBack}><IconBack size={12} /> Back</button>
        <h1 className="title">Forgot password.</h1>
        <p className="sub">
          {step === 'email' ? 'Enter your account email to get a verification code.' : null}
          {step === 'code' ? `Enter the code sent for ${email}.` : null}
          {step === 'password' ? 'Code verified. Choose your new password.' : null}
        </p>

        <form className="form" onSubmit={step === 'email' ? requestCode : step === 'code' ? verifyCode : resetPassword}>
          {step === 'email' ? (
            <div className="field">
              <label>Email</label>
              <input className="input" type="email" placeholder="josh@university.edu" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
            </div>
          ) : null}

          {step === 'code' ? (
            <div className="field">
              <label>Verification code</label>
              <input className="input auth-code-input" inputMode="numeric" maxLength={6} placeholder="123456" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} autoFocus />
            </div>
          ) : null}

          {step === 'password' ? (
            <>
              <div className="field">
                <label>New password</label>
                <PasswordField placeholder="8+ chars, number, symbol" value={pw} onChange={e => setPw(e.target.value)} />
              </div>
              <div className="field">
                <label>Confirm password</label>
                <PasswordField placeholder="Repeat new password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
              </div>
            </>
          ) : null}

          <AuthMessage>{error}</AuthMessage>
          <AuthMessage type="success">{message}</AuthMessage>

          {devCode ? (
            <div className="auth-dev-code">
              Local dev code: <strong>{devCode}</strong>
            </div>
          ) : null}

          <button type="submit" className="big-btn" disabled={loading}>
            {step === 'email' ? (loading ? 'Sending…' : 'Send code') : null}
            {step === 'code' ? (loading ? 'Verifying…' : 'Verify code') : null}
            {step === 'password' ? (loading ? 'Saving…' : 'Reset password') : null}
            <IconArrow size={14} />
          </button>

          <div className="alt">
            Remembered your password?
            <button type="button" className="link" onClick={onDone}>Sign in</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateAccountPage({ onBack, onSubmit, onSwitchToSignIn }) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [agree, setAgree] = React.useState(false);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const strongEnough = strongPassword(pw);
  const valid = name.trim() && /\S+@\S+\.\S+/.test(email) && strongEnough && agree;
  const submit = async e => {
    e.preventDefault();
    if (!valid) {
      setError('Use a valid email and a password with 8+ characters, upper/lowercase, a number, and a special character.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onSubmit({ name, email, password: pw });
    } catch (err) {
      setError(err.message || 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="auth">
      <div className="auth-left">
        <div>
          <div className="brand">Planify<span className="dot"></span></div>
          <div className="lead">Start your journey to smarter studying. It's free, forever.</div>
        </div>
        <div className="marquee">GET<br />STARTED.</div>
        <div className="stat-grid">
          <div><div className="num">Free</div><div className="lbl">Forever</div></div>
          <div><div className="num">∞</div><div className="lbl">Tasks</div></div>
          <div><div className="num">AI</div><div className="lbl">Powered</div></div>
          <div><div className="num">24/7</div><div className="lbl">Access</div></div>
        </div>
      </div>

      <div className="auth-right">
        <button className="back-btn" onClick={onBack}><IconBack size={12} /> Back</button>
        <h1 className="title">Get started.</h1>
        <p className="sub">Create your free account in under a minute.</p>

        <form className="form" onSubmit={submit}>
          <div className="field">
            <label>Full name</label>
            <input className="input" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" placeholder="josh@university.edu" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Password</label>
            <PasswordField placeholder="8+ chars, number, symbol" value={pw} onChange={e => setPw(e.target.value)} />
          </div>

          <AuthMessage>{error}</AuthMessage>

          <label className="check-inline" style={{ fontSize: 13, color: 'var(--muted)' }}>
            <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />
            <span>I agree to the <button type="button" className="link" style={{ display: 'inline' }}>Terms</button> and <button type="button" className="link" style={{ display: 'inline' }}>Privacy Policy</button></span>
          </label>

          <button type="submit" className="big-btn" disabled={!valid || loading} style={!valid || loading ? { background: 'var(--muted-2)', borderColor: 'var(--muted-2)', cursor: 'not-allowed' } : null}>
            {loading ? 'Creating…' : 'Create account'} <IconArrow size={14} />
          </button>

          <div className="alt">
            Already have an account?
            <button type="button" className="link" onClick={onSwitchToSignIn}>Sign in</button>
          </div>
        </form>
      </div>
    </div>
  );
}

Object.assign(window, { LandingPage, SignInPage, ForgotPasswordPage, CreateAccountPage });

export { LandingPage, SignInPage, ForgotPasswordPage, CreateAccountPage };
