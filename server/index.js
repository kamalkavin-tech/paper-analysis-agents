import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const port = Number(process.env.API_PORT || 4000);
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';

app.disable('x-powered-by');
app.use(cors({ origin: allowedOrigin }));
app.use(express.json({ limit: '2mb' }));

const revisionSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    revisedText: { type: 'string' },
    summary: { type: 'string' },
    changes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          originalExcerpt: { type: 'string' },
          revisedExcerpt: { type: 'string' },
          reason: { type: 'string' },
          reviewRequired: { type: 'boolean' },
        },
        required: ['originalExcerpt', 'revisedExcerpt', 'reason', 'reviewRequired'],
      },
    },
    preservation: {
      type: 'object',
      additionalProperties: false,
      properties: {
        citationsPreserved: { type: 'boolean' },
        numbersPreserved: { type: 'boolean' },
        technicalTermsPreserved: { type: 'boolean' },
        warnings: { type: 'array', items: { type: 'string' } },
      },
      required: ['citationsPreserved', 'numbersPreserved', 'technicalTermsPreserved', 'warnings'],
    },
  },
  required: ['revisedText', 'summary', 'changes', 'preservation'],
};

function extractProtectedTokens(text) {
  return {
    citations: [...text.matchAll(/\[[0-9,;\s–-]+\]|\([A-Z][A-Za-z-]+(?:\s+et al\.)?,?\s+20\d{2}[a-z]?\)/g)].map((match) => match[0]),
    numbers: [...text.matchAll(/\b\d+(?:\.\d+)?%?\b/g)].map((match) => match[0]),
  };
}

function missingTokens(expected, revised) {
  const remaining = [...expected];
  for (const token of revised) {
    const index = remaining.indexOf(token);
    if (index >= 0) remaining.splice(index, 1);
  }
  return remaining;
}

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    modelConfigured: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_MODEL || 'gpt-6-astra',
  });
});

app.post('/api/revise', async (request, response) => {
  if (!process.env.OPENAI_API_KEY) {
    return response.status(503).json({ error: 'OPENAI_API_KEY is not configured on the server.' });
  }

  const manuscript = typeof request.body?.manuscript === 'string' ? request.body.manuscript.trim() : '';
  const authorSample = typeof request.body?.authorSample === 'string' ? request.body.authorSample.trim() : '';
  const instructions = typeof request.body?.instructions === 'string' ? request.body.instructions.trim() : '';

  if (manuscript.length < 120) return response.status(400).json({ error: 'A manuscript of at least 120 characters is required.' });
  if (manuscript.length > 180_000) return response.status(413).json({ error: 'The manuscript is too large for one revision request.' });
  if (authorSample.length < 300) return response.status(400).json({ error: 'Provide at least 300 characters of your own writing for voice calibration.' });
  if (authorSample.length > 25_000) return response.status(413).json({ error: 'The author sample must be under 25,000 characters.' });

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const protectedBefore = extractProtectedTokens(manuscript);
    const model = process.env.OPENAI_MODEL || 'gpt-6-astra';
    const apiResponse = await client.responses.create({
      model,
      reasoning: { effort: 'low' },
      store: false,
      input: [
        {
          role: 'system',
          content: [{
            type: 'input_text',
            text: [
              'You are a cautious academic writing editor. Revise the supplied manuscript into the author’s demonstrated scholarly voice.',
              'Do not optimize for, mention, or attempt to evade AI detectors.',
              'Do not add, remove, or alter citations, numerical values, experimental findings, methods, limitations, or technical claims.',
              'Do not invent evidence, references, author experience, or research contributions.',
              'Preserve section headings and paragraph order. Improve specificity, rhythm, syntax, cohesion, and natural scholarly expression.',
              'When a safe revision is impossible, retain the original wording and add a warning.',
              'Return only the structured response requested by the schema.',
            ].join('\n'),
          }],
        },
        {
          role: 'user',
          content: [{
            type: 'input_text',
            text: [
              'AUTHOR WRITING SAMPLE:',
              authorSample,
              '',
              'ADDITIONAL AUTHOR INSTRUCTIONS:',
              instructions || 'Preserve my established terminology and formal academic tone.',
              '',
              'MANUSCRIPT TO REVISE:',
              manuscript,
            ].join('\n'),
          }],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'academic_revision',
          strict: true,
          schema: revisionSchema,
        },
      },
    });

    const result = JSON.parse(apiResponse.output_text);
    const protectedAfter = extractProtectedTokens(result.revisedText);
    const missingCitations = missingTokens(protectedBefore.citations, protectedAfter.citations);
    const missingNumbers = missingTokens(protectedBefore.numbers, protectedAfter.numbers);
    const serverWarnings = [];
    if (missingCitations.length) serverWarnings.push(`Missing citation tokens: ${missingCitations.slice(0, 10).join(', ')}`);
    if (missingNumbers.length) serverWarnings.push(`Missing numerical tokens: ${missingNumbers.slice(0, 10).join(', ')}`);

    result.preservation.citationsPreserved = missingCitations.length === 0;
    result.preservation.numbersPreserved = missingNumbers.length === 0;
    result.preservation.warnings = [...result.preservation.warnings, ...serverWarnings];
    result.meta = { model, requestId: apiResponse.id };

    return response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The revision request failed.';
    console.error('[revision-error]', message);
    return response.status(500).json({ error: message });
  }
});

app.use((error, _request, response, _next) => {
  if (error instanceof SyntaxError) return response.status(400).json({ error: 'Invalid JSON request.' });
  return response.status(500).json({ error: 'Unexpected server error.' });
});

app.listen(port, () => {
  console.log(`[scholaris-api] listening on http://localhost:${port}`);
  console.log(`[scholaris-api] semantic revision ${process.env.OPENAI_API_KEY ? 'enabled' : 'disabled: set OPENAI_API_KEY'}`);
});
