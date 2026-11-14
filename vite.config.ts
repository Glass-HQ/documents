import { defineConfig } from "vite-plus";

// Upstream's code (the anydoc crate's Node and Python bindings, its benchmark,
// fuzzing and examples) keeps upstream's formatting, so merges from
// firecrawl/anydoc stay clean. Generated output is never formatted or linted.
const ignorePatterns = [
  "**/dist/**",
  "**/node_modules/**",
  "bun.lock",
  "target/**",
  "bench/**",
  "examples/**",
  "fuzz/**",
  "node/**",
  "python/**",
  "skills/**",
  "tests/**",
  "wasm/pkg/**",
  "wasm/README.md",
  "wasm/test.mjs",
  "packages/documents/src/core/wasm/**",
  "packages/documents/src/core/wasm-pdf/**",
  ".agents/**",
  ".claude/**",
  ".codex/**",
  ".cursor/**",
];

export default defineConfig({
  run: {
    tasks: {
      // The Rust core. Cargo keeps its own incremental cache, so these never use Vite+'s.
      "cargo:fmt": { command: "cargo fmt --all --check", cache: false },
      "cargo:clippy": {
        command: [
          "cargo clippy --workspace --all-targets --all-features --locked -- -D warnings",
          "cargo clippy -p anydoc-wasm --target wasm32-unknown-unknown --locked -- -D warnings",
        ],
        cache: false,
      },
      // The root crate only: the Node and Python binding crates build cdylibs whose test
      // harnesses can't link outside a Node or Python host.
      "cargo:test": { command: "cargo test --locked", cache: false },
    },
  },
  staged: {
    "*": "vp fmt --no-error-on-unmatched-pattern",
  },
  fmt: {
    ignorePatterns,
    sortPackageJson: {},
  },
  lint: {
    ignorePatterns,
    plugins: ["eslint", "oxc", "react", "unicorn", "typescript"],
    jsPlugins: ["./tools/oxlint-plugin-glass/index.ts"],
    categories: {
      correctness: "warn",
      suspicious: "warn",
      perf: "warn",
    },
    rules: {
      "glass/no-em-dash-copy": "error",
      "react-in-jsx-scope": "off",
      "typescript/consistent-return": "off",
      "typescript/no-floating-promises": "off",
      "unicorn/consistent-function-scoping": "off",
      "unicorn/no-array-sort": "off",
      // Sequential awaits here are deliberate: pages measured in order, wasm builds one at a time,
      // streams read chunk by chunk.
      "eslint/no-await-in-loop": "off",
      // DOM nodes can come from another document, such as an iframe's, where instanceof guards
      // fail, and values crossing the wasm and worker boundaries were already checked by the core.
      "typescript/no-unsafe-type-assertion": "off",
      // Flags Worker.postMessage too, which has no target origin.
      "unicorn/require-post-message-target-origin": "off",
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
});
