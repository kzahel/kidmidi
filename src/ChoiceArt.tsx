import type { Lesson } from './curriculum';

export function WardrobeArt() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <rect
        x="14"
        y="7"
        width="72"
        height="82"
        rx="9"
        fill="#d6ae84"
        stroke="#86674e"
        strokeWidth="4"
      />
      <path d="M50 10 V86" stroke="#86674e" strokeWidth="3" />
      <circle cx="42" cy="50" r="3" fill="#fff0ba" />
      <circle cx="58" cy="50" r="3" fill="#fff0ba" />
      <path d="M28 90 V96 M72 90 V96" stroke="#86674e" strokeWidth="5" />
      <path d="M22 31 Q32 13 42 31 L37 33 L37 46 H27 V33Z" fill="#d7e7b4" />
      <path d="M62 31 L67 17 L73 31 L79 35 H56Z" fill="#8b83b7" />
    </svg>
  );
}

export function ActivityArt({ kind }: { kind: string }) {
  if (kind === 'twinkle')
    return (
      <svg viewBox="0 0 160 100" aria-hidden="true">
        <path
          d="M80 9 L94 35 L125 39 L103 61 L109 91 L80 76 L51 91 L57 61 L35 39 L66 35Z"
          fill="#edc65e"
          stroke="#bb923d"
          strokeWidth="3"
        />
        <circle cx="70" cy="51" r="3" fill="#67583c" />
        <circle cx="90" cy="51" r="3" fill="#67583c" />
        <path
          d="M72 62 Q80 70 88 62"
          stroke="#67583c"
          strokeWidth="2"
          fill="none"
        />
      </svg>
    );
  if (kind === 'buns')
    return (
      <svg viewBox="0 0 160 100" aria-hidden="true">
        {[36, 80, 124].map((x, i) => (
          <g key={x}>
            <ellipse
              cx={x}
              cy={i === 1 ? 60 : 53}
              rx="25"
              ry="23"
              fill="#dfac6c"
              stroke="#ae7b43"
              strokeWidth="2"
            />
            <path
              d={`M${x} ${i === 1 ? 40 : 33} V${i === 1 ? 80 : 73} M${x - 20} ${i === 1 ? 60 : 53} H${x + 20}`}
              stroke="#fff0c5"
              strokeWidth="5"
            />
          </g>
        ))}
      </svg>
    );
  if (kind === 'rain')
    return (
      <svg viewBox="0 0 160 100" aria-hidden="true">
        <path
          d="M30 51 Q15 25 46 24 Q55 -1 80 17 Q111 3 118 27 Q146 29 131 51Z"
          fill="#a7bdcf"
        />
        {[40, 65, 90, 115].map((x) => (
          <path
            key={x}
            d={`M${x} 58 Q${x - 14} 80 ${x} 82 Q${x + 14} 80 ${x} 58Z`}
            fill="#79b4d1"
          />
        ))}
      </svg>
    );
  if (kind === 'hunt')
    return (
      <svg viewBox="0 0 160 100" aria-hidden="true">
        <path
          d="M24 24 H125 M24 36 H125 M24 48 H125 M24 60 H125 M24 72 H125"
          stroke="#b8c3b0"
          strokeWidth="2"
        />
        <ellipse cx="69" cy="61" rx="10" ry="7" fill="#62825c" />
        <path d="M78 61 V22" stroke="#62825c" strokeWidth="3" />
        <circle
          cx="100"
          cy="45"
          r="23"
          fill="#fffc"
          stroke="#a57e56"
          strokeWidth="5"
        />
        <path
          d="M117 64 L137 85"
          stroke="#a57e56"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </svg>
    );
  return (
    <svg viewBox="0 0 160 100" aria-hidden="true">
      <rect
        x="15"
        y="42"
        width="130"
        height="46"
        rx="6"
        fill="#fdfbf0"
        stroke="#7c8b85"
        strokeWidth="3"
      />
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <path
          key={n}
          d={`M${15 + n * 18.5} 43 V87`}
          stroke="#7c8b85"
          strokeWidth="2"
        />
      ))}
      {[34, 53, 90, 109, 128].map((x) => (
        <rect
          key={x}
          x={x - 5}
          y="43"
          width="10"
          height="26"
          rx="2"
          fill="#52625d"
        />
      ))}
      <path
        d="M45 28 Q35 9 45 8 Q54 9 45 28 M80 25 V5 M117 28 L128 12"
        fill="none"
        stroke="#ba8197"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LessonArt({ lesson }: { lesson: Lesson }) {
  const pitches = lesson.patterns?.[0] ?? lesson.notes;
  const y = (pitch: number) => 53 - (pitch - 60) * 3;
  const x = (i: number) => 12 + (i * 136) / Math.max(1, pitches.length - 1);
  return (
    <svg viewBox="0 0 160 65" aria-hidden="true" data-lesson-art={lesson.id}>
      {[17, 27, 37, 47, 57].map((line) => (
        <path
          key={line}
          d={`M5 ${line} H155`}
          stroke="#d3ddc6"
          strokeWidth="1.5"
        />
      ))}
      {lesson.patterns && (
        <polyline
          points={pitches.map((p, i) => `${x(i)},${y(p)}`).join(' ')}
          fill="none"
          stroke="#a0b68a"
          strokeWidth="3"
        />
      )}
      {pitches.map((p, i) => (
        <g key={`${i}-${p}`}>
          <ellipse cx={x(i)} cy={y(p)} rx="6" ry="4.5" fill="#52744f" />
          <path
            d={`M${x(i) + 5} ${y(p)} v-16`}
            stroke="#52744f"
            strokeWidth="2"
          />
        </g>
      ))}
    </svg>
  );
}
