import React from 'react';

/**
 * Small loading spinner (replaces @carbon/react InlineLoading / Loading).
 */
const Spinner = ({ size = 18, label, className = '' }) => (
  <span className={`spinner ${className}`} role="status" aria-live="polite">
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="spinner-svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
    {label && <span className="spinner-label">{label}</span>}
  </span>
);

export default Spinner;
