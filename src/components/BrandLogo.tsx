interface BrandLogoProps {
  className?: string;
  size?: number;
}

export const BrandLogo = ({ className = '', size = 32 }: BrandLogoProps) => {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Zip2Git logo"
    >
      <defs>
        <linearGradient id="z2g-amber" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(35, 95%, 60%)" />
          <stop offset="100%" stopColor="hsl(28, 95%, 50%)" />
        </linearGradient>
        <linearGradient id="z2g-dark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(220, 15%, 18%)" />
          <stop offset="100%" stopColor="hsl(220, 18%, 10%)" />
        </linearGradient>
      </defs>

      {/* Hexagon outer frame — split: left amber, right dark */}
      <path
        d="M32 4 L56 18 L56 46 L32 60 L8 46 L8 18 Z"
        fill="url(#z2g-amber)"
        stroke="hsl(220, 18%, 10%)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Right half — dark side */}
      <path
        d="M32 4 L56 18 L56 46 L32 60 Z"
        fill="url(#z2g-dark)"
        stroke="hsl(220, 18%, 10%)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* LEFT side — Z letter (amber background) */}
      <path
        d="M16 22 L26 22 L17.5 38 L26.5 38"
        stroke="hsl(220, 18%, 10%)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* RIGHT side — zip teeth + arrow (dark background) */}
      {/* zip teeth — interlocking V shapes */}
      <g stroke="hsl(35, 95%, 60%)" strokeWidth="1.5" strokeLinecap="round" fill="none">
        <line x1="38" y1="18" x2="42" y2="20" />
        <line x1="46" y1="18" x2="42" y2="20" />
        <line x1="38" y1="22" x2="42" y2="24" />
        <line x1="46" y1="22" x2="42" y2="24" />
        <line x1="38" y1="26" x2="42" y2="28" />
        <line x1="46" y1="26" x2="42" y2="28" />
      </g>

      {/* zip slider pull — small accent block */}
      <rect x="39" y="32" width="6" height="3" rx="1" fill="hsl(140, 70%, 55%)" />

      {/* Arrow pointing right — "to Git" */}
      <path
        d="M37 44 L48 44 M44 40 L48 44 L44 48"
        stroke="hsl(35, 95%, 60%)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};
