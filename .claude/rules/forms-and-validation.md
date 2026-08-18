---
paths:
  - src/types/api/**
  - src/constants/zod-*.ts
  - src/features/**/types.ts
  - src/features/**/form.ts
  - src/features/**/components/**Form*.tsx
---

# Forms and Validation

## What Zod is for here

Zod in this repo validates **user input in forms**. It is not the transport contract — that comes from the OpenAPI snapshot via generated types (see `.claude/rules/data-access.md`). The two overlap in shape and must not be conflated:

| Concern | Source of truth |
|---|---|
| What the server will accept | `src/types/api/generated/**`, generated from the OpenAPI snapshot |
| What the user is allowed to type | `src/types/api/zod-*.schema.ts` |

When the backend tightens a constraint, the generated types change and the Zod schema must be updated to match by hand. Client validation exists for the user's benefit; the server validates independently and is authoritative.

## Schema organisation

- One schema file per resource: `src/types/api/zod-<resource>.schema.ts`.
- **Atomic validators live in `src/constants/zod-rules.ts` and are `z`-prefixed** — `zUUID`, `zEmail`, `zPassword`, and so on. Compose from these; do not re-derive a UUID or email rule inline.
- **All error strings live in `src/constants/zod-messages.ts`**, namespaced per domain. Never inline an error string in a schema — a message written inline cannot be reused, translated, or audited.
- Composite request schemas use descriptive unprefixed names (`createMetricCategorySchema`).

This mirrors the backend's `zod-rules.ts` / `zod-messages.ts` convention deliberately, so the two sides stay legible to each other. What does **not** carry over: `extendZodWithOpenApi`, `.openapi()` metadata, and the double `.uuid()` + `.regex()` workaround. Those are spec-generation concerns and the frontend does not generate a spec.

## Forms

React Hook Form with `@hookform/resolvers/zod`:

```ts
const form = useForm<CreateMetricCategoryInput>({
  resolver: zodResolver(createMetricCategorySchema.shape.body),
  defaultValues: { … },
});
```

Note `.shape.body` — the schemas mirror the backend's `{body, query, params}` bag shape, so a form nearly always wants `.shape.body`.

Derive the form's TypeScript type from the schema in the feature's `types.ts`:

```ts
export type CreateMetricCategoryInput = z.infer<typeof createMetricCategorySchema.shape.body>;
```

Never hand-write a type that parallels a schema — they will drift.

## Rules

- Validate on the client for feedback, never for safety.
- Server validation errors come back as `{errors: [{path, message}]}` and are already parsed into `NormalizedApiError.messages`. Map them onto fields via `form.setError` rather than showing a generic toast, when the `path` allows it.
- Submit handlers are async and must satisfy `no-misused-promises` — pass `form.handleSubmit(onSubmit)` directly rather than wrapping it in an inline async arrow.
- Any string that reaches `dangerouslySetInnerHTML` goes through DOMPurify first. There is no exception to this.

Zod is pinned at v3 (`3.25.x`). Do not use v4 syntax.
