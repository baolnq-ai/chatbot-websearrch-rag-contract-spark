import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = path.dirname(fileURLToPath(import.meta.url));
const publicBase = process.env.PUBLIC_BASE_URL || 'http://localhost:6101';
const backendBase = process.env.BACKEND_DIRECT_URL || 'http://localhost:6102';
const parseBase = process.env.PARSE_DIRECT_URL || 'http://localhost:6104';
const embeddingBase = process.env.EMBEDDING_DIRECT_URL || 'http://localhost:6105';
const vllmBase = process.env.VLLM_DIRECT_URL || 'http://localhost:6106';
const email = process.env.ROOT_EMAIL || 'admin@example.com';
const password = process.env.ROOT_PASSWORD || '';

let cookieHeader = '';
const results = [];

function sanitizeBody(value) {
  if (value == null) return '';
  const raw = typeof value === 'string' ? value : JSON.stringify(value);
  return raw
    .replace(/access_token=[^;"]+/gi, 'access_token=[redacted]')
    .replace(/"token"\s*:\s*"[^"]+"/gi, '"token":"[redacted]"')
    .replace(/"password"\s*:\s*"[^"]+"/gi, '"password":"[redacted]"')
    .slice(0, 500);
}

async function call(name, method, url, options = {}) {
  const started = Date.now();
  const headers = { ...(options.headers || {}) };
  if (cookieHeader && options.auth !== false) headers.cookie = cookieHeader;
  let status = 0;
  let body = '';
  let ok = false;
  let note = '';

  try {
    const res = await fetch(url, { ...options, method, headers });
    status = res.status;
    const setCookie = res.headers.getSetCookie?.() || [];
    if (setCookie.length) {
      cookieHeader = setCookie.map((item) => item.split(';')[0]).join('; ');
    }
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = sanitizeBody(await res.json());
    } else {
      body = sanitizeBody(await res.text());
    }
    ok = options.expect ? options.expect(status, body) : status >= 200 && status < 300;
    note = ok ? 'PASS' : `FAIL status=${status}`;
  } catch (error) {
    note = `ERROR ${error.message}`;
  }

  results.push({
    name,
    method,
    url: url.replace(password, '[redacted]'),
    status,
    duration_ms: Date.now() - started,
    result: note,
    body_preview: body,
  });
}

await call('Public frontend home qua nginx', 'GET', `${publicBase}/`, { auth: false });
await call('Signin page qua nginx', 'GET', `${publicBase}/signin`, { auth: false });
await call('Signup page qua nginx', 'GET', `${publicBase}/signup`, { auth: false });
await call('Forgot password page qua nginx', 'GET', `${publicBase}/forgot-password`, { auth: false });
await call('Backend Swagger docs', 'GET', `${backendBase}/docs`, { auth: false });
await call('Parse-data Swagger docs', 'GET', `${parseBase}/docs`, { auth: false });
await call('Embedding Swagger docs', 'GET', `${embeddingBase}/docs`, { auth: false });
await call('vLLM models', 'GET', `${vllmBase}/v1/models`, {
  auth: false,
  expect: (status, body) => status === 200 && body.includes('gemma'),
});
await call('vLLM chat completion ngắn', 'POST', `${vllmBase}/v1/chat/completions`, {
  auth: false,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    model: process.env.VLLM_MODEL_NAME || 'google/gemma-4-E4B-it',
    messages: [{ role: 'user', content: 'Reply with exactly: PASS' }],
    max_tokens: 8,
    temperature: 0,
  }),
  expect: (status, body) => status === 200 && body.includes('choices'),
});

await call('Login root account', 'POST', `${publicBase}/api/v1/auth/login`, {
  auth: false,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email, password }),
  expect: (status, body) => status === 200 && body.includes('account'),
});
await call('Auth me bằng cookie httponly', 'GET', `${publicBase}/api/v1/auth/me`, {
  expect: (status, body) => status === 200 && body.includes(email),
});
await call('RAG check endpoint', 'GET', `${publicBase}/api/v1/rags/check`);
await call('RAG models endpoint', 'GET', `${publicBase}/api/v1/rags/models`);
await call('RAG SSE trả lời ngắn', 'POST', `${publicBase}/api/v1/rags/rag-contract-fast`, {
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    session_id: -1,
    user_input: 'Trả lời đúng một từ: PASS',
    model_name: process.env.VLLM_MODEL_NAME || 'google/gemma-4-E4B-it',
    is_api: false,
    file_paths: [],
    query_flow: 'fast',
    web_urls: [],
    web_mode: 'open_web',
  }),
  expect: (status, body) => status === 200 && body.includes('data:'),
});
await call('RAG sessions list', 'GET', `${publicBase}/api/v1/rags/sesion`);
await call('RAG files list', 'GET', `${publicBase}/api/v1/rags/file`);
await call('Contract templates list', 'GET', `${publicBase}/api/v1/contracts/load-template`);
await call('Contract outputs list', 'GET', `${publicBase}/api/v1/contracts/load-contract`);
await call('Admin mail settings', 'GET', `${publicBase}/api/v1/admin/settings/mail`);
await call('Admin prompt features', 'GET', `${publicBase}/api/v1/admin/settings/prompt-features`);
await call('Admin prompts', 'GET', `${publicBase}/api/v1/admin/settings/prompts`);
await call('Admin LLM providers', 'GET', `${publicBase}/api/v1/admin/settings/llm-providers`);
await call('Admin web source rules', 'GET', `${publicBase}/api/v1/admin/settings/web-sources`);
await call('Admin analytics', 'GET', `${publicBase}/api/v1/analytics/admin`);
await call('User analytics', 'GET', `${publicBase}/api/v1/analytics/me`);
await call('System metrics', 'GET', `${publicBase}/api/v1/analytics/system-metrics`);

const failed = results.filter((item) => !item.result.startsWith('PASS'));
const summary = {
  generated_at: new Date().toISOString(),
  public_base: publicBase,
  backend_base: backendBase,
  parse_base: parseBase,
  embedding_base: embeddingBase,
  vllm_base: vllmBase,
  total: results.length,
  passed: results.length - failed.length,
  failed: failed.length,
  results,
};

const rowHtml = results.map((item) => `
  <tr class="${item.result.startsWith('PASS') ? 'pass' : 'fail'}">
    <td>${item.result.startsWith('PASS') ? 'PASS' : 'FAIL'}</td>
    <td>${item.name}</td>
    <td>${item.method}</td>
    <td>${item.status}</td>
    <td>${item.duration_ms}ms</td>
    <td><code>${item.url}</code></td>
    <td><pre>${item.body_preview.replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch])}</pre></td>
  </tr>`).join('');

const html = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>API smoke evidence 2026-05-27</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #14213d; background: #f8fafc; }
    h1 { margin-bottom: 4px; }
    .summary { display: flex; gap: 12px; margin: 16px 0; }
    .box { padding: 12px 16px; border: 1px solid #cbd5e1; background: #fff; border-radius: 6px; }
    table { width: 100%; border-collapse: collapse; background: #fff; }
    th, td { padding: 8px; border: 1px solid #cbd5e1; vertical-align: top; font-size: 13px; }
    th { background: #e2e8f0; text-align: left; }
    tr.pass td:first-child { color: #047857; font-weight: 700; }
    tr.fail td:first-child { color: #b91c1c; font-weight: 700; }
    pre { white-space: pre-wrap; word-break: break-word; max-width: 420px; margin: 0; }
  </style>
</head>
<body>
  <h1>API smoke evidence</h1>
  <p>Public entrypoint: <code>${publicBase}</code>. Port policy: <code>6100-6150</code>.</p>
  <div class="summary">
    <div class="box">Total: <strong>${summary.total}</strong></div>
    <div class="box">Passed: <strong>${summary.passed}</strong></div>
    <div class="box">Failed: <strong>${summary.failed}</strong></div>
  </div>
  <table>
    <thead><tr><th>Result</th><th>Check</th><th>Method</th><th>Status</th><th>Time</th><th>URL</th><th>Output preview</th></tr></thead>
    <tbody>${rowHtml}</tbody>
  </table>
</body>
</html>`;

await fs.writeFile(path.join(outDir, 'api-smoke-results.json'), JSON.stringify(summary, null, 2));
await fs.writeFile(path.join(outDir, 'api-smoke-report.html'), html);

console.log(JSON.stringify({ total: summary.total, passed: summary.passed, failed: summary.failed }, null, 2));
if (failed.length) process.exit(1);
