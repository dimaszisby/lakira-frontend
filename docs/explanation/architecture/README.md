# Architecture

Why the code is shaped the way it is. For _what_ the routes and tokens are, see
[`../../reference/`](../../reference/).

| Level | Question it answers                   |                                                       |
| ----- | ------------------------------------- | ----------------------------------------------------- |
| 1     | What does the frontend talk to?       | [System context](./c4-context.md)                     |
| 2     | What runs, and where does state live? | [Containers](./c4-containers.md)                      |
| 3     | How is the code layered inside?       | [Layers and boundaries](./layers-and-boundaries.md)   |
| 4     | How is one domain built?              | [Feature module anatomy](./feature-module-anatomy.md) |

Then the two subsystems with their own rules:

- [App Router and `@modal` routing](./app-router-and-modal-routing.md)
- [Data access and caching](./data-access-and-caching.md)

Diagrams are Mermaid in Markdown — they render on GitHub, need no toolchain, and diff as text, so a
wrong arrow shows up in review like any other line.

## Where decisions are recorded

[`../decisions/`](../decisions/) holds the ADR registry. Check a record's **Status** before trusting
it.
