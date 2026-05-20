# Reference Graph Path Forward

## Thesis

The portable contract should be a reference graph, not a provider manifest.
Providers already disagree about path defaults, hook events, install scopes,
cache layout, marketplace policy, and component merge rules. The stable layer is
smaller: sources, primitive sets, plugin composition, marketplace entries, and a
resolved lockfile.

The current rough schema set is:

- `schemas/core/reference-definitions.schema.json`: shared graph definitions.
- `schemas/core/plugin.schema.json`: a composable plugin with `extends` and
  explicit primitive collections.
- `schemas/core/marketplace.schema.json`: a catalog that can expose plugins and
  standalone primitives from local or remote sources.
- `schemas/core/lock.schema.json`: exact resolved sources and content digests.

## Provider Facts Preserved

The attached specs point to overlapping primitives:

- Agent Skills defines a skill as a directory with `SKILL.md` plus optional
  `scripts/`, `references/`, and `assets/`.
- Claude Code and GitHub Copilot plugin docs both model plugins as directories
  that expose skills, agents, hooks, MCP/LSP servers, and related assets.
- Claude Code marketplace docs model local, GitHub, generic git, git subdir,
  and npm sources, with explicit version fields, commit SHA pins, and
  marketplace-level cross-marketplace allowlists.
- Claude dependency docs keep dependency resolution at plugin level, but the
  same idea is useful at resource level when a skill requires an instruction or
  hook.
- Codex config and hook schemas show that plugin, marketplace, skill, and hook
  configuration can be projected into a harness later.

The schemas keep those facts without adopting any one provider's manifest as
the source of truth.

## Graph Model

`SourceReference` is where content comes from. The first rough source variants
are `LOCAL_SOURCE`, `GITHUB_SOURCE`, `GIT_SOURCE`, `GIT_SUBDIR_SOURCE`,
`NPM_SOURCE`, and `MARKETPLACE_SOURCE`.

Primitive definitions are first-class shapes, not one generic resource shape.
The initial primitive set is `SkillPrimitive`, `AgentPrimitive`,
`InstructionPrimitive`, and `HookPrimitive`. Each primitive carries its own
`type`, source, path, optional name, optional version selector, and optional
integrity.

`Plugin` composes primitive sets and extends other plugins:

- `extends[]` points to `PLUGIN_REFERENCE` objects.
- `skills[]` points to skill primitives.
- `agents[]` points to agent primitives.
- `instructions[]` points to instruction primitives.
- `hooks[]` points to hook primitives.
- primitive-level `dependsOn[]` expresses lower-level graph edges without
  copying sibling assets.

`Marketplace` exposes plugin entries and optional standalone primitive sets. This is
what lets the same catalog contain a local plugin, a git-backed plugin, and a
single shared skill without forcing them through a generic resource bucket.

`Lockfile` records the resolved graph after source resolution. Authored plugin
and marketplace files can keep semver ranges, refs, or loose selectors; the
lockfile owns exact revisions and content digests.

## Projection Boundary

Provider adapters should run after graph resolution.

A Claude adapter can project primitives into `.claude-plugin/plugin.json`,
`hooks/hooks.json`, `.mcp.json`, or cached plugin directories. A GitHub Copilot
adapter can project to `plugin.json` and marketplace entries. A Codex adapter
can project to config/plugin/hook surfaces. None of those host details need to
exist in the core graph unless a primitive explicitly points at a provider-native
file as content.

This keeps hook support provider-agnostic. A `HOOK` primitive says a hook
asset exists and can be composed. The adapter decides whether that hook becomes
a Claude hook matcher, a Codex hook group, or something else.

## Resolution Pipeline

1. Validate authored plugin and marketplace documents against the core schemas.
2. Build a graph from `extends`, primitive collections, marketplace entries, and
   primitive-level `dependsOn`.
3. Resolve source references to exact content: git SHA, package version, local
   digest, or marketplace plugin resolution.
4. Check portable integrity rules: relative paths only, no parent traversal,
   expected files exist, and referenced graph nodes resolve.
5. Write a lockfile with exact resolved sources and digests.
6. Project the locked graph into the chosen harness.

## Deliberately Deferred

These are real concerns, but they should not be in the first graph contract:

- provider-specific hook event payloads and matcher syntax;
- provider-specific path defaults, cache locations, and install scopes;
- permissions and tool allowlists;
- model selection, prompt settings, and runtime behavior guarantees;
- component precedence and conflict policy;
- enterprise enforcement mechanics beyond catalog posture;
- token accounting and on-invoke cost estimates;
- generated provider manifests.

The baseline for accepting new core fields should be strict: the field must be
portable across providers and needed before adapter projection. Otherwise, keep
it in the adapter layer or the lockfile.
