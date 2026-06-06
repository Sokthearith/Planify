/* Landing, SignIn, CreateAccount */

function LandingPage({ onSignIn, onGetStarted, auth, onOpenApp, onSignOut }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="brand">Planify<span className="dot"></span></div>
        <nav className="links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#stats">Stats</a>
        </nav>
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
            Study<br />
            <span className="accent">smarter,</span><br />
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

function SignInPage({ onBack, onSubmit, onSwitchToRegister }) {
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
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

        <form className="form" onSubmit={e => { e.preventDefault(); onSubmit(); }}>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" placeholder="josh@university.edu" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
          </div>
          <div className="field">
            <label>Password</label>
            <input className="input" type="password" placeholder="••••••••" value={pw} onChange={e => setPw(e.target.value)} />
          </div>

          <div className="row-between">
            <label className="check-inline">
              <input type="checkbox" /> Remember me
            </label>
            <button type="button" className="link muted">Forgot password?</button>
          </div>

          <button type="submit" className="big-btn">Sign in <IconArrow size={14} /></button>

          <div className="alt">
            Don't have an account?
            <button type="button" className="link" onClick={onSwitchToRegister}>Create one</button>
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
  const valid = name.trim() && email.trim() && pw.length >= 6 && agree;
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

        <form className="form" onSubmit={e => { e.preventDefault(); if (valid) onSubmit(); }}>
          <div className="field">
            <label>Full name</label>
            <input className="input" placeholder="Josh Williams" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" placeholder="josh@university.edu" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Password</label>
            <input className="input" type="password" placeholder="At least 6 characters" value={pw} onChange={e => setPw(e.target.value)} />
          </div>

          <label className="check-inline" style={{ fontSize: 13, color: 'var(--muted)' }}>
            <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />
            <span>I agree to the <button type="button" className="link" style={{ display: 'inline' }}>Terms</button> and <button type="button" className="link" style={{ display: 'inline' }}>Privacy Policy</button></span>
          </label>

          <button type="submit" className="big-btn" disabled={!valid} style={!valid ? { background: 'var(--muted-2)', borderColor: 'var(--muted-2)', cursor: 'not-allowed' } : null}>
            Create account <IconArrow size={14} />
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

Object.assign(window, { LandingPage, SignInPage, CreateAccountPage });
