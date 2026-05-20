# Initial Thoughts: Agent Primitive References

## Purpose

This note describes the smallest useful source contract for portable agent
primitives: instructions, skills, agents, hooks, and the resources they expect.

The schema should not turn a skill into a bespoke application model. It should
only prove that authored primitives live in canonical places, that their
expected files exist, and that any sibling primitives they depend on are present
and addressable.

## Standard To Preserve

This follows the existing direct-reference standard:

- authored primitives live under canonical roots such as `skills/`, `agents/`,
  `hooks/`, and `instructions/`;
- local references point directly at those roots instead of passing through a
  staging area;
- local paths are repository-relative;
- local paths reject absolute paths, `..`, and retired staging roots;
- JSON shapes use `type` as the discriminator;
- discriminator values are CAPS_CASE and use `enum`, not `const`;
- schema-checked objects are closed with `additionalProperties: false` unless
  extension is intentional.

The important constraint is that a primitive reference should not grow a second
conceptual model for skills. A skill is a folder-backed primitive. Its identity
comes from its path.

## Minimal Model

The source graph needs three concepts.

```text
PrimitiveReference =
  INSTRUCTION { path }
  | SKILL { path, expectedResources?, siblingDependencies? }
  | AGENT { path, expectedResources?, siblingDependencies? }
  | HOOK { path, expectedResources?, siblingDependencies? }

ExpectedResource =
  relative path string

SiblingDependency =
  INSTRUCTION { path }
  | SKILL { path }
  | AGENT { path }
  | HOOK { path }
```

This is intentionally sparse:

- `path` is the source identity;
- the primitive name is derived from the path;
- `expectedResources` lists files that must exist with the primitive;
- `siblingDependencies` points to other first-class primitives in canonical
  roots;
- co-located files stay resources, not new primitive declarations;
- sibling primitives stay references, not embedded manifests.

For a directory-backed primitive such as a skill, `expectedResources` are paths
relative to the primitive directory. For a file-backed primitive such as a
single instruction file, omit `expectedResources` unless the primitive becomes a
directory.

## Skill Expression

A skill should be expressible without `id`, `entrypoint`, `requires`,
`conflictsWith`, target adapters, tool profiles, evaluation settings, or output
contracts.

```json
{
  "type": "SKILL",
  "path": "skills/code-review",
  "expectedResources": [
    "SKILL.md",
    "references/severity-model.md",
    "references/review-checklist.md"
  ],
  "siblingDependencies": [
    {
      "type": "INSTRUCTION",
      "path": "instructions/type-safety.md"
    },
    {
      "type": "HOOK",
      "path": "hooks/evidence-report.json"
    }
  ]
}
```

The derived name is `code-review` because the path is `skills/code-review`.
If the folder and declared name can disagree, the schema has already allowed a
failure mode that does not need to exist.

## Pack Expression

A pack is just a list of primitive references plus package identity.

```json
{
  "schemaVersion": 1,
  "type": "PRIMITIVE_PACK",
  "path": "plugins/agentic-coding/plugin.refs.json",
  "version": "0.1.0",
  "primitives": [
    {
      "type": "SKILL",
      "path": "skills/code-review",
      "expectedResources": [
        "SKILL.md",
        "references/severity-model.md"
      ],
      "siblingDependencies": [
        {
          "type": "INSTRUCTION",
          "path": "instructions/type-safety.md"
        }
      ]
    },
    {
      "type": "INSTRUCTION",
      "path": "instructions/type-safety.md"
    },
    {
      "type": "AGENT",
      "path": "agents/review-agent.md"
    },
    {
      "type": "HOOK",
      "path": "hooks/evidence-report.json"
    }
  ]
}
```

The pack can still be compiled into host-native outputs later, but adapter
syntax is not part of the primitive reference. Host compilers own host-specific
projection details.

## What The Schema Should Validate

The schema and resolver should validate only the source graph:

| Check | Reason |
| --- | --- |
| `schemaVersion` is supported | Rejects stale contracts. |
| `type` is a known primitive or pack type | Keeps the union finite. |
| `path` starts with the canonical root for its `type` | Prevents layout drift. |
| `path` is repository-relative | Prevents machine-local manifests. |
| `path` does not contain `..` | Prevents escaping the repo root. |
| path-derived primitive names are unique per type | Prevents ambiguous references. |
| every `expectedResources[]` path exists | Prevents incomplete skill bundles. |
| every resource path is relative | Prevents resource escape hatches. |
| every `siblingDependencies[]` target exists in the pack or source tree | Prevents dangling references. |

That validation proves placement, existence, identity, and reference integrity.
It does not prove that an LLM will follow a skill. That belongs in evaluation
fixtures or retained run evidence, not in the primitive reference schema.

## What To Leave Out

Leave these out of the primitive reference contract:

- host-specific target adapters;
- emitted artifact locks;
- tool permissions;
- prompt or model configuration;
- skill entrypoints;
- conflict graphs;
- generic `requires` arrays;
- runtime behavior verification;
- output contracts, unless the contract is itself a sibling primitive.

Those may be real concerns, but they are not what a skill needs to express in
the source graph. They should either be compiler-owned, evaluation-owned, or
modeled as separate sibling primitives.

## Next Schema Step

Start with one schema, not a family:

```text
schemas/core/primitive-pack.schema.json
```

That schema should include `$defs` for `PrimitiveReference` and
`SiblingDependency`. Add accepted and rejected fixtures before adding compiler
code.

The first rejected fixtures should cover:

- `SKILL` path outside `skills/`;
- explicit `name` that attempts to diverge from the path-derived name;
- absolute primitive path;
- primitive path containing `..`;
- resource path containing `..`;
- missing `SKILL.md`;
- sibling dependency that does not resolve to a primitive.
