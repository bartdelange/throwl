import { useCallback, useEffect, useRef } from 'react';
import Tts from 'react-native-tts';

export const useSpeak = (opts?: { language?: string; rate?: number }) => {
  const language = opts?.language ?? 'en-US';
  const rate = opts?.rate ?? 0.45;

  const languageSetRef = useRef(false);

  useEffect(() => {
    const subStart = Tts.addEventListener('tts-start', () => {
      /* empty */
    });
    const subFinish = Tts.addEventListener('tts-finish', () => {
      /* empty */
    });
    const subCancel = Tts.addEventListener('tts-cancel', () => {
      /* empty */
    });

    return () => {
      // @ts-expect-error RN-TTS returns different subscription types across versions; handle all.
      subStart?.remove?.();
      // @ts-expect-error RN-TTS returns different subscription types across versions; handle all.
      subFinish?.remove?.();
      // @ts-expect-error RN-TTS returns different subscription types across versions; handle all.
      subCancel?.remove?.();
    };
  }, []);

  return useCallback(
    async (words: string) => {
      try {
        if (!languageSetRef.current) {
          await Tts.setDefaultLanguage(language);
          languageSetRef.current = true;
        }
        // @ts-expect-error options are version-dependent
        Tts.speak(words, { rate });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('speaking error', err);
      }
    },
    [language, rate],
  );
};
