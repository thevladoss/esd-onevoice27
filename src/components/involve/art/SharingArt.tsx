export function SharingArt() {
  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      role="presentation"
      focusable="false"
      className="inv-art"
    >
      <defs>
        <linearGradient id="inv-sharing-bg" x1="0" y1="0" x2="0.75" y2="1">
          <stop offset="0" stopColor="#1b3a44" />
          <stop offset="1" stopColor="#120c34" />
        </linearGradient>
        <radialGradient id="inv-sharing-halo">
          <stop offset="0" stopColor="#7bc2c7" stopOpacity=".35" />
          <stop offset="1" stopColor="#7bc2c7" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill="url(#inv-sharing-bg)" />
      <g fill="none" stroke="#7bc2c7" strokeWidth="2">
        <path d="M70 190A60 60 0 0 1 130 250" opacity=".6" />
        <path d="M70 140A110 110 0 0 1 180 250" opacity=".42" />
        <path d="M70 90A160 160 0 0 1 230 250" opacity=".28" />
        <path d="M70 40A210 210 0 0 1 280 250" opacity=".16" />
      </g>
      <circle cx="218" cy="102" r="36" fill="url(#inv-sharing-halo)" />
      <circle cx="220" cy="195" r="30" fill="url(#inv-sharing-halo)" />
      <g stroke="#aad9dc" strokeOpacity=".5" strokeWidth="1.5">
        <line x1="70" y1="250" x2="112" y2="208" />
        <line x1="112" y1="208" x2="148" y2="172" />
        <line x1="148" y1="172" x2="183" y2="137" />
        <line x1="183" y1="137" x2="218" y2="102" />
        <line x1="148" y1="172" x2="220" y2="195" />
      </g>
      <g fill="#7bc2c7">
        <circle cx="112" cy="208" r="4" />
        <circle cx="148" cy="172" r="5" />
        <circle cx="183" cy="137" r="5" fill="#aad9dc" />
        <circle cx="218" cy="102" r="6" fill="#aad9dc" />
        <circle cx="220" cy="195" r="4" />
      </g>
      <circle cx="70" cy="250" r="7" fill="#7bc2c7" />
    </svg>
  );
}
