import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Brand from '../components/Brand.jsx';
import api, { getApiError } from '../services/api.js';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (localStorage.getItem('railway_token')) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('railway_token', data.token);
      localStorage.setItem('railway_user', JSON.stringify(data.user));
      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      setError(getApiError(requestError, 'We could not sign you in. Check your details and try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-showcase">
        <div className="showcase-top"><Brand light /></div>
        <div className="showcase-content">
          <p className="eyebrow eyebrow-light"><span className="eyebrow-dot" /> A smarter way to travel</p>
          <h1>Every journey<br />starts <em>somewhere.</em></h1>
          <p className="showcase-description">Plan your route, manage your reservations, and get a clearer picture of your waitlist — all in one place.</p>
          <div className="route-art" aria-label="Decorative railway route illustration">
            <div className="route-art-line" />
            <div className="route-stop stop-a"><span /><small>NEW DELHI</small></div>
            <div className="route-stop stop-b"><span /><small>AGRA</small></div>
            <div className="route-stop stop-c"><span /><small>MUMBAI</small></div>
            <div className="route-ticket"><div className="ticket-icon">↗</div><div><strong>Your next chapter</strong><small>One booking away</small></div><span className="ticket-arrow">↗</span></div>
          </div>
        </div>
        <div className="showcase-footer"><span>BUILT FOR BETTER JOURNEYS</span><span>DBMS PROJECT · 2026</span></div>
      </section>
      <section className="auth-form-panel">
        <div className="auth-mobile-brand"><Brand /></div>
        <div className="auth-form-wrap">
          <p className="eyebrow">WELCOME BACK</p>
          <h2>Sign in to your account</h2>
          <p className="muted auth-subtitle">Pick up where your journey left off.</p>
          {error && <div className="alert alert-error" role="alert">{error}</div>}
          <form onSubmit={handleSubmit} className="auth-form">
            <label htmlFor="login-email">Email address</label>
            <div className="input-wrap"><span className="input-symbol">✉</span><input id="login-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div className="label-row"><label htmlFor="login-password">Password</label><span className="field-hint">Minimum 8 characters</span></div>
            <div className="input-wrap"><span className="input-symbol">⌑</span><input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required /><button className="show-password" type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Hide' : 'Show'}</button></div>
            <button className="button button-primary auth-submit" type="submit" disabled={loading}>{loading ? <><span className="spinner" /> Signing you in…</> : <>Sign in <span>→</span></>}</button>
          </form>
          <div className="auth-divider"><span /> <small>NEW TO RAILWAY+?</small> <span /></div>
          <p className="auth-switch">Create an account to book and track your journeys. <Link to="/register">Create account <span>↗</span></Link></p>
          <div className="auth-note"><span className="secure-icon">✓</span><span>Your account is protected with password hashing and secure session tokens.</span></div>
        </div>
        <footer className="auth-legal"><span>RAILWAY+ ACADEMIC DEMONSTRATION</span><span>Privacy-conscious · Database-backed</span></footer>
      </section>
    </main>
  );
}
