# OpenAPI: one source of truth

The root `openapi.yaml` is the only file that is edited by hand. There are no generated copies to keep in sync.

External consumers can access the specification via two runtime-served endpoints:

- `GET /openapi.yaml` — returns the canonical spec as YAML (`src/app/openapi.yaml/route.ts`)
- `GET /openapi.json` — returns the same spec converted to JSON on demand (`src/app/openapi.json/route.ts`)

Both routes read directly from the root `openapi.yaml`, so the served document is always current with no generation step required. Do not commit a separate `public/openapi.yaml` or `public/openapi.json`; those would be stale duplicates.

The OpenAPI contract test suite (`src/test/contract/openapi-contract.test.ts`) validates that live route handlers return responses that conform to the spec schemas. Run it with `npm test`.
