# Security policy

## Reporting a vulnerability

Please don't report security vulnerabilities in a public issue or discussion.

Use [GitHub's private vulnerability reporting](https://github.com/Glass-HQ/documents/security/advisories/new) and include:

- what the vulnerability is;
- the affected version or commit;
- the steps or a small reproduction, such as a crafted file; and
- the impact, and a fix if you have one in mind.

If private reporting isn't available, contact the maintainers privately through the Glass-HQ GitHub organization before sharing details.

## Scope

Documents treats every file as hostile, so these are in scope: a document that runs code or reaches the network through the viewer, escapes the sanitizer, or makes the parser or a renderer hang, crash or exhaust memory beyond its limits. The policy covers `@glass-hq/documents`, the playground, the build and release tooling, and the Rust core as this repository builds it. A problem in the parser that also affects upstream anydoc will be reported to Firecrawl in coordination with you.

Don't include secrets or private documents in a report unless they're needed to reproduce it. We'll coordinate the investigation, the fix and public disclosure with you.
