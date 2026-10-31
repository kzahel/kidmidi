// Original vector dress-up pieces, aligned to the shared companion coordinates.
export function PetBackdrop({ charm }: { charm: string | null }) {
  if (charm === 'bat-wings')
    return (
      <g fill="#544066" stroke="#35293f" strokeWidth="3" strokeLinejoin="round">
        <path d="M86 142 Q57 101 13 99 L20 151 Q34 133 45 159 Q58 144 68 173 L89 161 Z" />
        <path d="M114 142 Q143 101 187 99 L180 151 Q166 133 155 159 Q142 144 132 173 L111 161 Z" />
        <path
          d="M17 104 L84 151 M17 104 Q43 120 45 155 M183 104 L116 151 M183 104 Q157 120 155 155"
          fill="none"
          stroke="#a18ab2"
          strokeWidth="2"
        />
      </g>
    );
  if (charm === 'vampire-cape')
    return (
      <g stroke="#41283d" strokeWidth="3" strokeLinejoin="round">
        <path
          d="M71 129 L48 110 L58 147 L39 183 Q100 195 161 183 L142 147 L152 110 L129 129 Z"
          fill="#492d50"
        />
        <path d="M71 136 L51 180 Q100 189 149 180 L129 136 Z" fill="#a04460" />
        <path
          d="M72 149 L65 179 M128 149 L135 179"
          stroke="#cb7185"
          fill="none"
        />
      </g>
    );
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
    case 'witch-hat':
      return (
        <g stroke="#362744" strokeWidth="3" strokeLinejoin="round">
          <path
            d="M64 61 L87 29 Q93 5 123 12 L110 27 L137 61 Z"
            fill="#655087"
          />
          <path d="M70 49 Q100 58 129 49 L137 63 H64 Z" fill="#8fa65f" />
          <path
            d="M51 63 Q95 74 143 58 L157 73 Q105 91 43 76 Z"
            fill="#554070"
          />
          <rect
            x="95"
            y="52"
            width="15"
            height="12"
            rx="2"
            fill="#efbc60"
            strokeWidth="2"
          />
          <path d="M102 55 V61" stroke="#655087" />
        </g>
      );
    case 'pumpkin-suit':
      return (
        <g stroke="#b75b2b" strokeWidth="2.5" strokeLinejoin="round">
          <path
            d="M70 132 Q100 143 130 132 Q154 149 139 175 Q100 195 61 175 Q46 149 70 132 Z"
            fill="#ed923c"
          />
          <path
            d="M84 140 Q70 158 83 181 M116 140 Q130 158 117 181"
            fill="none"
            stroke="#d5732b"
          />
          <path
            d="M68 132 L80 127 L91 138 L100 131 L109 138 L120 127 L132 132 L122 145 L109 140 L100 146 L91 140 L78 145 Z"
            fill="#739755"
            stroke="#4e733c"
          />
          <path
            d="M75 156 L86 147 L90 158 Z M110 158 L114 147 L125 156 Z M78 165 Q100 183 122 165 L115 167 L113 172 L104 173 L103 168 L96 168 L95 173 L87 170 L85 166 Z"
            fill="#634132"
            stroke="none"
          />
        </g>
      );
    case 'ghost-charm':
      return (
        <g stroke="#897c9c" strokeWidth="2" strokeLinejoin="round">
          <path
            d="M70 132 Q100 153 130 132"
            fill="none"
            stroke="#9d87b6"
            strokeWidth="3"
          />
          <path
            d="M88 160 Q87 146 100 146 Q113 146 112 160 L116 175 L108 171 L104 176 L99 171 L94 176 L85 173 Z"
            fill="#fff9ec"
          />
          <g fill="#51415e" stroke="none">
            <ellipse cx="96" cy="157" rx="2" ry="3" />
            <ellipse cx="105" cy="157" rx="2" ry="3" />
          </g>
          <path
            d="M97 164 Q100 168 104 164"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      );
    case 'pumpkin-pail':
      return (
        <g stroke="#a95c30" strokeWidth="2.5" strokeLinejoin="round">
          <path
            d="M124 154 C114 124 155 124 146 154"
            fill="none"
            stroke="#65506d"
            strokeWidth="4"
          />
          <path
            d="M116 152 Q135 143 154 152 L151 177 Q135 188 119 177 Z"
            fill="#f0a047"
          />
          <path
            d="M126 154 Q121 167 126 180 M143 154 Q149 167 143 180"
            fill="none"
            stroke="#d78032"
          />
          <path
            d="M123 163 L129 156 L132 164 Z M138 164 L141 156 L148 163 Z M125 169 Q135 180 145 169 L138 170 L137 174 L132 174 L131 170 Z"
            fill="#634132"
            stroke="none"
          />
        </g>
      );
    case 'vampire-cape':
      return (
        <g stroke="#623548" strokeWidth="2" strokeLinejoin="round">
          <path
            d="M65 129 L85 151 L100 139 L115 151 L135 129 L118 139 L100 136 L82 139 Z"
            fill="#a04460"
          />
          <circle cx="100" cy="141" r="5" fill="#efcc78" stroke="#b88b47" />
        </g>
      );
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
