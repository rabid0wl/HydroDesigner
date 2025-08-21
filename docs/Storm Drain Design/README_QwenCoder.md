
# Workbook Export for Qwen Coder (CLI)

This folder contains a machine-readable export of `Pipe Network Design_V5.xlsx` to help Qwen Coder reconstruct logic in code.

## Contents
- `sheets_csv/` — Each Excel sheet exported as CSV (raw values, no formatting).
- `workbook_manifest.json` — All formulas by cell and a dependency edge list you can parse to infer calculation order within each sheet.

## Notes
- Cells with formulas are listed with `{"cell": "A1", "formula": "=..."}` under their sheet.
- `dependencies` lists edges like `from: "Sheet!A1" -> to: "Sheet!B2"` whenever B2's formula references A1. Cross-sheet references are not auto-resolved here; this export treats references as same-sheet unless explicitly detected in the formula.
- CSV files are headerless; your code should infer headers if needed, or you can hardcode column roles per design.

## Suggested Qwen Task
Implement a TypeScript module that:
1. Reads `workbook_manifest.json`.
2. Parses `dependencies` by sheet to build a local calculation DAG.
3. Loads the corresponding `sheets_csv/<Sheet>.csv` into 2D arrays.
4. For each formula cell, replace A1 references with array lookups and evaluate in topological order. (A formula parser like a simple A1 evaluator with `+, -, *, /, ^, SUM, MIN, MAX` is sufficient to prove parity for most cells. Extend as needed.)
5. Use the computed values to validate the hydrology + hydraulics logic you re-implement from the spec.

## Minimal System Prompt (paste into Qwen CLI)
You are Qwen Coder. Given the CSVs and JSON manifest, rebuild the storm drain design computations (Rational Method, IDF interpolation, Manning full flow, pipe sizing, Tc iteration, inverts/cover checks). Use the JSON dependency graph only as a helper — do not depend on Excel at runtime.

Inputs:
- `sheets_csv/*.csv` (raw values)
- `workbook_manifest.json` (formula locations + intra-sheet dependencies)
Outputs:
- TypeScript functions: interpolation, manningFull, toposort, iterateDesign, setInvertsAndCover, evaluateCompliance, runDesign.

Strict rules:
- US customary units; Kn=1.486; optional 1.008 Rational factor (toggle `use1008`)
- Full-flow capacity for sizing; velocity window and min slopes by diameter from criteria
- Iteratively update Tc and intensities to convergence
- Implement log-log and linear IDF interpolation
- Provide basic tests to demonstrate parity with spreadsheet results
