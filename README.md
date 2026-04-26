# Excalitabs

Excalitabs is a Proof-of-Concept fork of [Excalidraw](https://github.com/excalidraw/excalidraw) by GitHub user [@1ucas](https://github.com/1ucas).

This fork demonstrates how AI can be used directly inside an existing open-source codebase to implement meaningful product features. In this case, the experiment adds a tab system so users can keep multiple drawings open and switch between them, closer to the workflow in tools like draw.io.

## Proof-of-Concept Notice

This repository is not intended to be a fully featured, polished, or maintainable product. Treat it as an implementation experiment, not as an official Excalidraw distribution or a production-ready alternative.

The goal is to show the process and feasibility of AI-assisted feature development in a real codebase:

- adding local drawing persistence;
- switching between active drawings;
- adapting import and share flows so they create new drawings instead of overwriting current work;
- adding a bottom tab switcher UI;
- running formatting, type checking, and linting as part of the workflow.

## Context

The original motivation for this experiment was to show that Codex could help implement a multi-tab drawing workflow in the open-source Excalidraw repository, starting from one prompt.

The fork/branch referenced by the experiment is:

https://github.com/1ucas/excalidraw/tree/feat/excalitabs

## Upstream Project

Excalitabs is based on Excalidraw. For the official project, documentation, npm package, issues, and production product information, use the upstream links:

- [Excalidraw repository](https://github.com/excalidraw/excalidraw)
- [Excalidraw documentation](https://docs.excalidraw.com)
- [Excalidraw app](https://excalidraw.com)

## Local Development

This fork keeps the original monorepo structure. To run it locally, use the upstream development workflow:

```bash
yarn
yarn start
```

Then open the local URL printed by Vite.

## License

This fork preserves the upstream Excalidraw license. See [LICENSE](./LICENSE).
