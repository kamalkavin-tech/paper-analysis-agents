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

The frontend runs on `http://localhost:3000` and the API runs on `http://localhost:4000`.

### Enable semantic revision

Copy the environment template and add a server-side OpenAI API key:

```bash
copy .env.example .env
npm run dev
```

Then set `OPENAI_API_KEY` in `.env`. Never add the key to frontend code or use a `VITE_` prefix.

Without an API key, local structural analysis, rule-based revision, imports, and exports continue to work. Author-voice semantic revision remains disabled and the interface explains how to enable it.

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

The authorship-pattern review provides:

- A clearly labelled formulaic-writing indicator (not an AI-authorship percentage)
- The number and percentage of manuscript words inside flagged passages
- Exact sentences and triggering words or phrases
- A reason for every flag, including generic framing, inflated wording, dense sentences, and unattributed generalizations
- Passage-level suggested revisions
- An editable full-manuscript revision studio
- A live original-versus-revised comparison that recalculates while the author edits
- Complementary AI-pattern and natural-style heuristics, explicitly labelled as non-authorship estimates
- Copy, TXT, and Word export for the assisted revision draft

## Model-backed author-voice revision

When configured, the local API uses the OpenAI Responses API with Structured Outputs to:

- Calibrate revisions from an original author-writing sample
- Return a complete revised manuscript plus documented changes
- Preserve section order and technical terminology
- Refuse to invent sources, findings, methods, or contributions
- Compare citation and numerical tokens before returning the result
- Require the author to load and approve the generated revision before export

The revision workflow simplifies configured formulaic phrases while preserving the manuscript for author review. It does not invent personal experience, new evidence, citations, technical details, or experimental findings to make text appear human-authored.

Third-party AI detectors can produce materially different scores for the same text and can even assign a higher score after ordinary editing. Scholaris therefore does not optimize for or promise a result from ZeroGPT or another detector. Its live comparison uses one consistent, inspectable set of textual rules so authors can see why the local score changes.
