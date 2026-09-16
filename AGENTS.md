<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent preferences

## Visual QA

The user handles all visual QA. Do **not** take screenshots, screen recordings, or run browser/computer-use verification for UI appearance.

- After UI changes: build/typecheck as needed, commit, push, update the PR, and stop.
- Do not use RecordScreen, computerUse, or walkthrough screenshot/video artifacts unless the user explicitly asks for them in that turn.
- Prefer shipping the change over proving it visually.
