import { type ReactNode, useEffect, useRef } from 'react';
import styles from './Dialog.module.css';

export function Dialog({
  title,
  onClose,
  children,
  fitted = false,
}: {
  title: string;
  onClose(): void;
  children: ReactNode;
  fitted?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const backdropPress = useRef(false);
  const outside = (element: HTMLDialogElement, x: number, y: number) => {
    const bounds = element.getBoundingClientRect();
    return (
      x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom
    );
  };
  useEffect(() => {
    const dialog = ref.current;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`${styles['dialog']} ${fitted ? styles['fitted'] : ''}`}
      aria-label={title}
      onPointerDown={(event) => {
        backdropPress.current =
          event.button === 0 &&
          event.target === event.currentTarget &&
          outside(event.currentTarget, event.clientX, event.clientY);
      }}
      onPointerCancel={() => {
        backdropPress.current = false;
      }}
      onClick={(event) => {
        const startedOutside = backdropPress.current;
        backdropPress.current = false;
        if (
          startedOutside &&
          event.target === event.currentTarget &&
          outside(event.currentTarget, event.clientX, event.clientY)
        )
          onClose();
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className={styles['heading']}>
        <h2>{title}</h2>
        <button
          type="button"
          aria-label={`Close ${title.toLowerCase()}`}
          onClick={onClose}
        >
          <span aria-hidden="true">✓</span>
        </button>
      </div>
      {children}
    </dialog>
  );
}
