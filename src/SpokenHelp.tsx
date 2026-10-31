import { useEffect, useState } from 'react';
import styles from './SpokenHelp.module.css';

export function stopSpokenHelp() {
  window.speechSynthesis?.cancel();
}

export function SpokenHelp({
  text,
  beforeSpeak,
}: {
  text: string;
  beforeSpeak?: () => void;
}) {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    // Use only installed voices; never send the child's activity to a speech service.
    const update = () =>
      setAvailable(
        synth
          .getVoices()
          .some((voice) => voice.localService && /^en\b/i.test(voice.lang)),
      );
    update();
    synth.addEventListener('voiceschanged', update);
    const stop = () => synth.cancel();
    const visibility = () => {
      if (document.hidden) stop();
    };
    window.addEventListener('blur', stop);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      synth.removeEventListener('voiceschanged', update);
      window.removeEventListener('blur', stop);
      document.removeEventListener('visibilitychange', visibility);
      synth.cancel();
    };
  }, []);
  if (!available) return null;
  return (
    <button
      type="button"
      className={styles['help']}
      aria-label="Hear help"
      onClick={() => {
        const synth = window.speechSynthesis;
        const voice = synth
          .getVoices()
          .find(
            (candidate) =>
              candidate.localService && /^en\b/i.test(candidate.lang),
          );
        if (!voice) return;
        beforeSpeak?.();
        synth.cancel();
        const message = new SpeechSynthesisUtterance(text);
        message.voice = voice;
        message.lang = voice.lang;
        message.rate = 0.85;
        synth.speak(message);
      }}
    >
      <span aria-hidden="true">🔊</span>
      <span>Help</span>
    </button>
  );
}
