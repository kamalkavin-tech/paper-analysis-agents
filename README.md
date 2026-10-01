# Scholaris — Paper Analysis Agents

Scholaris is a local-first research-paper review workspace. It coordinates six distinct academic perspectives to produce a structured screening report while keeping uncertainty and human-verification requirements visible.

## Review panel

1. Senior Research Scholar — research framing, objectives, and gaps
2. Academic Writing Specialist — clarity, coherence, and scholarly style
3. Originality Analyst — contribution language and attribution signals
4. Technical Domain Expert — methodology and claim calibration
5. Journal Reviewer — publication structure and limitations
6. Quality Assurance — cross-section and citation checks

The current version performs deterministic textual and structural screening in the browser. It does not claim to verify facts, source databases, experimental data, plagiarism, or AI authorship. Formulaic-language findings are revision signals, not an AI-content percentage.

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

## Supported imports

- Paste manuscript text directly
- PDF (`.pdf`, including explicit warnings for image-only files that need OCR)
- Microsoft Word (`.docx`)
- Plain text and Markdown (`.txt`, `.md`, `.markdown`)
- HTML and rich text (`.html`, `.htm`, `.rtf`)
- Delimited text (`.csv`, `.tsv`)

## Supported exports

- PDF and Microsoft Word (`.pdf`, `.docx`)
- Plain text and Markdown (`.txt`, `.md`)
- Standalone HTML (`.html`)
- Structured data (`.json`, `.csv`)

## Responsible authorship support

Scholaris can flag formulaic or generic language and recommend more specific, evidence-grounded writing. It does not label a manuscript as human- or AI-authored, promise to “remove AI content,” or guarantee an AI-detector result. Authors remain responsible for the claims, sources, analysis, and final prose.
