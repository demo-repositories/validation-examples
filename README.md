# Sanity validation outside Studio

Examples for running the same Sanity schema validations in a Studio, an App SDK app, and a Node/Express API.

## Layout

- `packages/content-schema` is the executable source of truth. It defines the schema and compiles it for `@sanity/validation`.
- `apps/studio` displays those rules in a standalone Studio.
- `apps/validator-app` is a Sanity App SDK app with two views: a JSON document and a React Hook Form. Both validate with the signed-in client.
- `apps/validator-api` exposes `POST /validate` and `POST /validate/batch`. The batch route calls `validateDocuments`, which shares reference-existence checks and the fetch concurrency limit across the documents.

The product schema demonstrates built-in rules; warning/error levels; sibling, document, object, reference, and array validation; custom child paths; and an async `context.getClient()` uniqueness lookup.

`fixtures/validation.ndjson` is optional test data. The Studio, app, and API run without it. Import it when you want saved documents to validate: `category-ceramics`, a valid `product-green-mug` (`MUG-0002`), two products that share `MUG-0001`, and `product-invalid`. `.env.example` names the dataset `validation`. Create it if it does not exist, then import the file. The Studio CLI uses your Sanity login, which needs permission to create documents:

```sh
pnpm --filter @validation-examples/studio exec sanity datasets create validation --visibility private
pnpm --filter @validation-examples/studio exec sanity datasets import ../../fixtures/validation.ndjson
pnpm --filter @validation-examples/studio exec sanity documents validate
```

Pass `--replace` to `datasets import` when those document IDs are already in the dataset.

## Run it

```sh
pnpm install
cp .env.example .env
# Fill in the project and organization IDs, then add a read token before starting the API:
pnpm --filter @validation-examples/studio dev
pnpm --filter @validation-examples/validator-app dev
pnpm --filter @validation-examples/validator-api dev
```

The API's token is server-only. It is deliberately not prefixed with `SANITY_APP_` or `SANITY_STUDIO_`.

Example request:

```sh
curl -X POST http://localhost:3001/validate \
  -H 'content-type: application/json' \
  --data '{"document":{"_id":"drafts.product-1","_type":"product","title":"X"}}'
```

A `200` response means validation returned `status: "passed"` and has no error markers. `422` means it has an error marker or `status: "notEvaluated"`. Do not write to Sanity when the status is `notEvaluated`: client-dependent rules could not be evaluated.

## Why schemas are shared as code

`sanity schemas deploy` is still useful:

```sh
pnpm --filter @validation-examples/studio exec sanity schemas deploy
pnpm --filter @validation-examples/studio exec sanity schemas list --json
```

It deploys a JSON representation for Sanity integrations. It cannot preserve executable functions. A `rule.custom()` validator is serialized only as a marker that a custom rule existed; its function is removed. The same is true of `valueOfField` rules. A schema rebuilt from that manifest therefore cannot execute this project's custom validation.

For applications outside this monorepo, publish `packages/content-schema` as a private npm package (or a pinned git dependency), and import `schemaTypes` in the Studio plus `getValidationSchema()` wherever documents are checked. Release it with the Studio schema and pin compatible `sanity`, `@sanity/schema`, and `@sanity/validation` major/minor versions. If browser clients must not receive business-rule code, validate through the server API instead.

## Verify

```sh
pnpm typecheck
pnpm test
pnpm build
```

The tests include `getClient` configuration, custom marker paths, incomplete validation, and batches. The App SDK build is also the browser-bundle smoke test.
