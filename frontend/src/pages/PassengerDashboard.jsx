import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Brand from '../components/Brand.jsx';
import api, { getApiError } from '../services/api.js';

const iconPaths = {
  overview: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.2 4.2"/></>,
  bookings: <><path d="M5 4.5h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z"/><path d="M8 9h8M8 13h5"/></>,
  insights: <><path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 5-7"/><path d="M16 6h3v3"/></>,
  admin: <><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9h6M9 13h6M9 17h3"/></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  train: <><rect x="5" y="3" width="14" height="16" rx="3"/><path d="M8 7h8M8 11h.01M16 11h.01M8 19l-2 3m10-3 2 3M7 16h10"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  ticket: <><path d="M4 6.5A2.5 2.5 0 0 0 6.5 4h11A2.5 2.5 0 0 0 20 6.5v2a2.5 2.5 0 0 0 0 5v2a2.5 2.5 0 0 0-2.5 2.5h-11A2.5 2.5 0 0 0 4 15.5v-2a2.5 2.5 0 0 0 0-5Z"/><path d="M12 7v2m0 3v2m0 3v.1"/></>
};

function Icon({ name, size = 19 }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{iconPaths[name] || iconPaths.overview}</svg>;
}

function localDatePlus(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(value, options = { weekday: 'short', day: 'numeric', month: 'short' }) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', options).format(date);
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));
}

function getStatusClass(status) {
  if (status === 'CONFIRMED') return 'status-confirmed';
  if (status === 'WAITLISTED') return 'status-waitlisted';
  return 'status-cancelled';
}

function getInitials(name = 'Guest') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'G';
}

function EmptyState({ title, description, action, onAction }) {
  return <div className="empty-state"><div className="empty-state-icon"><Icon name="ticket" size={24}/></div><h3>{title}</h3><p>{description}</p>{action && <button className="button button-outline button-small" onClick={onAction}>{action}</button>}</div>;
}

function ProbabilityCard({ item }) {
  if (!item) return null;
  const canEstimate = item.canEstimate && Number.isFinite(Number(item.probabilityPercent));
  const percent = canEstimate ? Number(item.probabilityPercent) : 0;
  return (
    <div className="probability-card">
      <div className="probability-heading"><div><span className="mini-label">HISTORICAL ESTIMATE</span><h4>Confirmation outlook</h4></div><span className={`data-chip ${canEstimate ? (item.dataSupport === 'STRONG' ? 'data-strong' : 'data-adequate') : 'data-low'}`}>{canEstimate ? item.dataSupport : 'LOW DATA'}</span></div>
      {canEstimate ? <>
        <div className="probability-main"><div className="probability-ring" style={{ '--probability': `${percent * 3.6}deg` }}><div><strong>{percent}%</strong><small>estimated</small></div></div><div className="probability-summary"><strong>{item.successes} of {item.totalSample}</strong><span>comparable cases confirmed</span><small>{item.unsuccessful} did not confirm</small></div></div>
        <div className="probability-bar"><span style={{ width: `${percent}%` }}/></div>
        <p className="probability-group">{item.comparisonGroup}</p>
      </> : <div className="probability-empty"><span className="probability-empty-icon">i</span><p>{item.message || 'There is not enough historical data for a useful estimate.'}</p><small>{item.totalSample ?? 0} comparable outcomes · {item.minimumSampleRequired ?? 20} required</small></div>}
      <div className="probability-source-tags"><span>Recorded outcomes <b>{item.recordedObservations ?? 0}</b></span><span>Simulated demo <b>{item.simulatedObservations ?? 0}</b></span></div>
      <p className="probability-disclaimer">Historical estimate only — it is not a guarantee of confirmation. Demo records are simulated; recorded outcomes are collected from completed demo journeys.</p>
    </div>
  );
}

function BookingCard({ booking, onCancel, onCheckProbability, probability, probabilityLoading }) {
  const canCancel = booking.status !== 'CANCELLED' && new Date(`${String(booking.journey_date).slice(0, 10)}T12:00:00`) >= new Date(new Date().toDateString());
  return (
    <article className="booking-card">
      <div className="booking-card-main">
        <div className="train-avatar"><Icon name="train" size={22}/></div>
        <div className="booking-route-content">
          <div className="booking-top-line"><strong>{booking.train_name}</strong><span className="train-number">#{booking.train_number}</span><span className={`status-pill ${getStatusClass(booking.status)}`}>{booking.status === 'WAITLISTED' && booking.queue_position ? `WAITLIST #${booking.queue_position}` : booking.status}</span></div>
          <div className="booking-stations"><strong>{booking.origin_station}</strong><span className="route-dash">────────</span><strong>{booking.destination_station}</strong></div>
          <div className="booking-metadata"><span><Icon name="clock" size={14}/>{formatDate(booking.journey_date)} · {booking.departure_time}</span><span>{booking.class_type.replace('_', ' ')}</span>{booking.seat_number && <span>Seat {booking.coach_number}-{booking.seat_number}</span>}</div>
        </div>
        <div className="booking-price"><small>FARE</small><strong>{formatMoney(booking.fare)}</strong><small>Ref. #{booking.booking_id}</small></div>
      </div>
      {booking.status === 'WAITLISTED' && <div className="booking-inline-insight"><span className="insight-bullet"/><span>You're on the waitlist. Check a historical estimate for similar cases.</span><button className="text-button" onClick={() => onCheckProbability(booking.booking_id)} disabled={probabilityLoading}>{probabilityLoading ? 'Calculating…' : probability ? 'Refresh estimate' : 'Check probability'} <span>↗</span></button></div>}
      {probability && <ProbabilityCard item={probability}/>}
      {canCancel && <div className="booking-actions"><span className="booking-reference">Booked {formatDate(booking.booking_time, { day: 'numeric', month: 'short', year: 'numeric' })}</span><button className="button button-quiet-danger button-small" onClick={() => onCancel(booking.booking_id)}>Cancel booking</button></div>}
    </article>
  );
}

function StatCard({ label, value, caption, icon, tone }) {
  return <article className="stat-card"><div className={`stat-icon ${tone}`}><Icon name={icon} size={20}/></div><div className="stat-copy"><span>{label}</span><strong>{value ?? '—'}</strong><small>{caption}</small></div><div className="stat-corner"/></article>;
}

export default function PassengerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('railway_user') || 'null'); } catch { return null; }
  });
  const [activeView, setActiveView] = useState('overview');
  const [summary, setSummary] = useState(null);
  const [adminSummary, setAdminSummary] = useState(null);
  const [finalizingHistory, setFinalizingHistory] = useState(false);
  const [stations, setStations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [originId, setOriginId] = useState('1');
  const [destinationId, setDestinationId] = useState('4');
  const [journeyDate, setJourneyDate] = useState(localDatePlus(3));
  const [classType, setClassType] = useState('SLEEPER');
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [busyBookingId, setBusyBookingId] = useState(null);
  const [bookingInProgress, setBookingInProgress] = useState(null);
  const [probabilities, setProbabilities] = useState({});
  const [probabilityLoading, setProbabilityLoading] = useState({});
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const showToast = useCallback((message, tone = 'success') => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 5200);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('railway_token');
    localStorage.removeItem('railway_user');
    navigate('/login', { replace: true });
  }, [navigate]);

  const refreshBookingsAndSummary = useCallback(async () => {
    const [bookingResponse, summaryResponse] = await Promise.all([
      api.get('/bookings/my'),
      api.get('/dashboard/summary')
    ]);
    setBookings(bookingResponse.data.bookings || []);
    setSummary(summaryResponse.data.summary || null);
  }, []);

  useEffect(() => {
    let active = true;
    async function loadDashboard() {
      setLoading(true);
      setError('');
      try {
        const [meRes, stationRes, bookingRes, summaryRes] = await Promise.all([
          api.get('/auth/me'), api.get('/stations'), api.get('/bookings/my'), api.get('/dashboard/summary')
        ]);
        if (!active) return;
        setUser(meRes.data.user);
        localStorage.setItem('railway_user', JSON.stringify(meRes.data.user));
        setStations(stationRes.data.stations || []);
        setBookings(bookingRes.data.bookings || []);
        setSummary(summaryRes.data.summary || null);
        if (meRes.data.user.role === 'ADMIN') {
          const adminRes = await api.get('/dashboard/admin/summary');
          if (active) setAdminSummary(adminRes.data.summary || null);
        }
      } catch (requestError) {
        if (!active) return;
        if (requestError.response?.status === 401) return logout();
        setError(getApiError(requestError, 'Could not load the dashboard.'));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadDashboard();
    return () => { active = false; };
  }, [logout]);

  const waitingBookings = useMemo(() => bookings.filter((booking) => booking.status === 'WAITLISTED'), [bookings]);
  const titleMap = { overview: 'Overview', search: 'Find a journey', bookings: 'My reservations', insights: 'Waitlist insights', admin: 'Admin console' };

  const handleSearch = async (event) => {
    event?.preventDefault();
    if (!originId || !destinationId || originId === destinationId) {
      setToast({ message: 'Choose two different stations to search.', tone: 'error' });
      return;
    }
    setSearching(true); setSearched(true); setSchedules([]); setError('');
    try {
      const { data } = await api.get('/schedules/search', { params: { origin_station_id: originId, destination_station_id: destinationId, journey_date: journeyDate, class_type: classType } });
      setSchedules(data.schedules || []);
      if (!data.schedules?.length) showToast('No schedules matched those filters. Try a different date or route.', 'info');
    } catch (requestError) {
      if (requestError.response?.status === 401) return logout();
      setError(getApiError(requestError, 'Journey search failed.'));
    } finally { setSearching(false); }
  };

  const handleBook = async (schedule) => {
    setBookingInProgress(schedule.schedule_id); setError('');
    try {
      const { data } = await api.post('/bookings/create', { schedule_id: schedule.schedule_id, class_type: schedule.class_type });
      showToast(`${data.message} Booking reference #${data.booking_id}.`);
      await refreshBookingsAndSummary();
      if (data.status === 'WAITLISTED') {
        setActiveView('bookings');
        window.setTimeout(() => checkProbability(data.booking_id), 100);
      }
    } catch (requestError) {
      if (requestError.response?.status === 401) return logout();
      setError(getApiError(requestError, 'Booking failed.'));
    } finally { setBookingInProgress(null); }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm(`Cancel booking #${bookingId}? If you have a confirmed seat, the first eligible waitlisted passenger may be promoted automatically.`)) return;
    setBusyBookingId(bookingId); setError('');
    try {
      const { data } = await api.post('/bookings/cancel', { booking_id: bookingId });
      showToast(data.message || 'Booking cancelled.');
      setProbabilities((current) => { const next = { ...current }; delete next[bookingId]; return next; });
      await refreshBookingsAndSummary();
      if (user?.role === 'ADMIN') {
        const adminRes = await api.get('/dashboard/admin/summary'); setAdminSummary(adminRes.data.summary || null);
      }
    } catch (requestError) {
      if (requestError.response?.status === 401) return logout();
      setError(getApiError(requestError, 'Cancellation failed.'));
    } finally { setBusyBookingId(null); }
  };

  const checkProbability = async (bookingId) => {
    setProbabilityLoading((current) => ({ ...current, [bookingId]: true }));
    try {
      const { data } = await api.get('/probability', { params: { booking_id: bookingId } });
      setProbabilities((current) => ({ ...current, [bookingId]: data }));
    } catch (requestError) {
      if (requestError.response?.status === 401) return logout();
      showToast(getApiError(requestError, 'Could not calculate the historical estimate.'), 'error');
    } finally { setProbabilityLoading((current) => ({ ...current, [bookingId]: false })); }
  };

  const navigateTo = (view) => {
    setActiveView(view);
    setError('');
    if (view === 'admin' && user?.role === 'ADMIN' && !adminSummary) {
      api.get('/dashboard/admin/summary').then(({ data }) => setAdminSummary(data.summary)).catch((e) => setError(getApiError(e)));
    }
  };

  const handleFinalizeHistory = async () => {
    setFinalizingHistory(true);
    try {
      const { data } = await api.post('/dashboard/admin/finalize-history');
      showToast(data.message || 'Historical outcomes checked.', data.inserted_count ? 'success' : 'info');
      const { data: refreshed } = await api.get('/dashboard/admin/summary');
      setAdminSummary(refreshed.summary || null);
    } catch (requestError) {
      if (requestError.response?.status === 401) return logout();
      showToast(getApiError(requestError, 'Could not finalize historical outcomes.'), 'error');
    } finally { setFinalizingHistory(false); }
  };

  const searchPanel = (
    <section className="search-panel">
      <div className="section-heading search-heading"><div><p className="eyebrow">PLAN THE NEXT CHAPTER</p><h2>Find your journey</h2><p className="muted">A few details. A better journey.</p></div><div className="search-heading-mark"><Icon name="train" size={27}/></div></div>
      <form className="journey-form" onSubmit={handleSearch}>
        <div className="field-group station-field"><label htmlFor="origin">FROM</label><div className="select-with-icon"><Icon name="pin" size={17}/><select id="origin" value={originId} onChange={(e) => setOriginId(e.target.value)} required><option value="">Choose origin</option>{stations.map((station) => <option key={station.station_id} value={station.station_id}>{station.station_name} · {station.city}</option>)}</select></div></div>
        <button type="button" className="swap-stations" title="Swap origin and destination" onClick={() => { setOriginId(destinationId); setDestinationId(originId); }} aria-label="Swap origin and destination">⇄</button>
        <div className="field-group station-field"><label htmlFor="destination">TO</label><div className="select-with-icon"><Icon name="pin" size={17}/><select id="destination" value={destinationId} onChange={(e) => setDestinationId(e.target.value)} required><option value="">Choose destination</option>{stations.map((station) => <option key={station.station_id} value={station.station_id}>{station.station_name} · {station.city}</option>)}</select></div></div>
        <div className="field-group date-field"><label htmlFor="journey-date">JOURNEY DATE</label><div className="select-with-icon"><Icon name="clock" size={17}/><input id="journey-date" type="date" min={localDatePlus(0)} value={journeyDate} onChange={(e) => setJourneyDate(e.target.value)} required /></div></div>
        <div className="field-group class-field"><label htmlFor="travel-class">CLASS</label><div className="select-with-icon"><Icon name="ticket" size={17}/><select id="travel-class" value={classType} onChange={(e) => setClassType(e.target.value)}><option value="SLEEPER">Sleeper</option><option value="AC">AC</option><option value="CHAIR_CAR">Chair car</option></select></div></div>
        <button className="button button-primary search-submit" type="submit" disabled={searching}>{searching ? <span className="spinner"/> : <Icon name="search" size={17}/>}<span>{searching ? 'Searching' : 'Search trains'}</span></button>
      </form>
      <div className="search-footnote"><span className="green-dot"/> Availability is checked against current database allocations <span className="footnote-divider">·</span> Demo routes and schedules</div>
    </section>
  );

  const searchResultsPanel = searched && (
    <section className="results-section">
      <div className="section-heading"><div><p className="eyebrow">YOUR MATCHES</p><h2>Available schedules <span className="count-pill">{schedules.length}</span></h2></div><button className="text-button" onClick={() => { setSearched(false); setSchedules([]); }}>Clear results <Icon name="close" size={14}/></button></div>
      {schedules.length ? <div className="schedule-list">{schedules.map((schedule) => <article className="schedule-card" key={schedule.schedule_id}>
        <div className="schedule-title-row"><div><div className="schedule-name"><strong>{schedule.train_name}</strong><span className="train-number">#{schedule.train_number}</span></div><small className="muted">Journey {formatDate(schedule.journey_date, { weekday: 'long', day: 'numeric', month: 'long' })}</small></div><span className={`availability-pill ${Number(schedule.available_seats) > 0 ? 'availability-open' : 'availability-full'}`}>{Number(schedule.available_seats) > 0 ? `${schedule.available_seats} seats left` : 'Waitlist'}</span></div>
        <div className="schedule-route"><div className="schedule-time"><strong>{schedule.departure_time}</strong><small>{schedule.origin_city}</small><span>{schedule.origin_station}</span></div><div className="schedule-track"><span>{schedule.origin_station}</span><div className="track-line"><i/><b><Icon name="train" size={15}/></b><i/></div><span>{schedule.destination_station}</span></div><div className="schedule-time schedule-time-end"><strong>{schedule.arrival_time}</strong><small>{schedule.destination_city}</small><span>{schedule.destination_station}</span></div></div>
        <div className="schedule-bottom"><span className="class-chip">{schedule.class_type.replace('_', ' ')}</span><span className="fare-label">FROM <strong>{formatMoney(schedule.base_fare)}</strong></span><button className="button button-primary button-small" onClick={() => handleBook(schedule)} disabled={bookingInProgress === schedule.schedule_id}>{bookingInProgress === schedule.schedule_id ? 'Processing…' : Number(schedule.available_seats) > 0 ? 'Book a seat' : 'Join waitlist'} <span>→</span></button></div>
      </article>)}</div> : <EmptyState title="No trains on this route yet" description="Try another journey date or one of the other demo routes. Search results use the live database." action="Edit search" onAction={() => setSearched(false)}/>}
    </section>
  );

  const bookingsPanel = (list = bookings, title = 'Your reservations') => (
    <section className="bookings-section">
      <div className="section-heading"><div><p className="eyebrow">THE DETAILS, ALL IN ONE PLACE</p><h2>{title} <span className="count-pill">{list.length}</span></h2></div>{activeView === 'overview' && <button className="text-button" onClick={() => navigateTo('bookings')}>View all <Icon name="arrow" size={15}/></button>}</div>
      {list.length ? <div className="booking-list">{list.map((booking) => <BookingCard key={booking.booking_id} booking={booking} onCancel={handleCancel} onCheckProbability={checkProbability} probability={probabilities[booking.booking_id]} probabilityLoading={Boolean(probabilityLoading[booking.booking_id])}/>)}</div> : <EmptyState title="No reservations yet" description="Search a route, compare the available schedules, and your bookings will appear here." action="Find a journey" onAction={() => navigateTo('search')}/>}
    </section>
  );

  const adminPanel = () => (
    <section className="admin-overview">
      <div className="feature-banner"><div className="feature-banner-icon"><Icon name="admin" size={26}/></div><div className="feature-banner-copy"><p className="eyebrow eyebrow-light">CONTROL ROOM</p><h2>System at a glance</h2><p>Live totals from the MySQL database. These figures update as demo reservations are made.</p></div><button className="button button-banner-action" onClick={handleFinalizeHistory} disabled={finalizingHistory}>{finalizingHistory ? <span className="spinner"/> : <Icon name="insights" size={16}/>}<span>{finalizingHistory ? 'Finalizing…' : 'Finalize past outcomes'}</span></button></div>
      {adminSummary ? <div className="admin-stat-grid">
        <StatCard label="Registered passengers" value={adminSummary.passengers} caption="Passenger accounts" icon="overview" tone="tone-indigo"/>
        <StatCard label="Active trains" value={adminSummary.active_trains} caption="In the demo network" icon="train" tone="tone-teal"/>
        <StatCard label="Open schedules" value={adminSummary.open_schedules} caption="Future bookable journeys" icon="clock" tone="tone-blue"/>
        <StatCard label="All bookings" value={adminSummary.total_bookings} caption="Across all passengers" icon="bookings" tone="tone-orange"/>
        <StatCard label="On the waitlist" value={adminSummary.current_waitlist} caption="Waiting for a seat" icon="ticket" tone="tone-purple"/>
        <StatCard label="Automatic promotions" value={adminSummary.promotions} caption="Promoted by database trigger" icon="check" tone="tone-green"/>
        <StatCard label="Cancellations" value={adminSummary.cancellations} caption="Cancellation audit records" icon="close" tone="tone-red"/>
        <StatCard label="Demo history rows" value={adminSummary.simulated_history_rows} caption="Synthetic observations" icon="insights" tone="tone-teal"/>
        <StatCard label="Recorded outcomes" value={adminSummary.recorded_history_rows} caption="From completed demo journeys" icon="check" tone="tone-green"/>
      </div> : <div className="inline-loading"><span className="spinner"/> Loading system metrics…</div>}
      <div className="admin-note"><strong>Academic demo note</strong><p>Historical probability records included with the project are synthetic test data. They demonstrate the calculation logic and must not be presented as official or real railway statistics.</p></div>
    </section>
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand"><Brand light/></div>
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          <button className={activeView === 'overview' ? 'nav-item active' : 'nav-item'} onClick={() => navigateTo('overview')}><Icon name="overview"/><span>Overview</span></button>
          <button className={activeView === 'search' ? 'nav-item active' : 'nav-item'} onClick={() => navigateTo('search')}><Icon name="search"/><span>Find a journey</span></button>
          <button className={activeView === 'bookings' ? 'nav-item active' : 'nav-item'} onClick={() => navigateTo('bookings')}><Icon name="bookings"/><span>My reservations</span>{waitingBookings.length > 0 && <i className="nav-count">{waitingBookings.length}</i>}</button>
          <button className={activeView === 'insights' ? 'nav-item active' : 'nav-item'} onClick={() => navigateTo('insights')}><Icon name="insights"/><span>Waitlist insights</span></button>
          {user?.role === 'ADMIN' && <><div className="sidebar-section-label sidebar-section-spaced">MANAGEMENT</div><button className={activeView === 'admin' ? 'nav-item active' : 'nav-item'} onClick={() => navigateTo('admin')}><Icon name="admin"/><span>Admin console</span></button></>}
        </nav>
        <div className="sidebar-lower">
          <div className="sidebar-tip"><div className="sidebar-tip-mark">✦</div><strong>Worth knowing</strong><p>Waitlist estimates use recorded outcomes from similar cases — never a guarantee.</p><button onClick={() => navigateTo('insights')}>Explore insights <span>→</span></button></div>
          <div className="sidebar-user"><div className="avatar avatar-small">{getInitials(user?.full_name)}</div><div className="sidebar-user-details"><strong>{user?.full_name || 'Passenger'}</strong><small>{user?.role === 'ADMIN' ? 'Administrator' : 'Passenger account'}</small></div><button className="logout-icon" onClick={logout} title="Sign out" aria-label="Sign out"><Icon name="logout" size={17}/></button></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar"><div className="breadcrumb"><span>Workspace</span><b>/</b><strong>{titleMap[activeView]}</strong></div><div className="topbar-right"><span className="service-status"><i/> System ready</span><div className="topbar-divider"/><div className="topbar-user"><span className="topbar-greeting">Welcome back,</span><strong>{user?.full_name?.split(' ')[0] || 'traveller'}</strong></div><div className="avatar">{getInitials(user?.full_name)}</div></div></header>
        <div className="content-area">
          {error && <div className="alert alert-error dashboard-alert" role="alert"><span>!</span>{error}<button onClick={() => setError('')} aria-label="Dismiss error"><Icon name="close" size={16}/></button></div>}
          {loading ? <div className="dashboard-loading"><span className="spinner spinner-dark"/><p>Preparing your journey dashboard…</p></div> : <>
            {activeView === 'overview' && <>
              <div className="page-intro"><div><p className="eyebrow">{formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}</p><h1>Your journeys, <em>in motion.</em></h1><p className="muted">Everything you need for the next stop — right here.</p></div><div className="intro-mark"><Icon name="train" size={27}/><span>RAILWAY+<small>SMARTER JOURNEY PLANNING</small></span></div></div>
              <div className="stats-grid">
                <StatCard label="Total bookings" value={summary?.total_bookings ?? 0} caption="Reservations you've made" icon="bookings" tone="tone-indigo"/>
                <StatCard label="Confirmed" value={summary?.confirmed_bookings ?? 0} caption="Seats currently assigned" icon="check" tone="tone-teal"/>
                <StatCard label="On the waitlist" value={summary?.waitlisted_bookings ?? 0} caption="Watching for availability" icon="clock" tone="tone-orange"/>
                <StatCard label="Cancelled" value={summary?.cancelled_bookings ?? 0} caption="Kept in your history" icon="close" tone="tone-purple"/>
              </div>
              {searchPanel}
              {searchResultsPanel}
              {bookingsPanel(bookings.slice(0, 3), 'Your latest reservations')}
              <div className="method-note"><div className="method-icon"><Icon name="insights" size={20}/></div><div><strong>Small data. Honest estimates.</strong><p>The waitlist outlook uses comparable outcomes saved in MySQL. Simulated demonstration records are clearly labelled; estimates are not promises.</p></div><button className="text-button" onClick={() => navigateTo('insights')}>How it works <Icon name="arrow" size={14}/></button></div>
            </>}
            {activeView === 'search' && <><div className="page-intro compact-intro"><div><p className="eyebrow">DISCOVER YOUR ROUTE</p><h1>Find your next <em>departure.</em></h1><p className="muted">Search the demo network by origin, destination, date, and class.</p></div></div>{searchPanel}{searchResultsPanel}</>}
            {activeView === 'bookings' && <><div className="page-intro compact-intro"><div><p className="eyebrow">YOUR TRAVEL TIMELINE</p><h1>Every ticket, <em>in one place.</em></h1><p className="muted">Review seats, queue positions, status, and cancellation history.</p></div><div className="mini-counter"><strong>{bookings.length}</strong><small>total records</small></div></div><div className="booking-filters"><span className="filter-pill active">All <b>{bookings.length}</b></span><span className="filter-pill"><span className="pill-dot dot-confirmed"/>Confirmed <b>{bookings.filter((b) => b.status === 'CONFIRMED').length}</b></span><span className="filter-pill"><span className="pill-dot dot-waiting"/>Waitlisted <b>{waitingBookings.length}</b></span><span className="filter-pill"><span className="pill-dot dot-cancelled"/>Cancelled <b>{bookings.filter((b) => b.status === 'CANCELLED').length}</b></span></div>{bookingsPanel(bookings, 'Reservation history')}</>}
            {activeView === 'insights' && <><div className="page-intro compact-intro"><div><p className="eyebrow">THE SIGNAL IN THE HISTORY</p><h1>Waitlist, with <em>context.</em></h1><p className="muted">A historical estimate can inform a decision, but it cannot promise an outcome.</p></div><div className="insight-hero-icon"><Icon name="insights" size={28}/></div></div><div className="insight-method-grid"><article className="method-card"><div className="method-card-icon teal"><Icon name="check" size={21}/></div><h3>How the estimate works</h3><p>The API compares your active waitlist position and days until departure with recorded cases for the same route and class, then broadens the comparison if the sample is too small.</p><div className="formula-box"><span>CONFIRMED COMPARABLE CASES</span><b>÷</b><span>ALL KNOWN COMPARABLE OUTCOMES</span><i>× 100 = historical percentage</i></div></article><article className="method-card"><div className="method-card-icon orange"><Icon name="clock" size={21}/></div><h3>Evidence before confidence</h3><p>The estimator requires at least 20 known outcomes. Passenger-initiated cancellations are excluded. If the dataset is too small, the system says so instead of inventing a percentage.</p><div className="evidence-row"><span><i className="evidence-dot evidence-good"/> Strong sample</span><strong>50+ cases</strong></div><div className="evidence-row"><span><i className="evidence-dot evidence-mid"/> Adequate sample</span><strong>20–49 cases</strong></div><div className="evidence-row"><span><i className="evidence-dot evidence-low"/> Not enough data</span><strong>Under 20</strong></div></article></div><div className="simulation-banner"><div className="simulation-symbol">!</div><div><strong>Important: sample history is simulated</strong><p>This academic project includes synthetic records so the probability workflow can be demonstrated without authentic railway data. The displayed percentage is not an official railway prediction.</p></div></div><section className="bookings-section"><div className="section-heading"><div><p className="eyebrow">ACTIVE QUEUE</p><h2>Your waitlisted bookings <span className="count-pill">{waitingBookings.length}</span></h2></div></div>{waitingBookings.length ? <div className="booking-list">{waitingBookings.map((booking) => <BookingCard key={booking.booking_id} booking={booking} onCancel={handleCancel} onCheckProbability={checkProbability} probability={probabilities[booking.booking_id]} probabilityLoading={Boolean(probabilityLoading[booking.booking_id])}/>)}</div> : <EmptyState title="No active waitlist bookings" description="If a journey is full, join its waitlist and its historical estimate will appear here." action="Find a journey" onAction={() => navigateTo('search')}/>}</section></>}
            {activeView === 'admin' && user?.role === 'ADMIN' && adminPanel()}
          </>}
          <footer className="dashboard-footer"><span>RAILWAY+ <b>·</b> DATABASE SYSTEMS PROJECT</span><span>Built for clarity, powered by structured data.</span></footer>
        </div>
      </main>
      {toast && <div className={`toast toast-${toast.tone}`} role="status"><span className="toast-mark">{toast.tone === 'error' ? '!' : toast.tone === 'info' ? 'i' : '✓'}</span><span>{toast.message}</span><button onClick={() => setToast(null)} aria-label="Dismiss notification"><Icon name="close" size={15}/></button></div>}
      {busyBookingId && <div className="action-busy-overlay"><div><span className="spinner spinner-dark"/><p>Updating booking #{busyBookingId}…</p></div></div>}
    </div>
  );
}
