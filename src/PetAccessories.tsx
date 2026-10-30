// Original vector dress-up pieces, aligned to the shared companion coordinates.
export function PetBackdrop({ charm }: { charm: string | null }) {
  if (charm === 'wings')
    return (
      <g fill="#e8a3cd" stroke="#a55b91" strokeWidth="3">
        <path d="M84 141 C8 57 3 142 49 151 C13 191 63 193 89 159 Z" />
        <path d="M116 141 C192 57 197 142 151 151 C187 191 137 193 111 159 Z" />
        <path d="M29 123 L76 146 M171 123 L124 146" stroke="#fff0d7" />
        <circle cx="42" cy="129" r="7" fill="#fff0d7" />
        <circle cx="158" cy="129" r="7" fill="#fff0d7" />
      </g>
    );
  if (charm === 'cape')
    return (
      <g fill="#59649f" stroke="#3e4479" strokeWidth="3">
        <path d="M68 128 Q100 118 132 128 L158 182 Q100 195 42 182 Z" />
        <path
          d="M54 163 L57 169 L64 170 L59 175 L60 181 L54 178 L48 181 L49 175 L44 170 L51 169 Z M146 153 L149 159 L156 160 L151 165 L152 171 L146 168 L140 171 L141 165 L136 160 L143 159 Z"
          fill="#f7da86"
          stroke="none"
        />
      </g>
    );
  return null;
}

export function PetAccessories({ charm }: { charm: string | null }) {
  switch (charm) {
    case 'bow':
      return (
        <g fill="#db6995" stroke="#a9426c" strokeWidth="2">
          <path d="M129 56 Q100 28 106 66 L129 63 Q154 86 155 49 Z" />
          <circle cx="130" cy="61" r="7" fill="#f6aac8" />
        </g>
      );
    case 'star':
      return (
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
      );
    case 'scarf':
      return (
        <g fill="#62a9a3" stroke="#377e79" strokeWidth="2">
          <path d="M65 132 Q100 144 135 132 L132 145 Q100 158 68 145 Z" />
          <path d="M113 145 L128 145 L137 174 L119 178 Z" />
          <path d="M121 170 L134 167" stroke="#f8eacb" strokeWidth="4" />
        </g>
      );
    case 'crown':
      return (
        <path
          d="M72 59 L65 28 L87 40 L100 20 L113 40 L135 28 L128 59 Z"
          fill="#f3c85e"
          stroke="#b88b34"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      );
    case 'flower':
      return (
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
      );

    case 'sunglasses':
      return (
        <g fill="#41576b" stroke="#243c52" strokeWidth="3">
          <path d="M54 88 H93 L89 106 Q73 117 59 104 Z M107 88 H146 L141 104 Q127 117 111 106 Z" />
          <path
            d="M93 93 Q100 89 107 93 M54 91 L46 87 M146 91 L154 87"
            fill="none"
          />
          <path
            d="M63 93 L75 93 M116 93 L128 93"
            stroke="#9bd4df"
            strokeLinecap="round"
          />
        </g>
      );
    case 'earrings':
      return (
        <g stroke="#5f8e55" strokeWidth="2" fill="none">
          <path d="M53 106 Q46 114 43 126 M53 106 Q57 115 57 125 M147 106 Q154 114 157 126 M147 106 Q143 115 143 125" />
          <g fill="#df6d79" stroke="#ad4658">
            <circle cx="43" cy="128" r="6" />
            <circle cx="57" cy="127" r="6" />
            <circle cx="157" cy="128" r="6" />
            <circle cx="143" cy="127" r="6" />
          </g>
          <path
            d="M53 107 Q39 100 40 111 Q49 114 53 107 M147 107 Q161 100 160 111 Q151 114 147 107"
            fill="#85ac68"
          />
        </g>
      );
    case 'bucket-hat':
      return (
        <g
          fill="#efcc66"
          stroke="#a57c38"
          strokeWidth="3"
          strokeLinejoin="round"
        >
          <path d="M69 34 Q100 22 131 34 L140 63 H60 Z" />
          <path d="M60 59 L45 76 Q100 89 155 76 L140 59 Z" />
          <path
            d="M64 56 Q100 65 136 56"
            fill="none"
            stroke="#fff0bc"
            strokeWidth="6"
          />
        </g>
      );
    case 'bow-tie':
      return (
        <g stroke="#7c6099" strokeWidth="2">
          <path d="M99 142 Q65 120 72 155 L100 149 Z" fill="#e590a8" />
          <path d="M101 142 Q135 120 128 155 L100 149 Z" fill="#80c1b0" />
          <circle cx="100" cy="145" r="7" fill="#f0cd6e" />
        </g>
      );
    case 'headphones':
      return (
        <g fill="#ae92cf" stroke="#745599" strokeWidth="3">
          <path d="M48 95 C36 25 164 25 152 95" fill="none" strokeWidth="9" />
          <rect x="40" y="84" width="17" height="34" rx="8" />
          <rect x="143" y="84" width="17" height="34" rx="8" />
          <path
            d="M47 92 V108 M153 92 V108"
            stroke="#e4d2f5"
            strokeLinecap="round"
          />
        </g>
      );
    case 'raincoat':
      return (
        <g fill="#edca60" stroke="#a78337" strokeWidth="2">
          <path d="M66 132 L54 163 L66 170 L72 155 L70 180 H130 L128 155 L134 170 L146 163 L134 132 Q100 146 66 132 Z" />
          <path
            d="M100 143 V180 M68 132 L88 157 L100 143 L112 157 L132 132"
            fill="none"
          />
          <circle cx="105" cy="160" r="2" fill="#fff1bf" />
          <circle cx="105" cy="173" r="2" fill="#fff1bf" />
        </g>
      );
    case 'satchel':
      return (
        <g stroke="#8b593c" strokeWidth="3">
          <path d="M68 129 L127 173" stroke="#c78b56" strokeWidth="8" />
          <rect x="103" y="149" width="40" height="31" rx="7" fill="#c78b56" />
          <path d="M104 153 Q123 174 142 153" fill="#e3ac6d" />
          <rect
            x="120"
            y="160"
            width="7"
            height="8"
            rx="2"
            fill="#f6d57a"
            strokeWidth="1.5"
          />
        </g>
      );
    case 'wizard-hat':
      return (
        <g
          fill="#7772b8"
          stroke="#4f4b86"
          strokeWidth="3"
          strokeLinejoin="round"
        >
          <path d="M64 61 L105 9 Q107 35 136 61 Z" />
          <ellipse cx="100" cy="65" rx="49" ry="10" />
          <path
            d="M100 29 L102 35 L109 36 L104 40 L105 47 L100 43 L95 47 L96 40 L91 36 L98 35 Z"
            fill="#f4d780"
            stroke="none"
          />
        </g>
      );
    case 'moon':
      return (
        <g stroke="#bd984e" strokeWidth="2" fill="none">
          <path d="M70 132 Q100 155 130 132" />
          <path
            d="M107 148 A14 14 0 1 0 112 168 A12 12 0 0 1 107 148 Z"
            fill="#f6d783"
          />
        </g>
      );
    case 'cape':
      return (
        <path
          d="M70 132 Q100 153 130 132 M100 143 L94 153 M100 143 L106 153"
          fill="none"
          stroke="#f7da86"
          strokeWidth="4"
          strokeLinecap="round"
        />
      );
    case 'crystal-crown':
      return (
        <g stroke="#568da9" strokeWidth="2.5" strokeLinejoin="round">
          <path
            d="M69 60 L63 34 L85 43 L100 17 L115 43 L137 34 L131 60 Z"
            fill="#9edee7"
          />
          <path d="M100 27 L108 43 L100 54 L92 43 Z" fill="#f0fbff" />
          <path d="M73 65 H127" strokeWidth="5" />
        </g>
      );
    default:
      return null;
  }
}
