# Claude Code instructions

@AGENTS.md

## Claude Code specifics

- When the learner asks for help with a layer, use the `motion-tutor` skill in `.claude/skills/motion-tutor/`. It walks the hint ladder above step by step.
- Without asking, run only `node tests/run.js` and `node tools/try.js`; ask before anything else.
