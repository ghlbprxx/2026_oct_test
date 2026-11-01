# Local wrappers

Put small wrapper scripts here when your media CLI can't do a job in one call (it prints a URL instead of saving,
transparent images need a background-removal step, audio needs converting). Point `command` in
`../image.config.json`, `../audio.config.json` or `../voice.config.json` at them.

Wrappers must write the file at the path they're given, exit non-zero on failure, and never print API keys.
The `generate-media` Claude Code skill (`.claude/skills/generate-media/SKILL.md` at the repo root) writes these for you.
