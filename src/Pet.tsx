import type { Learner } from './learners';
import { rewards } from './learners';
import styles from './Pet.module.css';
import { PetAccessories, PetBackdrop } from './PetAccessories';

// Original vector companions: accessories share the same coordinates at every
// size, so the preview and the equipped friend always wear the same outfit.
export function Pet({
  learner,
  small = false,
}: {
  learner: Pick<Learner, 'pet' | 'charm'>;
  small?: boolean;
}) {
  const pet = rewards.find((item) => item.id === learner.pet);
  const charm = rewards.find((item) => item.id === learner.charm);
  const cat = learner.pet === 'cat';
  const bunny = learner.pet === 'rabbit';
  const dog = learner.pet === 'dog';
  const bird = learner.pet === 'bird';
  const frog = learner.pet === 'frog';
  const panda = learner.pet === 'panda';
  const dragon = learner.pet === 'dragon';
  const fur = bird
    ? '#82bdd0'
    : frog
      ? '#8fbd73'
      : panda
        ? '#f3eee2'
        : dragon
          ? '#b4a1d2'
          : cat
            ? '#dba86f'
            : bunny
              ? '#e5ddd1'
              : dog
                ? '#bd926f'
                : '#dd8750';
  return (
    <span
      className={`${styles['pet']} ${small ? styles['small'] : ''}`}
      role="img"
      aria-label={`${pet?.name ?? 'Fox friend'}${charm ? ` with ${charm.name.toLowerCase()}` : ''}`}
    >
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <ellipse
          cx="100"
          cy="182"
          rx="60"
          ry="8"
          fill="#38594a"
          opacity=".12"
        />
        <PetBackdrop charm={learner.charm} />
        {dragon && (
          <g
            fill="#8d7cb6"
            stroke="#655486"
            strokeWidth="3"
            strokeLinejoin="round"
          >
            <path d="M65 143 L22 99 L23 141 L40 135 L43 160 Z" />
            <path d="M135 143 L178 99 L177 141 L160 135 L157 160 Z" />
          </g>
        )}
        {!bunny && !bird && !frog && !panda && (
          <path
            d="M137 143 Q194 113 179 163 Q173 188 135 176"
            fill={fur}
            stroke="#704c38"
            strokeWidth="3"
          />
        )}
        <ellipse
          cx="100"
          cy="145"
          rx="43"
          ry="38"
          fill={fur}
          stroke="#704c38"
          strokeWidth="3"
        />
        <ellipse cx="100" cy="150" rx="26" ry="27" fill="#fff2dd" />
        <ellipse
          cx="72"
          cy="178"
          rx="20"
          ry="10"
          fill={fur}
          stroke="#704c38"
          strokeWidth="3"
        />
        <ellipse
          cx="128"
          cy="178"
          rx="20"
          ry="10"
          fill={fur}
          stroke="#704c38"
          strokeWidth="3"
        />
        {bird && (
          <g fill="#599bb8" stroke="#3e7e99" strokeWidth="2">
            <path d="M63 130 Q37 141 61 165 Q79 160 75 141" />
            <path d="M137 130 Q163 141 139 165 Q121 160 125 141" />
            <path d="M91 58 Q73 27 95 37 L103 53 Q105 29 117 40 L110 59" />
          </g>
        )}
        {panda ? (
          <g fill="#4c4f52" stroke="#393d40" strokeWidth="3">
            <circle cx="59" cy="61" r="20" />
            <circle cx="141" cy="61" r="20" />
            <ellipse cx="72" cy="178" rx="20" ry="10" />
            <ellipse cx="128" cy="178" rx="20" ry="10" />
          </g>
        ) : frog ? (
          <g fill={fur} stroke="#648550" strokeWidth="3">
            <circle cx="77" cy="84" r="22" />
            <circle cx="123" cy="84" r="22" />
          </g>
        ) : dragon ? (
          <g fill="#f0d68d" stroke="#9c8152" strokeWidth="2">
            <path d="M66 70 Q52 51 63 29 Q67 49 83 57 Z M134 70 Q148 51 137 29 Q133 49 117 57 Z" />
          </g>
        ) : bird ? null : bunny ? (
          <>
            <ellipse
              cx="75"
              cy="46"
              rx="16"
              ry="38"
              fill={fur}
              stroke="#704c38"
              strokeWidth="3"
              transform="rotate(-12 75 46)"
            />
            <ellipse
              cx="125"
              cy="46"
              rx="16"
              ry="38"
              fill={fur}
              stroke="#704c38"
              strokeWidth="3"
              transform="rotate(12 125 46)"
            />
            <ellipse
              cx="75"
              cy="44"
              rx="7"
              ry="27"
              fill="#eeb8b6"
              transform="rotate(-12 75 44)"
            />
            <ellipse
              cx="125"
              cy="44"
              rx="7"
              ry="27"
              fill="#eeb8b6"
              transform="rotate(12 125 44)"
            />
          </>
        ) : dog ? (
          <>
            <ellipse
              cx="57"
              cy="90"
              rx="18"
              ry="35"
              fill="#805c46"
              transform="rotate(12 57 90)"
            />
            <ellipse
              cx="143"
              cy="90"
              rx="18"
              ry="35"
              fill="#805c46"
              transform="rotate(-12 143 90)"
            />
          </>
        ) : (
          <>
            <path
              d="M53 85 L48 32 Q70 37 86 65 M114 65 Q130 37 152 32 L147 85"
              fill={fur}
              stroke="#704c38"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path
              d="M59 68 L57 46 L76 62 M124 62 L143 46 L141 68"
              fill="#f2c3b6"
            />
          </>
        )}
        <path
          d={
            frog
              ? 'M100 79 C56 65 30 91 45 118 Q100 157 155 118 C170 91 144 65 100 79'
              : 'M100 55 C39 55 39 126 72 136 Q100 149 128 136 C161 126 161 55 100 55'
          }
          fill={fur}
          stroke="#704c38"
          strokeWidth="3"
        />
        {!cat && !panda && !frog && !bird && !dragon && (
          <path
            d="M53 92 Q74 96 100 122 Q125 96 147 92 C146 151 54 151 53 92"
            fill="#fff2dd"
          />
        )}
        {cat && (
          <path
            d="M90 58 L96 78 M103 57 L103 78 M115 59 L110 78"
            stroke="#a66d48"
            strokeWidth="5"
            strokeLinecap="round"
          />
        )}
        {panda && (
          <g fill="#4c4f52">
            <ellipse
              cx="77"
              cy="97"
              rx="13"
              ry="17"
              transform="rotate(20 77 97)"
            />
            <ellipse
              cx="123"
              cy="97"
              rx="13"
              ry="17"
              transform="rotate(-20 123 97)"
            />
          </g>
        )}
        <g className={styles['eyes']} fill={panda ? '#fff6df' : '#3d3c38'}>
          <ellipse cx="77" cy={frog ? 87 : 97} rx="4.5" ry="6" />
          <ellipse cx="123" cy={frog ? 87 : 97} rx="4.5" ry="6" />
        </g>
        <ellipse cx="65" cy="111" rx="9" ry="5" fill="#eaa09b" opacity=".65" />
        <ellipse cx="135" cy="111" rx="9" ry="5" fill="#eaa09b" opacity=".65" />
        {bird ? (
          <path
            d="M89 109 L100 103 L111 109 L100 120 Z"
            fill="#edbf58"
            stroke="#ab7d32"
            strokeWidth="2"
          />
        ) : frog ? (
          <g fill="#648550">
            <circle cx="94" cy="108" r="2" />
            <circle cx="106" cy="108" r="2" />
          </g>
        ) : (
          <path d="M94 110 Q100 107 106 110 L100 116 Z" fill="#59463e" />
        )}
        <path
          d={
            frog
              ? 'M76 115 Q100 136 124 115'
              : 'M100 116 Q92 125 86 119 M100 116 Q108 125 114 119'
          }
          fill="none"
          stroke="#59463e"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {cat && (
          <path
            d="M67 116 L43 111 M67 121 L42 125 M133 116 L157 111 M133 121 L158 125"
            stroke="#704c38"
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}
        {learner.charm === 'bow' && (
          <g fill="#db6995" stroke="#a9426c" strokeWidth="2">
            <path d="M129 56 Q100 28 106 66 L129 63 Q154 86 155 49 Z" />
            <circle cx="130" cy="61" r="7" fill="#f6aac8" />
          </g>
        )}
        {learner.charm === 'star' && (
          <>
            <path
              d="M70 132 Q100 152 130 132"
              stroke="#bf9449"
              strokeWidth="3"
              fill="none"
            />
            <path
              d="M100 140 L105 151 L117 152 L108 160 L110 172 L100 166 L90 172 L92 160 L83 152 L95 151 Z"
              fill="#f3c85e"
              stroke="#b88b34"
              strokeWidth="2"
            />
          </>
        )}
        {learner.charm === 'scarf' && (
          <g fill="#62a9a3" stroke="#377e79" strokeWidth="2">
            <path d="M65 132 Q100 144 135 132 L132 145 Q100 158 68 145 Z" />
            <path d="M113 145 L128 145 L137 174 L119 178 Z" />
            <path d="M121 170 L134 167" stroke="#f8eacb" strokeWidth="4" />
          </g>
        )}
        {learner.charm === 'crown' && (
          <path
            d="M72 59 L65 28 L87 40 L100 20 L113 40 L135 28 L128 59 Z"
            fill="#f3c85e"
            stroke="#b88b34"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        )}
        {learner.charm === 'flower' && (
          <g
            transform="translate(129 58)"
            fill="#fff7d7"
            stroke="#d7b95e"
            strokeWidth="1.5"
          >
            <ellipse cy="-12" rx="7" ry="12" />
            <ellipse cy="12" rx="7" ry="12" />
            <ellipse cx="-12" rx="12" ry="7" />
            <ellipse cx="12" rx="12" ry="7" />
            <circle r="8" fill="#e8b846" />
          </g>
        )}
        <g
          transform={
            frog && learner.charm === 'sunglasses'
              ? 'translate(0 -10)'
              : undefined
          }
        >
          <PetAccessories charm={learner.charm} />
        </g>
      </svg>
    </span>
  );
}
