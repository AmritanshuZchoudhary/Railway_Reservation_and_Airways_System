import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Brand from '../components/Brand.jsx';
import api, { getApiError } from '../services/api.js';

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (localStorage.getItem('railway_token')) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) return setError('Your passwords do not match.');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { full_name: fullName, email, password });
      localStorage.setItem('railway_token', data.token);
      localStorage.setItem('railway_user', JSON.stringify(data.user));
      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      setError(getApiError(requestError, 'We could not create the account. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-showcase register-showcase">
        <div className="showcase-top"><Brand light /></div>
        <div className="showcase-content">
          <p className="eyebrow eyebrow-light"><span className="eyebrow-dot" /> Your journey, your way</p>
          <h1>Make room<br />for <em>what's next.</em></h1>
          <p className="showcase-description">A personal space for booking journeys, keeping track of every ticket, and understanding your place on the waitlist.</p>
          <div className="register-points"><div><span>01</span><p><strong>Search with clarity</strong><small>Find schedules and available seats.</small></p></div><div><span>02</span><p><strong>Stay in the loop</strong><small>Track confirmed and waitlisted bookings.</small></p></div><div><span>03</span><p><strong>See the history</strong><small>Explore estimates based on recorded outcomes.</small></p></div></div>
        </div>
        <div className="showcase-footer"><span>BUILT FOR BETTER JOURNEYS</span><span>DBMS PROJECT · 2026</span></div>
      </section>
      <section className="auth-form-panel">
        <div className="auth-mobile-brand"><Brand /></div>
        <div className="auth-form-wrap register-form-wrap">
          <p className="eyebrow">GET STARTED</p>
          <h2>Create your account</h2>
          <p className="muted auth-subtitle">It takes less than a minute.</p>
          {error && <div className="alert alert-error" role="alert">{error}</div>}
          <form onSubmit={handleSubmit} className="auth-form">
            <label htmlFor="register-name">Full name</label>
            <div className="input-wrap"><span className="input-symbol">◎</span><input id="register-name" type="text" autoComplete="name" placeholder="Your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} minLength={2} maxLength={120} required /></div>
            <label htmlFor="register-email">Email address</label>
            <div className="input-wrap"><span className="input-symbol">✉</span><input id="register-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <label htmlFor="register-password">Password</label>
            <div className="input-wrap"><span className="input-symbol">⌑</span><input id="register-password" type="password" autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} maxLength={72} required /></div>
            <label htmlFor="register-confirm">Confirm password</label>
            <div className="input-wrap"><span className="input-symbol">✓</span><input id="register-confirm" type="password" autoComplete="new-password" placeholder="Enter your password again" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} maxLength={72} required /></div>
            <button className="button button-primary auth-submit" type="submit" disabled={loading}>{loading ? <><span className="spinner" /> Creating account…</> : <>Create account <span>→</span></>}</button>
          </form>
          <p className="auth-switch register-switch">Already have an account? <Link to="/login">Sign in <span>↗</span></Link></p>
          <div className="auth-note"><span className="secure-icon">✓</span><span>Passwords are hashed before storage. This project never stores plaintext passwords.</span></div>
        </div>
        <footer className="auth-legal"><span>RAILWAY+ ACADEMIC DEMONSTRATION</span><span>Privacy-conscious · Database-backed</span></footer>
      </section>
    </main>
  );
}
