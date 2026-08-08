import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Wraps the browser's native Web Speech API (SpeechRecognition +
 * speechSynthesis). This is 100% free and requires no API key — but it only
 * works in browsers that implement it (Chrome/Edge on desktop and Android;
 * NOT Safari/iOS, and NOT Firefox). `supported` tells the caller whether to
 * show the mic UI or fall back to a text input.
 */
export function useSpeech({ lang = "nl-NL" } = {}) {
  const recognitionRef = useRef(null);
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interimText, setInterimText] = useState("");

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const hasTTS = "speechSynthesis" in window;
    setSupported(Boolean(SR) && hasTTS);
    if (SR) {
      const recognition = new SR();
      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;
    }
  }, [lang]);

  /**
   * Listens for a single utterance and resolves with the recognized text.
   * Resolves with "" on error/timeout so callers never hang.
   */
  const listenOnce = useCallback(() => {
    return new Promise((resolve) => {
      const recognition = recognitionRef.current;
      if (!recognition) {
        resolve("");
        return;
      }
      let finalText = "";
      setInterimText("");

      recognition.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const chunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalText += chunk;
          else interim += chunk;
        }
        setInterimText(interim);
      };
      recognition.onerror = () => {
        setListening(false);
        resolve(finalText.trim());
      };
      recognition.onend = () => {
        setListening(false);
        setInterimText("");
        resolve(finalText.trim());
      };

      try {
        setListening(true);
        recognition.start();
      } catch {
        setListening(false);
        resolve("");
      }
    });
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  /** Speaks text aloud and resolves once finished (or immediately if unsupported). */
  const speak = useCallback(
    (text) => {
      return new Promise((resolve) => {
        if (!("speechSynthesis" in window) || !text) {
          resolve();
          return;
        }
        window.speechSynthesis.cancel(); // never overlap utterances
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = lang;
        utter.rate = 1;
        utter.pitch = 1;

        const voices = window.speechSynthesis.getVoices();
        const dutchVoice = voices.find((v) => v.lang?.toLowerCase().startsWith("nl"));
        if (dutchVoice) utter.voice = dutchVoice;

        utter.onstart = () => setSpeaking(true);
        utter.onend = () => {
          setSpeaking(false);
          resolve();
        };
        utter.onerror = () => {
          setSpeaking(false);
          resolve();
        };
        window.speechSynthesis.speak(utter);
      });
    },
    [lang]
  );

  const cancelSpeech = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return { supported, listening, speaking, interimText, listenOnce, stopListening, speak, cancelSpeech };
}
