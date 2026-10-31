export default function Brand({ light = false, compact = false }) {
  return (
    <div className={`brand ${light ? 'brand-light' : ''} ${compact ? 'brand-compact' : ''}`}>
      <div className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none">
          <rect x="1" y="1" width="38" height="38" rx="12" fill="currentColor" opacity=".14" />
          <path d="M12 9h16a3 3 0 0 1 3 3v13a5 5 0 0 1-5 5H14a5 5 0 0 1-5-5V12a3 3 0 0 1 3-3Z" stroke="currentColor" strokeWidth="2" />
          <path d="M12 16h16M14 30l-3 4m15-4 3 4M15 22h.01M25 22h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </div>
      <div className="brand-copy">
        <strong>RAILWAY<span>+</span></strong>
        {!compact && <small>JOURNEY INTELLIGENCE</small>}
      </div>
    </div>
  );
}
