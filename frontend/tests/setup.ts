import "@testing-library/jest-dom/vitest";

// Mock window.speechSynthesis for audio announcement tests
Object.defineProperty(window, "speechSynthesis", {
  value: {
    speak: () => {},
    cancel: () => {},
    pause: () => {},
    resume: () => {},
    getVoices: () => [],
  },
  writable: true,
});
