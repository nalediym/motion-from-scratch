# Claude Code instructions

@AGENTS.md

## Claude Code specifics

- When the learner asks for help with a layer, use the `motion-tutor` skill in `.claude/skills/motion-tutor/`. It walks the hint ladder above step by step.
- Ask before running anything other than `node tests/run.js`. Never edit files in `src/`, `tests/` or `lib/` for a learner.
