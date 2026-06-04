module.exports = {
  preset: "jest-expo",
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": ["<rootDir>/transforms/patchMockComponent.js"],
  },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-maps)",
  ],
  moduleNameMapper: {
    // config.ts is gitignored — replace with a test fixture for all tests
    ".*/constants/config$": "<rootDir>/src/__mocks__/config.ts",
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/__mocks__/**",
    "!src/__tests__/**",
  ],
  coverageReporters: ["text", "lcov"],
};
