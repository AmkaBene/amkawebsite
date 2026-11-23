interface BubbleSpec {
  id: string;
  left: string;
  size: number;
  duration: number;
  delay: number;
  mobileVisible?: boolean;
}

interface StarSpec {
  id: string;
  top: string;
  left: string;
  size: number;
  rotate: number;
  duration: number;
  delay: number;
  mobileVisible?: boolean;
}

const AERO_BUBBLES: BubbleSpec[] = [
  {id: 'b1', left: '4%', size: 22, duration: 19, delay: -3, mobileVisible: true},
  {id: 'b2', left: '12%', size: 14, duration: 16, delay: -9},
  {id: 'b3', left: '21%', size: 28, duration: 24, delay: -14, mobileVisible: true},
  {id: 'b4', left: '34%', size: 16, duration: 18, delay: -6},
  {id: 'b5', left: '50%', size: 20, duration: 21, delay: -11},
  {id: 'b6', left: '66%', size: 15, duration: 17, delay: -4},
  {id: 'b7', left: '78%', size: 26, duration: 23, delay: -16, mobileVisible: true},
  {id: 'b8', left: '88%', size: 18, duration: 18, delay: -7},
  {id: 'b9', left: '94%', size: 22, duration: 20, delay: -12, mobileVisible: true},
];

const SILVER_STARS: StarSpec[] = [
  {id: 's1', top: '9%', left: '4%', size: 22, rotate: -10, duration: 5.2, delay: -0.6, mobileVisible: true},
  {id: 's2', top: '15%', left: '91%', size: 24, rotate: 14, duration: 5.8, delay: -1.8, mobileVisible: true},
  {id: 's3', top: '27%', left: '9%', size: 16, rotate: 18, duration: 4.6, delay: -2.4},
  {id: 's4', top: '34%', left: '85%', size: 18, rotate: -14, duration: 5.1, delay: -0.9},
  {id: 's5', top: '46%', left: '3%', size: 20, rotate: 8, duration: 6.0, delay: -3.1, mobileVisible: true},
  {id: 's6', top: '54%', left: '93%', size: 17, rotate: -16, duration: 4.8, delay: -1.4},
  {id: 's7', top: '67%', left: '8%', size: 18, rotate: 12, duration: 5.4, delay: -2.7},
  {id: 's8', top: '75%', left: '89%', size: 23, rotate: -8, duration: 5.7, delay: -0.3, mobileVisible: true},
  {id: 's9', top: '87%', left: '6%', size: 16, rotate: 20, duration: 4.9, delay: -1.9},
  {id: 's10', top: '90%', left: '91%', size: 19, rotate: -12, duration: 5.0, delay: -3.5, mobileVisible: true},
];

// Subtle 5-point Y2K silver star coordinates (center 50,50, R=45, r=19)
const STAR_TIPS: [number, number][] = [
  [50, 5],
  [92.8, 36.1],
  [76.45, 86.4],
  [23.55, 86.4],
  [7.2, 36.1],
];

const STAR_VALLEYS: [number, number][] = [
  [61.17, 34.63],
  [68.07, 55.87],
  [50, 69],
  [31.93, 55.87],
  [38.83, 34.63],
];

const STAR_OUTLINE_POINTS = STAR_TIPS.map((tip, i) => `${tip[0]},${tip[1]} ${STAR_VALLEYS[i][0]},${STAR_VALLEYS[i][1]}`).join(' ');

function SubtleFivePointStarSvg({size, gradId}: {size: number; gradId: string}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${gradId}-lit`} x1="12%" y1="8%" x2="85%" y2="85%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.92" />
          <stop offset="55%" stopColor="#E6EEF7" stopOpacity="0.82" />
          <stop offset="100%" stopColor="#CBD8E6" stopOpacity="0.72" />
        </linearGradient>
        <linearGradient id={`${gradId}-shade`} x1="15%" y1="10%" x2="90%" y2="95%">
          <stop offset="0%" stopColor="#DAE5F2" stopOpacity="0.82" />
          <stop offset="60%" stopColor="#B5C6D9" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#94A9C0" stopOpacity="0.68" />
        </linearGradient>
      </defs>

      {STAR_TIPS.map((tip, idx) => {
        const nextValley = STAR_VALLEYS[idx];
        const prevValley = STAR_VALLEYS[(idx + 4) % 5];
        return (
          <g key={idx}>
            <polygon
              points={`50,50 ${prevValley[0]},${prevValley[1]} ${tip[0]},${tip[1]}`}
              fill={`url(#${gradId}-lit)`}
            />
            <polygon
              points={`50,50 ${tip[0]},${tip[1]} ${nextValley[0]},${nextValley[1]}`}
              fill={`url(#${gradId}-shade)`}
            />
          </g>
        );
      })}

      <polygon
        points={STAR_OUTLINE_POINTS}
        fill="none"
        stroke="#94A3B8"
        strokeOpacity="0.38"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AeroAtmosphere() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Subtle 5-Point Silver Stars */}
      {SILVER_STARS.map((star) => (
        <div
          key={star.id}
          className={`aero-silver-star absolute ${star.mobileVisible ? 'block' : 'hidden sm:block'}`}
          style={{
            top: star.top,
            left: star.left,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
          }}
        >
          <div style={{transform: `rotate(${star.rotate}deg)`}}>
            <SubtleFivePointStarSvg size={star.size} gradId={`silver-star-${star.id}`} />
          </div>
        </div>
      ))}

      {/* Rising Glossy Frutiger Aero Bubbles */}
      {AERO_BUBBLES.map((bubble) => (
        <div
          key={bubble.id}
          className={`aero-floating-bubble absolute -bottom-12 ${
            bubble.mobileVisible ? 'block' : 'hidden sm:block'
          }`}
          style={{
            left: bubble.left,
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            animationDuration: `${bubble.duration}s`,
            animationDelay: `${bubble.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
