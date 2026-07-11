<!--
Copyright (c) 2024 Themba Mzumara
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Fenestration Portal

The Fenestration Portal is a developer tool for exploring SwissJS plugins at runtime.

- Lists registered plugins from `PluginManager`
- Shows available services per plugin
- Provides a foundation for invoking hooks/events and inspecting capabilities

## Package

- Name: `@swissjs/fenestration-explorer`
- Location: `tools/fenestration-explorer/`

Note: this directory currently has no `package.json` -- the `pnpm --filter` commands below describe the intended dev workflow once it's wired up as a real package, not something that works today. Ported as-is from swiss-lib; not fixed here.

## Run (Dev Server)

Use Vite dev server (recommended during development):

```bash
pnpm --filter @swissjs/fenestration-explorer dev
```

- Default URL: `http://localhost:5173`
- Stop: Ctrl+C
- Custom port:

```bash
pnpm --filter @swissjs/fenestration-explorer dev -- --port 5174
```

## Build & Preview

```bash
pnpm --filter @swissjs/fenestration-explorer build
pnpm --filter @swissjs/fenestration-explorer preview
```

## UI Overview

- Header: "SwissJS Fenestration Portal"
- Plugin list: names and services from `PluginManager.globalRegistry()`
- Actions:
  - "Ping Proxy" → expects `pong@<origin>`
  - "Fetch via Proxy" → lists plugin names (0 is OK in a clean env)

## Notes

- `PluginManager` is imported via the browser-safe path `@swissjs/core/plugins`.
- The proxy client uses `postMessage` with a local fallback for development.

## Next

- Add hook invocation UI
- Add capability and policy views
- Add connection to a running SwissJS app context
