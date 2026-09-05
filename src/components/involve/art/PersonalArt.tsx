export function PersonalArt() {
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
        <linearGradient id="inv-personal-bg" x1="0" y1="0" x2="0.68" y2="1">
          <stop offset="0" stopColor="#2b1436" />
          <stop offset="1" stopColor="#120c34" />
        </linearGradient>
        <radialGradient id="inv-personal-halo">
          <stop offset="0" stopColor="#9e439a" stopOpacity=".34" />
          <stop offset="1" stopColor="#9e439a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="inv-personal-beam" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#d28ebe" stopOpacity=".5" />
          <stop offset="1" stopColor="#d28ebe" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#inv-personal-bg)" />
      <circle cx="262" cy="146" r="142" fill="url(#inv-personal-halo)" />
      <path d="M262 128 332 14 192 14Z" fill="url(#inv-personal-beam)" />
      <rect x="248" y="150" width="28" height="110" rx="6" fill="#f8f7fb" opacity=".9" />
      <ellipse cx="262" cy="138" rx="7" ry="12" fill="#d28ebe" />
      <g stroke="#f8f7fb" strokeOpacity=".7" strokeWidth="2" strokeLinejoin="round">
        <path d="M112 226C96 214 72 210 48 213v46c24-3 48 1 64 13Z" fill="#f8f7fb" fillOpacity=".06" />
        <path d="M112 226c16-12 40-16 64-13v46c-24-3-48 1-64 13Z" fill="#f8f7fb" fillOpacity=".06" />
      </g>
      <g stroke="#f8f7fb" strokeOpacity=".45" strokeWidth="2" strokeLinecap="round">
        <line x1="62" y1="228" x2="98" y2="232" />
        <line x1="62" y1="242" x2="98" y2="246" />
        <line x1="126" y1="232" x2="162" y2="228" />
      </g>
      <g fill="#d28ebe">
        <circle cx="238" cy="112" r="2.5" opacity=".8" />
        <circle cx="288" cy="126" r="1.5" opacity=".6" />
        <circle cx="272" cy="94" r="2" opacity=".7" />
      </g>
    </svg>
  );
}
