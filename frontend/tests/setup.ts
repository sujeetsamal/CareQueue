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

// Mock window.matchMedia for theme tests in JSDOM
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
