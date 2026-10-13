# Local commands for the agent

Use structured JSON files for owner text.
Do not interpolate user text into shell commands.
Use the returned brand ID and current version.

```sh
npm run engine -- doctor
npm run engine -- init "Your business"
npm run engine -- next BRAND_ID
npm run engine -- show BRAND_ID
npm run engine -- save BRAND_ID answers.json
npm run engine -- plan BRAND_ID design-plan.json
npm run engine -- directions BRAND_ID
npm run engine -- select BRAND_ID selection.json
npm run engine -- sample BRAND_ID CURRENT_VERSION
npm run engine -- approve BRAND_ID approval.json
npm run engine -- kit BRAND_ID
```

Read templates/answers.json and templates/selection.json for the input format.
Use templates/design-plan.json for the concept records.
Set `logoMode` in the selection file for the primary format.
Read docs/logo-formats.md for the accepted values and optional outline records.
Use templates/custom-symbol.json inside a concept's `customSymbol` field.
See examples/coffee-design-plan.json for a complete fictional example.
Create business-linked geometry for every concept before the `directions` command.
The engine rejects an absent plan or missing design answers.
Update `expectedVersion` to the actual current version before a save or selection.
The engine rejects stale versions.
It keeps the earlier profile in the history folder.

The `sample` command returns the review path and exact sample hash.
Use templates/approval.json after the owner approves that sample.
Never use an example approval as real authorization.

The `kit` command rejects a missing approval or a modified sample file.
It exports the sample assets and leaves final production checks pending.

Private data stays in `.data/brands/BRAND_ID/` by default.
Set `VIRAX_BRAND_DATA` to use another private directory.
Keep that directory outside tracked public files.
Use one writer per business profile at a time.
The local workbench is not a multi-user server.

The local HTML boards need no server.
Open the returned `index.html` with an available browser.
Use a temporary local server only when the browser cannot read a local file.
