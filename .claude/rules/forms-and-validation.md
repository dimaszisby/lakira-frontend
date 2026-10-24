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
- Never render a string as HTML. `react/no-danger` is a lint error and no sanitiser is installed; see `.claude/rules/security.md` § Injection for what an exception takes.

Zod is v4 (`4.6.x`) since 2026-10-24, imported from `"zod"`; the legacy `zod/v3` path is not used ([ADR-0043](../../docs/explanation/decisions/adr-0043-the-frontend-moves-to-zod-4.md)). Four v4 differences bite here:

- **A defaulted field is optional on input and required on output**, so a form whose schema has `.default()` is typed with both: `useForm<z.input<typeof schema>, unknown, z.infer<typeof schema>>`. Each such form's `types.ts` exports a `<Name>FormFields` input type beside its output type.
- **`required_error` and `invalid_type_error` are gone.** Pass `error`, a string or a function of the issue; `whenMissing` in `src/constants/zod-rules.ts` answers only for a missing value.
- **zod 4 reaches for eval** to compile object parsers, which the Content Security Policy blocks and reports. `src/instrumentation-client.ts` sets `z.config({ jitless: true })` before any schema is built; do not move that call later, and do not widen the policy (kit `zod-4-upgrade`, D-03).
- **zod's own messages changed wording** ("Too small: expected number to be >=0"). A field whose error is shown carries a `ZodMessages` entry rather than zod's text.

lakira-backend is still on zod 3, so the two sides' rule files no longer share zod syntax.
