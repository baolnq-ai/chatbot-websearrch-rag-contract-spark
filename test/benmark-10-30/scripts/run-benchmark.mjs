import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const benchRoot = path.resolve(scriptDir, '..');
const dataDir = path.join(benchRoot, 'data');
const resultsDir = path.join(benchRoot, 'results');

const publicBase = process.env.PUBLIC_BASE_URL || 'http://localhost:6101';
const embeddingBase = process.env.EMBEDDING_DIRECT_URL || 'http://localhost:6105';
const vllmBase = process.env.VLLM_DIRECT_URL || 'http://localhost:6106';
const email = process.env.ROOT_EMAIL || 'admin@example.com';
const password = process.env.ROOT_PASSWORD || '';
const modelName = process.env.VLLM_MODEL_NAME || 'google/gemma-4-E4B-it';
const timeoutMs = Number(process.env.BENCHMARK_TIMEOUT_MS || 240000);

let cookieHeader = '';
const results = [];
const summary = {
  started_at: new Date().toISOString(),
  public_base: publicBase,
  embedding_base: embeddingBase,
  vllm_base: vllmBase,
  model_name: modelName,
  upload: null,
  embedding: null,
  rerank: null,
};

function nowMs() {
  return Number(process.hrtime.bigint() / 1000000n);
}

function sanitize(value) {
  return String(value ?? '')
    .replace(/access_token=[^;"\s]+/gi, 'access_token=[redacted]')
    .replace(/"token"\s*:\s*"[^"]+"/gi, '"token":"[redacted]"')
    .replace(password, '[redacted]');
}

function compactText(value, max = 900) {
  return sanitize(value).replace(/\s+/g, ' ').trim().slice(0, max);
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function timedJson(name, group, method, url, options = {}) {
  const started = nowMs();
  const headers = { ...(options.headers || {}) };
  if (cookieHeader && options.auth !== false) headers.cookie = cookieHeader;
  let status = 0;
  let ok = false;
  let body = null;
  let answer = '';
  let error = '';

  try {
    const res = await fetchWithTimeout(url, { ...options, method, headers });
    status = res.status;
    const setCookie = res.headers.getSetCookie?.() || [];
    if (setCookie.length) cookieHeader = setCookie.map((item) => item.split(';')[0]).join('; ');
    const contentType = res.headers.get('content-type') || '';
    body = contentType.includes('application/json') ? await res.json() : await res.text();
    answer = compactText(typeof body === 'string' ? body : JSON.stringify(body));
    ok = options.expect ? options.expect(status, body) : status >= 200 && status < 300;
  } catch (err) {
    error = err.name === 'AbortError' ? 'timeout' : err.message;
  }

  const latencyMs = nowMs() - started;
  const row = {
    name,
    group,
    method,
    url,
    status,
    ok,
    latency_ms: latencyMs,
    output_tokens: body?.usage?.completion_tokens ?? null,
    total_tokens: body?.usage?.total_tokens ?? null,
    tokens_per_second: body?.usage?.completion_tokens ? Number((body.usage.completion_tokens / (latencyMs / 1000)).toFixed(2)) : null,
    question: options.question || '',
    answer,
    error,
  };
  results.push(row);
  return { row, body };
}

function parseSse(text) {
  const events = [];
  for (const line of String(text || '').split(/\r?\n/)) {
    if (!line.startsWith('data:')) continue;
    const raw = line.slice(5).trim();
    if (!raw) continue;
    try {
      events.push(JSON.parse(raw));
    } catch {
      events.push({ mess: raw });
    }
  }
  const answer = events
    .map((event) => event.mess || event.message || event.title || '')
    .filter(Boolean)
    .join(' ')
    .trim();
  const final = [...events].reverse().find((event) => event.end === true) || events.at(-1) || {};
  return { events, answer, final };
}

async function timedSse(name, group, url, payload) {
  const started = nowMs();
  let status = 0;
  let ok = false;
  let answer = '';
  let error = '';
  let final = {};
  let events = [];

  try {
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        cookie: cookieHeader,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
      timeoutMs,
    });
    status = res.status;
    const text = await res.text();
    ({ events, answer, final } = parseSse(text));
    ok = status === 200 && events.length > 0 && !/lỗi|error/i.test(final.title || '');
  } catch (err) {
    error = err.name === 'AbortError' ? 'timeout' : err.message;
  }

  const latencyMs = nowMs() - started;
  const estimatedTokens = Math.max(1, Math.round((answer || '').length / 4));
  const row = {
    name,
    group,
    method: 'POST',
    url,
    status,
    ok,
    latency_ms: latencyMs,
    output_tokens: null,
    total_tokens: null,
    tokens_per_second: Number((estimatedTokens / (latencyMs / 1000)).toFixed(2)),
    question: payload.user_input,
    answer: compactText(answer || JSON.stringify(final)),
    event_count: events.length,
    final_title: final.title || '',
    download_url: final.download_url || '',
    error,
  };
  results.push(row);
  return row;
}

async function ensureBenchmarkData() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(resultsDir, { recursive: true });
  const csvPath = path.join(dataDir, 'ntc-benchmark-policy.csv');
  const csv = [
    'section,key,value',
    'support_hours,weekday,08:00-18:00',
    'support_hours,saturday,09:00-12:00',
    'sla,p1_response_minutes,15',
    'sla,p2_response_minutes,60',
    'sla,p3_response_minutes,240',
    'contract,default_payment_term,30 ngày sau nghiệm thu',
    'contract,late_penalty,0.05% mỗi ngày nhưng không quá 8% giá trị hợp đồng',
    'security,upload_limit_mb,10',
    'security,allowed_ports,6100-6150',
    'operations,vllm_default_gpu_util,0.30',
    'operations,vllm_context_window,8192',
  ].join('\n');
  await fs.writeFile(csvPath, csv);
  return csvPath;
}

async function uploadRagFile(csvPath) {
  const started = nowMs();
  const form = new FormData();
  form.append('session_id', '0');
  const bytes = await fs.readFile(csvPath);
  form.append('files', new Blob([bytes], { type: 'text/csv' }), path.basename(csvPath));
  const res = await fetchWithTimeout(`${publicBase}/api/v1/rags/rag-upload`, {
    method: 'POST',
    headers: { cookie: cookieHeader },
    body: form,
    timeoutMs,
  });
  const body = await res.json().catch(async () => ({ raw: await res.text() }));
  const latencyMs = nowMs() - started;
  summary.upload = {
    file: path.basename(csvPath),
    status: res.status,
    ok:
      res.status === 200 &&
      (body?.status === 200 ||
        body?.status === 'service upload complete' ||
        Number(body?.processed_files || 0) > 0),
    latency_ms: latencyMs,
    response: compactText(JSON.stringify(body), 1200),
  };
}

async function measureEmbedding() {
  const texts = [
    'SLA P1 phản hồi trong 15 phút.',
    'Port local chuẩn của dự án là 6100-6150.',
    'Điều khoản thanh toán mặc định là 30 ngày sau nghiệm thu.',
  ];
  const { row, body } = await timedJson('Embedding 3 đoạn benchmark', 'embedding', 'POST', `${embeddingBase}/api/v1/embed`, {
    auth: false,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ texts }),
    expect: (status, value) => status === 200 && value?.status === 200 && Array.isArray(value?.result),
  });
  summary.embedding = {
    latency_ms: row.latency_ms,
    vectors: Array.isArray(body?.result) ? body.result.length : 0,
    dimension: Array.isArray(body?.result?.[0]) ? body.result[0].length : null,
    ok: row.ok,
  };
}

async function measureRerank() {
  const { row, body } = await timedJson('Rerank kiểm tra liên quan', 'embedding', 'POST', `${embeddingBase}/api/v1/rerank`, {
    auth: false,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      query: 'SLA P1 phản hồi bao lâu?',
      documents: ['P1 phản hồi trong 15 phút', 'Thanh toán trong 30 ngày', 'Port dùng dải 6100-6150'],
    }),
    expect: (status, value) => status === 200 && value?.status === 200 && Array.isArray(value?.result),
  });
  summary.rerank = {
    latency_ms: row.latency_ms,
    items: Array.isArray(body?.result) ? body.result.length : 0,
    ok: row.ok,
  };
}

async function runQuestions() {
  const directVllm = [
    'Trả lời ngắn: hệ thống đang dùng dải port local nào?',
    'Tóm tắt một câu lợi ích của RAG trong hệ thống nội bộ.',
    'Viết đúng một dòng: BENCHMARK_OK',
  ];
  for (const [idx, question] of directVllm.entries()) {
    await timedJson(`Q${idx + 1} Direct vLLM`, 'vllm', 'POST', `${vllmBase}/v1/chat/completions`, {
      auth: false,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: question }],
        max_tokens: 128,
        temperature: 0,
      }),
      question,
      expect: (status, value) => status === 200 && Array.isArray(value?.choices),
    });
  }

  const ragFast = [
    'Không dùng file, hãy trả lời ngắn hệ thống này có các module chính nào?',
    'Không dùng file, giải thích ngắn vai trò của Qdrant trong RAG.',
    'Không dùng file, nêu một rủi ro khi prompt quá dài.',
  ];
  for (const [idx, question] of ragFast.entries()) {
    await timedSse(`Q${idx + 4} RAG fast`, 'rag-fast', `${publicBase}/api/v1/rags/rag-contract-fast`, {
      session_id: -1,
      user_input: question,
      model_name: modelName,
      is_api: false,
      file_paths: [],
      query_flow: 'fast',
      web_urls: [],
      web_mode: 'open_web',
    });
  }

  const ragFile = [
    'Dựa trên file benchmark vừa upload, SLA P1 phản hồi trong bao nhiêu phút?',
    'Dựa trên file benchmark vừa upload, điều khoản thanh toán mặc định là gì?',
    'Dựa trên file benchmark vừa upload, penalty chậm tiến độ là bao nhiêu?',
    'Dựa trên file benchmark vừa upload, dải port local chuẩn là gì?',
    'Dựa trên file benchmark vừa upload, GPU util mặc định của vLLM là bao nhiêu?',
  ];
  for (const [idx, question] of ragFile.entries()) {
    await timedSse(`Q${idx + 7} RAG uploaded file`, 'rag-file', `${publicBase}/api/v1/rags/rag-contract-fast`, {
      session_id: -1,
      user_input: question,
      model_name: modelName,
      is_api: false,
      file_paths: ['ntc_benchmark_policy.csv'],
      query_flow: 'fast',
      web_urls: [],
      web_mode: 'open_web',
    });
  }

  const webQuestions = [
    'Web search: kiểm tra nhanh hôm nay localhost là gì trong ngữ cảnh URL?',
    'Web search: tìm khái niệm FastAPI là gì, trả lời rất ngắn.',
  ];
  for (const [idx, question] of webQuestions.entries()) {
    await timedSse(`Q${idx + 12} Web search`, 'web-search', `${publicBase}/api/v1/rags/rag-contract-fast`, {
      session_id: -1,
      user_input: question,
      model_name: modelName,
      is_api: false,
      file_paths: [],
      query_flow: 'web_search',
      web_urls: [],
      web_mode: 'open_web',
    });
  }

  const contractFast = [
    'Tạo hợp đồng dịch vụ ngắn giữa Công ty A và Công ty B, giá trị 50 triệu, thanh toán 30 ngày.',
    'Tạo phụ lục hợp đồng ngắn gia hạn thời gian thực hiện thêm 15 ngày.',
  ];
  for (const [idx, question] of contractFast.entries()) {
    await timedSse(`Q${idx + 14} Contract fast`, 'contract-fast', `${publicBase}/api/v1/contracts/create-contract-fast`, {
      session_id: -1,
      user_input: question,
      model_name: modelName,
      is_api: false,
    });
  }

  await timedSse('Q16 Contract reasoning', 'contract-reasoning', `${publicBase}/api/v1/contracts/create-contract-reasoning`, {
    session_id: -1,
    user_input: 'Tạo hợp đồng bảo mật NDA ngắn giữa Bên tiết lộ và Bên nhận, thời hạn bảo mật 2 năm.',
    model_name: modelName,
    is_api: false,
  });
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

function csvEscape(value) {
  const raw = String(value ?? '');
  return /[",\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

async function writeOutputs() {
  const endedAt = new Date().toISOString();
  const passed = results.filter((item) => item.ok).length;
  const failed = results.length - passed;
  const questionRows = results.filter((item) => item.question);
  const latencies = questionRows.map((item) => item.latency_ms);
  const tpsValues = questionRows.map((item) => item.tokens_per_second).filter((value) => Number.isFinite(value));
  const aggregate = {
    ended_at: endedAt,
    total_checks: results.length,
    total_questions: questionRows.length,
    passed,
    failed,
    question_latency_ms: {
      min: Math.min(...latencies),
      max: Math.max(...latencies),
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      avg: Number((latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1)),
    },
    avg_tokens_per_second: Number((tpsValues.reduce((a, b) => a + b, 0) / Math.max(1, tpsValues.length)).toFixed(2)),
  };
  const output = { summary: { ...summary, ...aggregate }, results };
  await fs.writeFile(path.join(resultsDir, 'results.json'), JSON.stringify(output, null, 2));

  const csvHeader = ['ok', 'group', 'name', 'latency_ms', 'tokens_per_second', 'status', 'question', 'answer', 'error'];
  const csvRows = [csvHeader.join(',')].concat(results.map((item) => csvHeader.map((key) => csvEscape(item[key])).join(',')));
  await fs.writeFile(path.join(resultsDir, 'results.csv'), csvRows.join('\n'));

  const mdRows = results.map((item) => `| ${item.ok ? 'PASS' : 'FAIL'} | ${item.group} | ${item.name} | ${item.latency_ms} | ${item.tokens_per_second ?? ''} | ${compactText(item.question, 120)} | ${compactText(item.answer, 180)} | ${compactText(item.error, 80)} |`).join('\n');
  const reportMd = `# Benchmark 10-30 câu hỏi\n\n` +
    `- Bắt đầu: ${summary.started_at}\n` +
    `- Kết thúc: ${endedAt}\n` +
    `- Public base: \`${publicBase}\`\n` +
    `- Model: \`${modelName}\`\n` +
    `- Checks: ${results.length}, questions: ${questionRows.length}, pass: ${passed}, fail: ${failed}\n` +
    `- Upload/index latency: ${summary.upload?.latency_ms ?? ''} ms\n` +
    `- Embedding latency: ${summary.embedding?.latency_ms ?? ''} ms (${summary.embedding?.vectors ?? 0} vectors, dim ${summary.embedding?.dimension ?? ''})\n` +
    `- Question latency p50/p95/max: ${aggregate.question_latency_ms.p50}/${aggregate.question_latency_ms.p95}/${aggregate.question_latency_ms.max} ms\n` +
    `- Avg throughput: ${aggregate.avg_tokens_per_second} tokens/s hoặc token/s ước lượng cho SSE\n\n` +
    `| Result | Group | Name | Latency ms | tok/s | Question | Answer preview | Error |\n` +
    `| --- | --- | --- | ---: | ---: | --- | --- | --- |\n` +
    `${mdRows}\n`;
  await fs.writeFile(path.join(resultsDir, 'report.md'), reportMd);

  const maxLatency = Math.max(...results.map((item) => item.latency_ms));
  const cards = [
    ['Questions', aggregate.total_questions],
    ['Pass', aggregate.passed],
    ['Fail', aggregate.failed],
    ['P95 latency', `${aggregate.question_latency_ms.p95} ms`],
    ['Upload/index', `${summary.upload?.latency_ms ?? 0} ms`],
    ['Embedding', `${summary.embedding?.latency_ms ?? 0} ms`],
  ].map(([label, value]) => `<div class="card"><div class="label">${label}</div><div class="value">${value}</div></div>`).join('');
  const bars = results.map((item) => {
    const width = Math.max(2, Math.round((item.latency_ms / maxLatency) * 100));
    return `<tr class="${item.ok ? 'pass' : 'fail'}"><td>${item.ok ? 'PASS' : 'FAIL'}</td><td>${item.group}</td><td>${item.name}</td><td>${item.latency_ms}</td><td>${item.tokens_per_second ?? ''}</td><td><div class="bar"><span style="width:${width}%"></span></div></td><td>${compactText(item.question, 160)}</td><td>${compactText(item.answer, 260)}</td></tr>`;
  }).join('');
  const html = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Benchmark 10-30 dashboard</title>
  <style>
    body { margin: 24px; font-family: Arial, sans-serif; color: #111827; background: #f8fafc; }
    h1 { margin: 0 0 8px; font-size: 26px; }
    .meta { color: #475569; margin-bottom: 18px; }
    .cards { display: grid; grid-template-columns: repeat(6, minmax(120px, 1fr)); gap: 10px; margin: 16px 0 22px; }
    .card { background: white; border: 1px solid #dbe3ef; border-radius: 6px; padding: 12px; }
    .label { font-size: 12px; color: #64748b; }
    .value { font-size: 20px; font-weight: 700; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; background: white; }
    th, td { border: 1px solid #dbe3ef; padding: 8px; vertical-align: top; font-size: 12px; }
    th { background: #e2e8f0; text-align: left; }
    tr.pass td:first-child { color: #047857; font-weight: 700; }
    tr.fail td:first-child { color: #b91c1c; font-weight: 700; }
    .bar { width: 140px; height: 9px; background: #e5e7eb; border-radius: 99px; overflow: hidden; }
    .bar span { display: block; height: 100%; background: #2563eb; }
    .note { margin-top: 12px; color: #475569; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Benchmark 10-30 câu hỏi</h1>
  <div class="meta">Public base: <code>${publicBase}</code> | Model: <code>${modelName}</code> | ${summary.started_at} -> ${endedAt}</div>
  <div class="cards">${cards}</div>
  <table>
    <thead><tr><th>Result</th><th>Group</th><th>Name</th><th>Latency ms</th><th>tok/s</th><th>Latency bar</th><th>Question</th><th>Answer preview</th></tr></thead>
    <tbody>${bars}</tbody>
  </table>
  <div class="note">tok/s với vLLM direct lấy từ usage completion_tokens; SSE dùng ước lượng ký tự/4 token.</div>
</body>
</html>`;
  await fs.writeFile(path.join(resultsDir, 'dashboard.html'), html);
}

async function screenshotDashboard() {
  const dashboard = `file://${path.join(resultsDir, 'dashboard.html').replace(/ /g, '%20')}`;
  const out = path.join(resultsDir, 'dashboard.png');
  try {
    await execFileAsync('npx', ['--yes', 'playwright', 'screenshot', '--full-page', '--wait-for-timeout=500', dashboard, out], {
      cwd: path.resolve(benchRoot, '..', '..'),
      timeout: 60000,
    });
  } catch (err) {
    await fs.writeFile(path.join(resultsDir, 'dashboard-screenshot-error.txt'), sanitize(err.stderr || err.message || err));
  }
}

async function main() {
  await ensureBenchmarkData();
  await timedJson('Public home', 'health', 'GET', `${publicBase}/`, { auth: false });
  await timedJson('vLLM models', 'health', 'GET', `${vllmBase}/v1/models`, { auth: false, expect: (status, value) => status === 200 && JSON.stringify(value).includes(modelName) });
  await timedJson('Login root', 'auth', 'POST', `${publicBase}/api/v1/auth/login`, {
    auth: false,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
    expect: (status, value) => status === 200 && Boolean(value?.account),
  });
  await timedJson('Auth me', 'auth', 'GET', `${publicBase}/api/v1/auth/me`, { expect: (status, value) => status === 200 && Boolean(value?.result || value?.account || value?.email) });
  await measureEmbedding();
  await measureRerank();
  await uploadRagFile(path.join(dataDir, 'ntc-benchmark-policy.csv'));
  await runQuestions();
  await writeOutputs();
  await screenshotDashboard();

  const failed = results.filter((item) => !item.ok);
  console.log(JSON.stringify({
    checks: results.length,
    questions: results.filter((item) => item.question).length,
    passed: results.length - failed.length,
    failed: failed.length,
    results_dir: resultsDir,
  }, null, 2));
  if (failed.length) process.exitCode = 1;
}

main().catch(async (err) => {
  await fs.mkdir(resultsDir, { recursive: true });
  await fs.writeFile(path.join(resultsDir, 'benchmark-fatal-error.txt'), sanitize(err.stack || err.message || err));
  console.error(err);
  process.exit(1);
});
