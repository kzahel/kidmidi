import type { ReactNode } from 'react';
import styles from './Backdrop.module.css';

// Original vector scenes share one drawing in the shop, home and playing dock.
export function Backdrop({ id }: { id?: string | null }) {
  return (
    <svg
      viewBox="0 0 240 180"
      preserveAspectRatio="xMidYMid slice"
      className={styles['art']}
      aria-hidden="true"
      data-backdrop={id ?? 'meadow'}
    >
      <rect
        width="240"
        height="180"
        fill={
          id === 'moon-scene' || id === 'castle-scene'
            ? '#343b68'
            : id === 'ocean-scene'
              ? '#a8dfe6'
              : '#e6efd4'
        }
      />
      {id === 'treehouse-scene' ? (
        <>
          <path d="M35 170 L44 50 L65 50 L70 170" fill="#a47b51" />
          <g fill="#83ae76">
            <circle cx="48" cy="45" r="44" />
            <circle cx="96" cy="30" r="43" />
            <circle cx="18" cy="17" r="36" />
          </g>
          <path
            d="M56 70 L56 32 L96 12 L136 32 L136 70 Z"
            fill="#dfb372"
            stroke="#956b44"
            strokeWidth="3"
          />
          <path
            d="M48 34 L96 6 L144 34"
            fill="none"
            stroke="#956b44"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <rect x="87" y="37" width="20" height="25" rx="4" fill="#fcf1bf" />
          <path
            d="M72 70 L72 142 M89 70 L89 142 M72 87 H89 M72 104 H89 M72 121 H89"
            stroke="#b48a53"
            strokeWidth="4"
          />
          <circle cx="203" cy="33" r="17" fill="#f5d583" />
        </>
      ) : id === 'moon-scene' ? (
        <>
          <path
            d="M190 18 A30 30 0 1 0 220 55 A28 28 0 0 1 190 18"
            fill="#faeab3"
          />
          <g fill="#f8e6b2">
            <path d="M33 17 L36 26 L45 29 L36 32 L33 41 L30 32 L21 29 L30 26Z" />
            <circle cx="83" cy="17" r="2" />
            <circle cx="151" cy="46" r="3" />
            <circle cx="118" cy="28" r="2" />
            <circle cx="60" cy="63" r="2" />
          </g>
          <path
            d="M0 151 Q65 111 122 144 Q195 115 240 139 V180 H0Z"
            fill="#818bad"
          />
          {[22, 49, 200, 223].map((x) => (
            <g key={x}>
              <path d={`M${x} 175 V148`} stroke="#a9c8ae" strokeWidth="3" />
              <circle cx={x} cy="146" r="7" fill="#e6c8df" />
              <circle cx={x} cy="146" r="3" fill="#faeab3" />
            </g>
          ))}
        </>
      ) : id === 'ocean-scene' ? (
        <>
          <path
            d="M0 25 Q50 5 100 25 T240 20 M0 54 Q50 34 100 54 T240 49"
            stroke="#d5f0ef"
            strokeWidth="5"
            fill="none"
          />
          <path d="M0 165 Q55 145 110 160 T240 150 V180 H0Z" fill="#eed8ac" />
          <g fill="none" stroke="#e3faf4" strokeWidth="3">
            <circle cx="35" cy="86" r="9" />
            <circle cx="48" cy="57" r="5" />
            <circle cx="208" cy="70" r="11" />
            <circle cx="195" cy="42" r="6" />
          </g>
          <path
            d="M29 176 V127 M29 149 L14 135 M29 156 L44 142 M211 176 V133 M211 151 L226 137"
            fill="none"
            stroke="#d58c94"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M160 45 Q176 30 192 45 Q176 60 160 45 L153 36 V54Z"
            fill="#e7b861"
          />
        </>
      ) : id === 'castle-scene' ? (
        <>
          <circle cx="190" cy="36" r="23" fill="#f3dda1" />
          <path
            d="M13 157 V54 H23 V64 H36 V54 H48 V64 H61 V54 H72 V157 M49 157 V91 H89 V157"
            fill="#8883aa"
          />
          <path
            d="M17 54 L43 24 L69 54Z M44 91 L69 66 L94 91Z"
            fill="#655987"
          />
          <g fill="#f6d991">
            <rect x="34" y="79" width="15" height="22" rx="7" />
            <rect x="61" y="114" width="14" height="20" rx="7" />
          </g>
          <path
            d="M174 104 Q174 85 187 85 Q200 85 200 104 V120 L193 114 L187 120 L181 114 L174 120Z"
            fill="#f1edf5"
          />
          <circle cx="183" cy="101" r="2" fill="#655987" />
          <circle cx="191" cy="101" r="2" fill="#655987" />
          <path d="M0 164 Q113 141 240 161 V180 H0Z" fill="#6c7892" />
        </>
      ) : (
        <>
          <circle cx="199" cy="35" r="21" fill="#f4d891" />
          <path
            d="M0 151 Q70 113 135 149 Q188 123 240 146 V180 H0Z"
            fill="#b9d39a"
          />
        </>
      )}
    </svg>
  );
}

export function PetScene({
  id,
  children,
}: {
  id?: string | null;
  children: ReactNode;
}) {
  return (
    <span className={styles['scene']}>
      <Backdrop id={id} />
      <span className={styles['foreground']}>{children}</span>
    </span>
  );
}
