export function ToolkitArt() {
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
        <linearGradient id="inv-toolkit-bg" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#303f83" />
          <stop offset="1" stopColor="#120c34" />
        </linearGradient>
        <linearGradient id="inv-toolkit-screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6c2c68" />
          <stop offset="1" stopColor="#3b4da1" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#inv-toolkit-bg)" />
      <g transform="rotate(-8 110 158)">
        <rect x="30" y="88" width="96" height="140" rx="8" fill="#3b4da1" fillOpacity=".9" />
      </g>
      <g transform="rotate(-2 110 158)">
        <rect x="62" y="88" width="96" height="140" rx="8" fill="#303f83" fillOpacity=".9" />
      </g>
      <g transform="rotate(5 110 158)">
        <rect x="94" y="88" width="96" height="140" rx="8" fill="#211a3e" fillOpacity=".95" />
        <rect x="110" y="112" width="64" height="10" rx="5" fill="#d28ebe" fillOpacity=".85" />
        <rect x="110" y="134" width="56" height="6" rx="3" fill="#f8f7fb" fillOpacity=".4" />
        <rect x="110" y="150" width="40" height="6" rx="3" fill="#f8f7fb" fillOpacity=".28" />
      </g>
      <g stroke="#aad9dc" strokeOpacity=".5" strokeWidth="1.5" strokeDasharray="6 7">
        <line x1="198" y1="124" x2="252" y2="106" />
        <line x1="198" y1="188" x2="252" y2="206" />
      </g>
      <rect
        x="262"
        y="66"
        width="92"
        height="170"
        rx="16"
        fill="#120c34"
        stroke="#f8f7fb"
        strokeOpacity=".55"
        strokeWidth="2"
      />
      <rect x="272" y="80" width="72" height="142" rx="9" fill="url(#inv-toolkit-screen)" />
      <path
        d="M274 168c18-22 32 14 50-8s14 6 20-2"
        fill="none"
        stroke="#f8f7fb"
        strokeOpacity=".72"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="308" cy="73" r="2.5" fill="#f8f7fb" fillOpacity=".55" />
    </svg>
  );
}
