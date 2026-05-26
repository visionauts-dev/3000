module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src/__tests__"],
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: { strict: false } }],
  },
  collectCoverageFrom: [
    "src/game/**/*.ts",
    "!src/**/*.d.ts",
  ],
};
