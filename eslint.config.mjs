import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "build/**",
      "out/**",
      "coverage/**",
      "backend/**",
      "public/**",
      "Automatizations_google_add_later/**",
    ],
  },
  ...nextCoreWebVitals,
  {
    // Keep lint usable for a solo project: prefer signal over strictness.
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "prefer-const": "warn",
      "import/no-anonymous-default-export": "off",
      "react/no-unescaped-entities": "off",
      // React 19 + evolving tooling: avoid blocking on these until stabilized.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/immutability": "off",
      "react-hooks/rules-of-hooks": "warn",
      "@next/next/no-html-link-for-pages": "warn",
    },
  },
];
