# Scholaris — Paper Analysis Agents

Scholaris is a local-first research-paper review workspace. It coordinates six distinct academic perspectives to produce a structured screening report while keeping uncertainty and human-verification requirements visible.

## Review panel

1. Senior Research Scholar — research framing, objectives, and gaps
2. Academic Writing Specialist — clarity, coherence, and scholarly style
3. Originality Analyst — contribution language and attribution signals
4. Technical Domain Expert — methodology and claim calibration
5. Journal Reviewer — publication structure and limitations
6. Quality Assurance — cross-section and citation checks

The current version performs deterministic textual and structural screening in the browser. It does not claim to verify facts, source databases, experimental data, or plagiarism.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production build

```bash
npm run build
npm run preview
```

## Supported input

- Paste manuscript text directly
- Upload plain-text (`.txt`) or Markdown (`.md`) files
- Export the completed review as a text report

PDF and Word extraction are intentionally not simulated in this version. Those formats require a dedicated parser before reliable review.
