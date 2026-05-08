/**
 * Rotate-to-landscape prompt — full-screen overlay on mobile portrait.
 * Render outside any rotated viewport so it stays right-side-up.
 */
export function DesertRotateHint({ onDismiss }) {
  return (
    <div
      className="desert-rotate-hint"
      role="status"
      aria-live="polite"
      onClick={onDismiss}
    >
      <div className="desert-rotate-hint__inner">
        <svg
          className="desert-rotate-hint__svg"
          viewBox="0 0 240 240"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle
            className="drh-circle"
            cx="120"
            cy="120"
            r="88"
            stroke="white"
            strokeOpacity="0.28"
            strokeWidth="0.75"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1}
          />
          <circle cx="120" cy="32" r="2" fill="white" fillOpacity="0.55" className="drh-accent" />
          <circle cx="120" cy="208" r="2" fill="white" fillOpacity="0.55" className="drh-accent" />
          <line
            x1="28"
            y1="120"
            x2="40"
            y2="120"
            stroke="white"
            strokeOpacity="0.55"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="drh-accent"
          />
          <line
            x1="200"
            y1="120"
            x2="212"
            y2="120"
            stroke="white"
            strokeOpacity="0.55"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="drh-accent"
          />

          <g className="drh-portrait">
            <rect
              x="59"
              y="78"
              width="40"
              height="62"
              rx="6.5"
              stroke="white"
              strokeWidth="1.5"
              strokeOpacity="0.9"
            />
            <rect x="70" y="84" width="16" height="2.5" rx="1.25" fill="white" fillOpacity="0.75" />
            <rect x="74" y="132" width="8" height="2.5" rx="1.25" fill="white" fillOpacity="0.75" />
          </g>

          <path
            className="drh-arrow"
            d="M 82 78 C 112 42 165 88 152 113"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeOpacity="0.9"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1}
          />
          <path
            className="drh-arrowhead"
            d="M 146 107 L 153 113 L 159 107"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.9"
          />

          <g className="drh-landscape">
            <rect
              x="128"
              y="110"
              width="60"
              height="38"
              rx="6.5"
              stroke="white"
              strokeWidth="1.5"
              strokeOpacity="0.9"
            />
            <rect x="134" y="122" width="2.5" height="14" rx="1.25" fill="white" fillOpacity="0.75" />
            <rect x="183" y="126" width="2.5" height="8" rx="1.25" fill="white" fillOpacity="0.75" />
          </g>
        </svg>
        <p className="desert-rotate-hint__label">Rotate to landscape for best experience</p>
        <p className="desert-rotate-hint__sub">Tap to continue in portrait</p>
      </div>
    </div>
  )
}
