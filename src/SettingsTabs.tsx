import styles from './SettingsTabs.module.css';

export function SettingsTabs<T extends string>({
  id,
  label,
  tabs,
  value,
  onChange,
}: {
  id: string;
  label: string;
  tabs: readonly { id: T; label: string }[];
  value: T;
  onChange(value: T): void;
}) {
  return (
    <div role="tablist" aria-label={label} className={styles['tabs']}>
      {tabs.map((tab, index) => (
        <button
          type="button"
          role="tab"
          key={tab.id}
          id={`${id}-${tab.id}`}
          aria-controls={`${id}-panel`}
          aria-selected={value === tab.id}
          tabIndex={value === tab.id ? 0 : -1}
          onClick={() => onChange(tab.id)}
          onKeyDown={(event) => {
            const next =
              event.key === 'ArrowRight'
                ? (index + 1) % tabs.length
                : event.key === 'ArrowLeft'
                  ? (index + tabs.length - 1) % tabs.length
                  : event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? tabs.length - 1
                      : null;
            if (next === null) return;
            event.preventDefault();
            onChange(tabs[next].id);
            const buttons =
              event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                '[role="tab"]',
              );
            buttons?.[next].focus();
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
