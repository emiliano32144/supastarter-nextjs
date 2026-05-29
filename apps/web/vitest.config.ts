import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// Solo tests unitarios de lógica pura. Los e2e de Playwright viven en
		// ./tests (*.spec.ts) y se ejecutan con `pnpm e2e`.
		include: ["lib/**/*.test.ts"],
		environment: "node",
	},
});
