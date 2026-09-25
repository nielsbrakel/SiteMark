# Biome GritQL plugins

Bans that Biome has no built-in rule for (D-243). They are registered in `biome.json` under `plugins`
(or under an override's `plugins` when a ban only holds in some folders, like `no-style-attribute.grit`
for `website/**` and `src/ui/components/**`), and `tests/unit/lint-rules.test.ts` proves each one fires.
