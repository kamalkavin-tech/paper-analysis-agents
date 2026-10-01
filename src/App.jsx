import { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  Download,
  FileCheck2,
  FileText,
  FlaskConical,
  Highlighter,
  History,
  Languages,
  Library,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  UserRound,
  Users,
  WandSparkles,
  X,
} from 'lucide-react';

const agents = [
  { id: 'scholar', name: 'Senior Research Scholar', short: 'Research framing', icon: FlaskConical, color: 'violet' },
  { id: 'editor', name: 'Academic Writing Specialist', short: 'Clarity & structure', icon: Languages, color: 'blue' },
  { id: 'originality', name: 'Originality Analyst', short: 'Attribution & novelty', icon: Highlighter, color: 'amber' },
  { id: 'domain', name: 'Technical Domain Expert', short: 'Technical consistency', icon: Bot, color: 'cyan' },
  { id: 'reviewer', name: 'Journal Reviewer', short: 'Publication readiness', icon: ClipboardCheck, color: 'rose' },
  { id: 'qa', name: 'Quality Assurance', short: 'Final cross-check', icon: ShieldCheck, color: 'green' },
];

const sectionMatchers = [
  ['Abstract', /(?:^|\n)\s*(?:abstract)\s*[:\n]/i],
  ['Introduction', /(?:^|\n)\s*(?:\d+[.\s]*)?introduction\s*[:\n]/i],
  ['Literature review', /(?:^|\n)\s*(?:\d+[.\s]*)?(?:literature review|related work|background)\s*[:\n]/i],
  ['Methodology', /(?:^|\n)\s*(?:\d+[.\s]*)?(?:methodology|methods|materials and methods)\s*[:\n]/i],
  ['Results', /(?:^|\n)\s*(?:\d+[.\s]*)?(?:results|findings)\s*[:\n]/i],
  ['Discussion', /(?:^|\n)\s*(?:\d+[.\s]*)?discussion\s*[:\n]/i],
  ['Conclusion', /(?:^|\n)\s*(?:\d+[.\s]*)?conclusions?\s*[:\n]/i],
  ['References', /(?:^|\n)\s*(?:references|bibliography)\s*[:\n]/i],
];

const samplePaper = `A Framework for Transparent Multi-Agent Review of Scientific Manuscripts

Abstract
Academic authors increasingly use automated tools during manuscript preparation, yet many systems provide revisions without explaining the scholarly basis for them. This study proposes a transparent multi-agent review framework that separates methodological, editorial, originality, domain, peer-review, and quality-assurance responsibilities. We evaluate the framework using a manually curated set of 60 manuscript excerpts from computer science and public-health research. Compared with a single-pass baseline, the proposed workflow identified 24% more unsupported claims while preserving author intent in 91% of reviewed passages. These findings suggest that role-separated review may improve the traceability of assisted academic editing.

1. Introduction
Research-paper review requires simultaneous attention to scientific validity, clarity, attribution, and publication conventions. Existing writing assistants often combine these tasks in a single response, making it difficult for authors to distinguish factual concerns from stylistic preferences. Prior work has examined automated writing feedback [1, 2], but the effect of explicit reviewer-role separation remains insufficiently characterized. We therefore ask: can a coordinated set of specialist reviewers produce more traceable and actionable manuscript feedback than a single general reviewer?

2. Related Work
Automated feedback systems have been studied in educational and professional writing contexts [1]. Recent language-model applications extend this work to scientific editing and review support [2, 3]. However, published evaluations commonly emphasize aggregate response quality rather than whether each recommendation can be traced to a defined reviewing responsibility. This leaves a practical gap for authors who need to decide whether a proposed change concerns evidence, logic, style, or journal expectations.

3. Methodology
We designed six reviewer roles with non-overlapping primary responsibilities and a final reconciliation stage. Sixty manuscript excerpts were selected using stratified sampling across two fields. Three experienced researchers independently annotated unsupported claims, unclear sentences, missing methodological details, and attribution concerns. Disagreements were resolved through discussion. The multi-agent workflow and a single-pass baseline reviewed the same excerpts. Recall of annotated issues, preservation of intended meaning, and reviewer-rated actionability were the primary outcomes.

4. Results
The role-separated workflow identified 24% more annotated unsupported claims than the baseline. Reviewers judged 91% of its proposed revisions to preserve the source meaning, compared with 86% for the baseline. The largest improvement occurred in methodological-detail detection. No statistically significant difference was observed for grammar correction accuracy.

5. Discussion
The findings indicate that explicit role separation can make automated feedback easier to audit. The study does not establish effectiveness across all disciplines because the evaluation included only two fields and a modest sample. The manual adjudication process may also introduce reviewer bias. Future work should test preregistered evaluation criteria, additional disciplines, and blinded comparison procedures.

6. Conclusion
A transparent multi-agent workflow improved detection of unsupported claims in the evaluated excerpts while maintaining a high rate of meaning preservation. The results support further investigation rather than universal adoption. Larger and independently replicated studies are needed.

References
[1] Author, A. (2022). Automated feedback in academic writing. Journal of Writing Research, 10(2), 100–118.
[2] Author, B., and Author, C. (2023). Language models for scholarly editing. Computing Reviews, 8(1), 20–39.
[3] Author, D. (2024). Evaluating traceability in AI-assisted peer review. Research Methods Quarterly, 4(3), 44–61.`;

const importFormats = [
  { extension: 'pdf', label: 'PDF' },
  { extension: 'docx', label: 'Word' },
  { extension: 'txt', label: 'Text' },
  { extension: 'md', label: 'Markdown' },
  { extension: 'html', label: 'HTML' },
  { extension: 'rtf', label: 'RTF' },
  { extension: 'csv', label: 'CSV / TSV' },
];

const exportFormats = [
  { value: 'pdf', label: 'PDF document' },
  { value: 'docx', label: 'Word document' },
  { value: 'txt', label: 'Plain text' },
  { value: 'md', label: 'Markdown' },
  { value: 'html', label: 'HTML page' },
  { value: 'json', label: 'Structured JSON' },
  { value: 'csv', label: 'CSV table' },
];

function fileExtension(name) {
  return name.toLowerCase().split('.').pop();
}

function htmlToText(source) {
  const document = new DOMParser().parseFromString(source, 'text/html');
  document.querySelectorAll('script, style, nav, noscript').forEach((node) => node.remove());
  return document.body?.innerText || document.body?.textContent || '';
}

function rtfToText(source) {
  return source
    .replace(/\\par[d]?/g, '\n')
    .replace(/\\'[0-9a-fA-F]{2}/g, (code) => String.fromCharCode(Number.parseInt(code.slice(2), 16)))
    .replace(/\\[a-z]+-?\d* ?/gi, '')
    .replace(/[{}]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function extractPdfText(arrayBuffer) {
  const [pdfjs, workerModule] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default;
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(' '));
  }
  return pages.join('\n\n');
}

async function extractManuscript(file) {
  const extension = fileExtension(file.name);
  if (extension === 'pdf') return extractPdfText(await file.arrayBuffer());
  if (extension === 'docx') {
    const mammoth = (await import('mammoth')).default;
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value;
  }
  const source = await file.text();
  if (extension === 'html' || extension === 'htm') return htmlToText(source);
  if (extension === 'rtf') return rtfToText(source);
  if (['txt', 'md', 'markdown', 'csv', 'tsv'].includes(extension)) return source;
  throw new Error('This file type is not supported. Choose PDF, DOCX, TXT, Markdown, HTML, RTF, CSV, or TSV.');
}

function countMatches(text, regex) {
  return (text.match(regex) || []).length;
}

function analyzePaper(text) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+(?:\s|$)/).map((item) => item.trim()).filter(Boolean);
  const avgSentence = sentences.length ? Math.round(words.length / sentences.length) : 0;
  const citations = countMatches(text, /\[[0-9,;\s–-]+\]|\([A-Z][A-Za-z-]+(?:\s+et al\.)?,?\s+20\d{2}[a-z]?\)/g);
  const numbers = countMatches(text, /\b\d+(?:\.\d+)?%?\b/g);
  const hedges = countMatches(text, /\b(?:may|might|suggests?|indicates?|appears?|likely|potentially)\b/gi);
  const strongClaims = countMatches(text, /\b(?:proves?|always|never|guarantees?|undeniably|without doubt|all studies)\b/gi);
  const formulaicSignals = countMatches(text, /\b(?:in today'?s rapidly evolving|it is important to note|it is worth noting|delve into|complex landscape|multifaceted|pivotal role|plays? a crucial role|underscore(?:s|d)? the importance|in the realm of|moreover|furthermore|in conclusion)\b/gi);
  const sections = sectionMatchers.filter(([, regex]) => regex.test(text)).map(([name]) => name);
  const has = (section) => sections.includes(section);
  const score = Math.max(28, Math.min(96,
    36 + sections.length * 5 + Math.min(citations, 10) * 1.2 + (words.length >= 500 ? 8 : words.length >= 250 ? 4 : 0)
    + (has('Methodology') && has('Results') ? 7 : 0) - strongClaims * 2,
  ));

  const findings = {
    scholar: [
      has('Introduction')
        ? { level: 'strength', title: 'Research context is identifiable', detail: 'An introduction is present and provides a basis for evaluating the problem framing.' }
        : { level: 'major', title: 'Research context is not clearly separated', detail: 'Add an Introduction that establishes the problem, gap, objective, and contribution.' },
      /\b(?:gap|insufficient|however|remains|lack of|limited)\b/i.test(text)
        ? { level: 'strength', title: 'A research gap is signalled', detail: 'The manuscript uses explicit gap language; ensure the cited literature substantiates it.' }
        : { level: 'major', title: 'Research gap needs explicit support', detail: 'State what prior work has not resolved and connect that gap to cited evidence.' },
      /\b(?:objective|aim|we (?:propose|investigate|evaluate|examine)|research question)\b/i.test(text)
        ? { level: 'strength', title: 'Study objective is visible', detail: 'The central intent can be located in the manuscript.' }
        : { level: 'minor', title: 'Objective is difficult to locate', detail: 'Add one direct sentence stating the study objective or research question.' },
    ],
    editor: [
      avgSentence <= 27
        ? { level: 'strength', title: 'Sentence length is generally controlled', detail: `The estimated average is ${avgSentence} words per sentence.` }
        : { level: 'minor', title: 'Dense sentence structure', detail: `The estimated average is ${avgSentence} words per sentence; split sentences carrying multiple claims.` },
      countMatches(text, /\b(?:very|really|quite|basically|obviously|clearly)\b/gi) > 2
        ? { level: 'minor', title: 'Imprecise intensifiers detected', detail: 'Replace conversational intensifiers with evidence-based qualification.' }
        : { level: 'strength', title: 'Scholarly register is consistent', detail: 'Few conversational intensifiers were detected.' },
      { level: 'note', title: 'Meaning-preserving edit required', detail: 'Line editing should follow resolution of methodological and evidentiary issues.' },
    ],
    originality: [
      citations >= 3
        ? { level: 'strength', title: 'Source attribution is visible', detail: `${citations} in-text citation markers were detected; each must be checked against the reference list.` }
        : { level: 'major', title: 'Limited attribution signals', detail: `Only ${citations} in-text citation marker${citations === 1 ? '' : 's'} detected. Established claims may require sources.` },
      /\b(?:we propose|this study (?:proposes|introduces|develops)|our contribution|novel)\b/i.test(text)
        ? { level: 'strength', title: 'Contribution language is explicit', detail: 'The manuscript distinguishes a proposed contribution; its novelty still requires literature-based verification.' }
        : { level: 'minor', title: 'Original contribution is not isolated', detail: 'State precisely what the study contributes beyond established knowledge.' },
      formulaicSignals > 2
        ? { level: 'minor', title: 'Formulaic language patterns detected', detail: `${formulaicSignals} common template-like phrase${formulaicSignals === 1 ? '' : 's'} detected. Replace them with specific reasoning grounded in the study; this is not an AI-authorship determination.` }
        : { level: 'strength', title: 'Limited formulaic phrasing', detail: `${formulaicSignals} common template-like phrase${formulaicSignals === 1 ? '' : 's'} detected. This observation cannot establish whether AI was used.` },
      { level: 'note', title: 'Similarity cannot be inferred from prose alone', detail: 'A source-database comparison is required for a defensible similarity assessment.' },
    ],
    domain: [
      has('Methodology')
        ? { level: 'strength', title: 'Methodology section detected', detail: 'The method can be reviewed as a distinct part of the argument.' }
        : { level: 'major', title: 'Methodology is missing or unlabelled', detail: 'Describe design, data, sampling, variables, procedures, and analysis in a reproducible sequence.' },
      numbers >= 4
        ? { level: 'note', title: 'Quantitative claims require verification', detail: `${numbers} numerical expressions were detected. Confirm that each is traceable to data, a table, or a cited source.` }
        : { level: 'minor', title: 'Limited quantitative detail', detail: 'If this is an empirical study, report sample characteristics and outcome measurements explicitly.' },
      strongClaims
        ? { level: 'major', title: 'Overstated technical language', detail: `${strongClaims} absolute claim${strongClaims === 1 ? '' : 's'} detected. Calibrate conclusions to the design and evidence.` }
        : { level: 'strength', title: 'Claims are reasonably calibrated', detail: `${hedges} qualification marker${hedges === 1 ? '' : 's'} detected and no obvious absolute claim language found.` },
    ],
    reviewer: [
      has('Abstract') && has('Conclusion')
        ? { level: 'strength', title: 'Core manuscript framing is complete', detail: 'Abstract and conclusion are both present for cross-section consistency review.' }
        : { level: 'major', title: 'Core publication section missing', detail: 'A submission-ready paper normally requires both an informative abstract and a bounded conclusion.' },
      has('Results') && has('Discussion')
        ? { level: 'strength', title: 'Results and interpretation are separated', detail: 'This supports clearer evaluation of evidence versus interpretation.' }
        : { level: 'major', title: 'Evidence and interpretation need separation', detail: 'Present results before discussing implications, limitations, and comparison with prior work.' },
      /\b(?:limitation|limited|bias|future work|further research)\b/i.test(text)
        ? { level: 'strength', title: 'Limitations are acknowledged', detail: 'The paper signals boundaries on interpretation.' }
        : { level: 'minor', title: 'Limitations are not explicit', detail: 'Add design-specific limitations and explain their effect on generalizability.' },
    ],
    qa: [
      has('References') && citations > 0
        ? { level: 'strength', title: 'Citation cross-check is possible', detail: 'Both in-text markers and a reference section are present; verify one-to-one correspondence manually.' }
        : { level: 'major', title: 'Citation audit is blocked', detail: 'Provide both in-text citations and a complete reference list.' },
      sections.length >= 6
        ? { level: 'strength', title: 'Section coverage is substantial', detail: `${sections.length} standard scholarly sections were identified.` }
        : { level: 'minor', title: 'Section coverage is incomplete', detail: `${sections.length} standard sections were identified; check the target journal’s required structure.` },
      { level: 'note', title: 'Human verification remains required', detail: 'Confirm technical facts, source support, ethics statements, and reported results before submission.' },
    ],
  };

  const issueCount = Object.values(findings).flat().filter((item) => item.level === 'major' || item.level === 'minor').length;
  return {
    title: text.split('\n').map((line) => line.trim()).find((line) => line.length > 12 && line.length < 180) || 'Untitled manuscript',
    words: words.length,
    sentences: sentences.length,
    avgSentence,
    citations,
    formulaicSignals,
    sections,
    score: Math.round(score),
    issueCount,
    findings,
  };
}

function Badge({ level }) {
  const labels = { strength: 'Strength', major: 'Major issue', minor: 'Improve', note: 'Verify' };
  return <span className={`finding-badge ${level}`}>{labels[level]}</span>;
}

function AgentAvatar({ agent, size = 'normal' }) {
  const Icon = agent.icon;
  return <span className={`agent-avatar ${agent.color} ${size}`}><Icon size={size === 'small' ? 15 : 18} /></span>;
}

function EmptyWorkspace({ text, setText, onAnalyze, onUpload, fileName, importError, importing }) {
  const fileInput = useRef(null);
  return (
    <main className="workspace empty-workspace">
      <section className="welcome-panel">
        <div className="eyebrow"><Sparkles size={15} /> Coordinated academic intelligence</div>
        <h1>Review the research,<br /><em>not just the writing.</em></h1>
        <p className="welcome-copy">Six specialist perspectives examine your manuscript as one coordinated review—without inventing evidence, citations, or results.</p>

        <div className="input-card">
          <div className="input-card-top">
            <div>
              <span className="step-number">01</span>
              <strong>Add your manuscript</strong>
            </div>
            <button className="sample-button" onClick={() => setText(samplePaper)}><WandSparkles size={15} /> Use sample paper</button>
          </div>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Paste your title, abstract, or full manuscript here…"
            aria-label="Research paper text"
          />
          <div className="input-actions">
            <button className="upload-button" onClick={() => fileInput.current?.click()}>
              <Upload size={17} /> {importing ? 'Extracting document…' : fileName || 'Import manuscript'}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept=".pdf,.docx,.txt,.md,.markdown,.html,.htm,.rtf,.csv,.tsv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,text/html,text/rtf,text/csv,text/tab-separated-values"
              hidden
              onChange={onUpload}
            />
            <span className="word-count">{text.trim() ? text.trim().split(/\s+/).length.toLocaleString() : 0} words</span>
            <button className="analyze-button" disabled={text.trim().length < 120 || importing} onClick={onAnalyze}>
              Begin structured review <ArrowRight size={17} />
            </button>
          </div>
        </div>

        <div className="format-support" aria-label="Supported import formats">
          <span>Import</span>
          {importFormats.map((format) => <i key={format.extension}>{format.label}</i>)}
        </div>
        {importError && <div className="import-error"><AlertTriangle size={16} /> {importError}</div>}

        <div className="agent-strip">
          <div className="agent-strip-label"><Users size={16} /> Your review panel</div>
          {agents.map((agent, index) => (
            <div className="mini-agent" key={agent.id} title={agent.name}>
              <AgentAvatar agent={agent} size="small" />
              <span>{String(index + 1).padStart(2, '0')}</span>
            </div>
          ))}
        </div>
      </section>
      <aside className="principles-card">
        <div className="principles-art">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="center-mark"><BookOpen size={27} /></div>
          {agents.slice(0, 4).map((agent, index) => <span key={agent.id} className={`orbit-dot dot-${index + 1}`} />)}
        </div>
        <p className="principles-kicker">Review protocol</p>
        <h2>Evidence before edits.</h2>
        <ul>
          <li><Check size={15} /> Analysis precedes rewriting</li>
          <li><Check size={15} /> Findings stay attributable</li>
          <li><Check size={15} /> Author intent is preserved</li>
          <li><Check size={15} /> Uncertainty remains visible</li>
        </ul>
        <div className="protocol-note"><ShieldCheck size={17} /> No fabricated sources or findings</div>
      </aside>
    </main>
  );
}

function LoadingReview({ activeStep }) {
  return (
    <main className="loading-workspace">
      <div className="loading-orb"><Sparkles size={28} /></div>
      <p className="eyebrow plain">Coordinated review in progress</p>
      <h1>Building the scholarly assessment</h1>
      <p>Each specialist reviews the same manuscript through a distinct academic lens.</p>
      <div className="loading-agents">
        {agents.map((agent, index) => {
          const state = index < activeStep ? 'done' : index === activeStep ? 'active' : 'waiting';
          return (
            <div className={`loading-agent ${state}`} key={agent.id}>
              <AgentAvatar agent={agent} />
              <div><strong>{agent.name}</strong><span>{state === 'done' ? 'Review complete' : state === 'active' ? 'Evaluating manuscript…' : 'Queued'}</span></div>
              {state === 'done' ? <CheckCircle2 size={19} /> : <span className="status-dot" />}
            </div>
          );
        })}
      </div>
    </main>
  );
}

function Report({ report, onNewReview }) {
  const [selected, setSelected] = useState('scholar');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exporting, setExporting] = useState(false);
  const activeAgent = agents.find((agent) => agent.id === selected);
  const findings = report.findings[selected];

  const reviewLines = () => [
      'SCHOLARIS STRUCTURED REVIEW',
      report.title,
      `Overall readiness indicator: ${report.score}/100`,
      `Words: ${report.words} | Citations detected: ${report.citations} | Sections: ${report.sections.join(', ') || 'None detected'}`,
      '',
      ...agents.flatMap((agent) => [
        agent.name.toUpperCase(),
        ...report.findings[agent.id].map((finding) => `- [${finding.level.toUpperCase()}] ${finding.title}: ${finding.detail}`),
        '',
      ]),
      'Important: This computational review is a screening aid. Verify all facts, citations, technical claims, and results before submission.',
    ];

  const structuredReview = () => ({
    generatedBy: 'Scholaris Review Protocol v1.0',
    manuscript: {
      title: report.title,
      words: report.words,
      sentences: report.sentences,
      averageSentenceWords: report.avgSentence,
      citationMarkers: report.citations,
      formulaicLanguageSignals: report.formulaicSignals,
      sectionsDetected: report.sections,
    },
    readinessIndicator: report.score,
    actionItemCount: report.issueCount,
    assessments: agents.map((agent) => ({
      agent: agent.name,
      focus: agent.short,
      findings: report.findings[agent.id],
    })),
    disclaimer: 'This computational review is a screening aid. Verify all facts, citations, technical claims, and results before submission.',
  });

  const downloadBlob = (blob, extension) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scholaris-review.${extension}`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const exportReview = async () => {
    setExporting(true);
    try {
      const data = structuredReview();
      const textReport = reviewLines().join('\n');

      if (exportFormat === 'txt') {
        downloadBlob(new Blob([textReport], { type: 'text/plain;charset=utf-8' }), 'txt');
      } else if (exportFormat === 'json') {
        downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' }), 'json');
      } else if (exportFormat === 'md') {
        const markdown = [
          '# Scholaris Structured Review',
          `## ${report.title}`,
          `**Readiness indicator:** ${report.score}/100  `,
          `**Words:** ${report.words} · **Citation markers:** ${report.citations} · **Sections:** ${report.sections.join(', ') || 'None detected'}`,
          '',
          ...agents.flatMap((agent) => [
            `## ${agent.name}`,
            ...report.findings[agent.id].map((finding) => `- **${finding.level.toUpperCase()} — ${finding.title}:** ${finding.detail}`),
            '',
          ]),
          '> **Verification notice:** This computational review is a screening aid. Verify all facts, citations, technical claims, and results before submission.',
        ].join('\n');
        downloadBlob(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }), 'md');
      } else if (exportFormat === 'csv') {
        const escapeCsv = (value) => `"${String(value).replaceAll('"', '""')}"`;
        const rows = [['Agent', 'Focus', 'Level', 'Finding', 'Detail']];
        agents.forEach((agent) => report.findings[agent.id].forEach((finding) => {
          rows.push([agent.name, agent.short, finding.level, finding.title, finding.detail]);
        }));
        downloadBlob(new Blob([rows.map((row) => row.map(escapeCsv).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' }), 'csv');
      } else if (exportFormat === 'html') {
        const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]);
        const sections = agents.map((agent) => `<section><h2>${escapeHtml(agent.name)}</h2><p class="focus">${escapeHtml(agent.short)}</p><ul>${report.findings[agent.id].map((finding) => `<li><strong>${escapeHtml(finding.level.toUpperCase())} — ${escapeHtml(finding.title)}</strong><p>${escapeHtml(finding.detail)}</p></li>`).join('')}</ul></section>`).join('');
        const html = `<!doctype html><html><head><meta charset="utf-8"><title>Scholaris Review</title><style>body{max-width:850px;margin:48px auto;padding:0 28px;color:#20211e;font:16px/1.6 Georgia,serif}h1{font-size:34px}h2{margin-top:34px;border-bottom:1px solid #ddd;padding-bottom:8px}.meta,.focus{color:#666}.notice{margin-top:40px;padding:16px;background:#f4edda;border-left:4px solid #b68a25}li{margin:14px 0}li p{margin:3px 0}</style></head><body><p>Scholaris Structured Review</p><h1>${escapeHtml(report.title)}</h1><p class="meta">Readiness indicator: ${report.score}/100 · Words: ${report.words} · Citation markers: ${report.citations}</p>${sections}<p class="notice"><strong>Verification notice:</strong> ${escapeHtml(data.disclaimer)}</p></body></html>`;
        downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), 'html');
      } else if (exportFormat === 'docx') {
        const { Document: DocxDocument, HeadingLevel, Packer, Paragraph, TextRun } = await import('docx');
        const children = [
          new Paragraph({ text: 'SCHOLARIS STRUCTURED REVIEW', heading: HeadingLevel.TITLE }),
          new Paragraph({ text: report.title, heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ children: [new TextRun({ text: `Readiness indicator: ${report.score}/100`, bold: true })] }),
          new Paragraph(`Words: ${report.words} | Citation markers: ${report.citations} | Sections: ${report.sections.join(', ') || 'None detected'}`),
        ];
        agents.forEach((agent) => {
          children.push(new Paragraph({ text: agent.name, heading: HeadingLevel.HEADING_2 }));
          report.findings[agent.id].forEach((finding) => children.push(new Paragraph({
            bullet: { level: 0 },
            children: [new TextRun({ text: `${finding.level.toUpperCase()} — ${finding.title}: `, bold: true }), new TextRun(finding.detail)],
          })));
        });
        children.push(new Paragraph({ children: [new TextRun({ text: `Verification notice: ${data.disclaimer}`, italics: true })] }));
        const document = new DocxDocument({ sections: [{ properties: {}, children }] });
        downloadBlob(await Packer.toBlob(document), 'docx');
      } else if (exportFormat === 'pdf') {
        const { jsPDF } = await import('jspdf');
        const document = new jsPDF({ unit: 'pt', format: 'a4' });
        const margin = 52;
        const pageHeight = document.internal.pageSize.getHeight();
        let y = 58;
        const addLines = (content, size = 10, bold = false, gap = 5) => {
          document.setFont('helvetica', bold ? 'bold' : 'normal');
          document.setFontSize(size);
          const lines = document.splitTextToSize(content, document.internal.pageSize.getWidth() - margin * 2);
          lines.forEach((line) => {
            if (y > pageHeight - 52) { document.addPage(); y = 52; }
            document.text(line, margin, y);
            y += size + gap;
          });
        };
        addLines('SCHOLARIS STRUCTURED REVIEW', 9, true, 7);
        addLines(report.title, 18, true, 8);
        addLines(`Readiness indicator: ${report.score}/100 | Words: ${report.words} | Citation markers: ${report.citations}`, 9, false, 14);
        agents.forEach((agent) => {
          addLines(agent.name, 13, true, 7);
          report.findings[agent.id].forEach((finding) => addLines(`${finding.level.toUpperCase()} — ${finding.title}: ${finding.detail}`, 9, false, 5));
          y += 8;
        });
        addLines(`Verification notice: ${data.disclaimer}`, 9, true, 5);
        document.save('scholaris-review.pdf');
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <main className="report-workspace">
      <section className="report-header">
        <div>
          <div className="eyebrow"><CheckCircle2 size={15} /> Review complete</div>
          <h1>{report.title}</h1>
          <p>{report.words.toLocaleString()} words · {report.sections.length} sections · {report.citations} citation markers</p>
        </div>
        <div className="report-actions">
          <button className="secondary-button" onClick={onNewReview}><Plus size={16} /> New review</button>
          <div className="export-control">
            <select value={exportFormat} onChange={(event) => setExportFormat(event.target.value)} aria-label="Export format">
              {exportFormats.map((format) => <option value={format.value} key={format.value}>{format.label}</option>)}
            </select>
            <button className="export-button" disabled={exporting} onClick={exportReview}><Download size={16} /> {exporting ? 'Preparing…' : 'Export'}</button>
          </div>
        </div>
      </section>

      <section className="metrics-grid">
        <div className="score-card">
          <div className="score-ring" style={{ '--score': `${report.score * 3.6}deg` }}><span>{report.score}</span><small>/100</small></div>
          <div><span className="metric-label">Readiness indicator</span><strong>{report.score >= 80 ? 'Strong foundation' : report.score >= 62 ? 'Revision recommended' : 'Substantial revision'}</strong><p>Structural screening, not a journal decision</p></div>
        </div>
        <div className="metric-card"><FileCheck2 size={21} /><span>Sections found</span><strong>{report.sections.length}<small> / 8</small></strong></div>
        <div className="metric-card"><MessageSquareText size={21} /><span>Action items</span><strong>{report.issueCount}</strong></div>
        <div className="metric-card"><Library size={21} /><span>Citation markers</span><strong>{report.citations}</strong></div>
      </section>

      <section className="review-layout">
        <aside className="agent-nav">
          <p>Specialist assessments</p>
          {agents.map((agent) => (
            <button className={selected === agent.id ? 'selected' : ''} key={agent.id} onClick={() => setSelected(agent.id)}>
              <AgentAvatar agent={agent} size="small" />
              <span><strong>{agent.name}</strong><small>{agent.short}</small></span>
              {selected === agent.id && <ArrowRight size={15} />}
            </button>
          ))}
          <div className="coverage-block">
            <span>Detected structure</span>
            <div>{sectionMatchers.map(([name]) => <i key={name} className={report.sections.includes(name) ? 'found' : ''} title={name} />)}</div>
            <small>{report.sections.join(' · ') || 'No standard headings found'}</small>
          </div>
        </aside>

        <article className="findings-panel">
          <div className="authorship-guidance">
            <Highlighter size={18} />
            <div><strong>Authorship guidance</strong><span>{report.formulaicSignals} formulaic-language signal{report.formulaicSignals === 1 ? '' : 's'} found. This is a writing-pattern check—not an AI detector or authorship verdict.</span></div>
          </div>
          <div className="findings-heading">
            <AgentAvatar agent={activeAgent} />
            <div><span>Agent assessment</span><h2>{activeAgent.name}</h2></div>
            <span className="complete-pill"><Check size={13} /> Complete</span>
          </div>
          <p className="findings-intro">Evidence-based observations from the {activeAgent.short.toLowerCase()} review. Resolve major concerns before line-level polishing.</p>
          <div className="findings-list">
            {findings.map((finding, index) => (
              <div className={`finding-row ${finding.level}`} key={`${finding.title}-${index}`}>
                <div className="finding-index">{String(index + 1).padStart(2, '0')}</div>
                <div><div className="finding-title"><h3>{finding.title}</h3><Badge level={finding.level} /></div><p>{finding.detail}</p></div>
              </div>
            ))}
          </div>
          <div className="review-caution"><CircleHelp size={19} /><div><strong>Scholarly verification required</strong><span>This review detects textual and structural signals. It does not verify source databases, raw data, statistical calculations, ethics approval, or technical truth.</span></div></div>
        </article>
      </section>
    </main>
  );
}

function App() {
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [importError, setImportError] = useState('');
  const [importing, setImporting] = useState(false);
  const [view, setView] = useState('new');
  const [activeStep, setActiveStep] = useState(0);
  const [report, setReport] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const wordCount = useMemo(() => text.trim().split(/\s+/).filter(Boolean).length, [text]);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportError('');
    setImporting(true);
    try {
      const extracted = (await extractManuscript(file)).trim();
      if (extracted.length < 120) {
        throw new Error(fileExtension(file.name) === 'pdf'
          ? 'Very little text could be extracted. This may be an image-only PDF that requires OCR.'
          : 'The document contains too little extractable text for a structured review.');
      }
      setFileName(file.name);
      setText(extracted);
    } catch (error) {
      setFileName('');
      setImportError(error instanceof Error ? error.message : 'The document could not be imported.');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const handleAnalyze = () => {
    if (text.trim().length < 120) return;
    setView('loading');
    setActiveStep(0);
    agents.forEach((_, index) => {
      window.setTimeout(() => setActiveStep(index + 1), 420 * (index + 1));
    });
    window.setTimeout(() => {
      setReport(analyzePaper(text));
      setView('report');
    }, 420 * (agents.length + 1));
  };

  const newReview = () => {
    setText('');
    setFileName('');
    setImportError('');
    setReport(null);
    setView('new');
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand"><span className="brand-mark"><BookOpen size={21} /></span><span>Scholaris<small>Research review</small></span><button className="close-sidebar" onClick={() => setSidebarOpen(false)}><X size={18} /></button></div>
        <nav>
          <p>Workspace</p>
          <button className="active" onClick={newReview}><Sparkles size={18} /> New analysis</button>
          <button><History size={18} /> Review history <span className="soon">Soon</span></button>
          <button><FileText size={18} /> Manuscripts <span className="soon">Soon</span></button>
          <p>Research tools</p>
          <button><Search size={18} /> Literature check <span className="soon">Soon</span></button>
          <button><BarChart3 size={18} /> Evidence map <span className="soon">Soon</span></button>
          <button><Target size={18} /> Journal fit <span className="soon">Soon</span></button>
        </nav>
        <div className="sidebar-bottom">
          <div className="ethics-note"><ShieldCheck size={18} /><div><strong>Integrity protocol</strong><span>No invented evidence</span></div></div>
          <button><Settings size={18} /> Settings</button>
          <div className="profile"><span>KR</span><div><strong>Research workspace</strong><small>Local session</small></div><MoreHorizontal size={17} /></div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button className="menu-button" onClick={() => setSidebarOpen(true)}><Menu size={19} /></button>
          <div className="breadcrumb"><span>Workspace</span><i>/</i><strong>{view === 'report' ? 'Structured review' : 'New analysis'}</strong></div>
          <div className="topbar-right">
            {wordCount > 0 && view !== 'report' && <span className="draft-status"><FileText size={15} /> {wordCount.toLocaleString()} words</span>}
            <button className="help-button"><CircleHelp size={18} /> <span>Review guide</span></button>
            <button className="avatar-button"><UserRound size={17} /></button>
          </div>
        </header>

        {view === 'new' && <EmptyWorkspace text={text} setText={setText} onAnalyze={handleAnalyze} onUpload={handleUpload} fileName={fileName} importError={importError} importing={importing} />}
        {view === 'loading' && <LoadingReview activeStep={activeStep} />}
        {view === 'report' && report && <Report report={report} onNewReview={newReview} />}
        <footer><span>Scholaris Review Protocol v1.0</span><span>Human verification is required before publication.</span></footer>
      </div>
    </div>
  );
}

export default App;
