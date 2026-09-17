/**
 * AfterHoursDesk — thin Node ESM server (zero deps).
 * Default PORT 3000; if busy, set PORT=3010 (see README).
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildBrief,
  buildBriefProgressive,
  healthPayload,
  healthPayloadAsync,
  getSession,
  isBriefInflight,
} from './lib/brief.mjs';
import { paperPlan } from './lib/paper_agent_stub.mjs';
import { runResearchSkills } from './lib/skills.mjs';
import { loadDeskState, saveDeskState } from './lib/desk_state.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, 'public');
const PORT = Number(process.env.PORT) || 3000;

// Load .env if present (no dotenv dep)
async function loadEnv() {
  try {
    const raw = await readFile(join(__dirname, '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i < 0) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (process.env[k] === undefined) process.env[k] = v;
    }
  } catch {
    /* no .env — mock path */
  }
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function writeSse(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

async function serveStatic(req, res, pathname) {
  let path = pathname === '/' ? '/index.html' : pathname;
  path = path.replace(/\.\./g, '');
  const file = join(PUBLIC, path);
  try {
    const data = await readFile(file);
    const type = MIME[extname(file)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
}

await loadEnv();

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const { pathname } = url;
  const method = req.method || 'GET';

  try {
    if (method === 'GET' && pathname === '/api/health') {
      const payload = await healthPayloadAsync();
      return sendJson(res, 200, payload);
    }

    if (method === 'POST' && pathname === '/api/brief') {
      let body;
      try {
        body = await readJson(req);
      } catch {
        return sendJson(res, 400, { error: 'invalid JSON body' });
      }

      const accept = String(req.headers.accept || '');
      const wantProgressive =
        body.progressive === true || accept.includes('text/event-stream');

      if (wantProgressive) {
        // Enforce single-flight 429 before starting SSE
        if (isBriefInflight()) {
          return sendJson(res, 429, {
            error: 'brief_in_flight',
            message: 'A brief is already running — wait or cancel.',
          });
        }

        res.writeHead(200, {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-store',
          Connection: 'keep-alive',
        });
        // Flush headers for proxies
        if (typeof res.flushHeaders === 'function') res.flushHeaders();

        try {
          const final = await buildBriefProgressive(
            {
              question: body.question,
              symbol: body.symbol,
              desk_context: body.desk_context,
            },
            {
              onEarly: (early) => {
                writeSse(res, 'early', early);
              },
            }
          );
          writeSse(res, 'final', final);
        } catch (err) {
          const status = err.status || 500;
          if (status === 429) {
            // Race: another brief started between check and acquire
            writeSse(res, 'error', {
              error: 'brief_in_flight',
              message:
                err.message ||
                'A brief is already running — wait or cancel.',
              status: 429,
            });
          } else {
            writeSse(res, 'error', {
              error: err.message || 'brief failed',
              status,
            });
          }
        }
        return res.end();
      }

      // Non-progressive: existing single JSON response
      try {
        const payload = await buildBrief({
          question: body.question,
          symbol: body.symbol,
          desk_context: body.desk_context,
        });
        return sendJson(res, 200, payload);
      } catch (err) {
        const status = err.status || 500;
        if (status === 429) {
          return sendJson(res, 429, {
            error: 'brief_in_flight',
            message:
              err.message ||
              'A brief is already running — wait or cancel.',
          });
        }
        return sendJson(res, status, { error: err.message || 'brief failed' });
      }
    }

    if (method === 'GET' && pathname === '/api/skills/research') {
      const symbol = url.searchParams.get('symbol') || 'NVDA';
      const pack = await runResearchSkills(symbol);
      return sendJson(res, 200, {
        mode: pack.mode,
        skills: pack.digests.map(({ skill, summary, mode }) => ({
          skill,
          summary,
          mode,
        })),
      });
    }

    if (method === 'GET' && pathname.startsWith('/api/session/')) {
      const id = pathname.slice('/api/session/'.length);
      const session = getSession(id);
      if (!session) return sendJson(res, 404, { error: 'session not found' });
      return sendJson(res, 200, session);
    }

    if (method === 'GET' && pathname === '/api/desk/state') {
      const state = await loadDeskState();
      return sendJson(res, 200, state);
    }

    if (method === 'PUT' && pathname === '/api/desk/state') {
      let body;
      try {
        body = await readJson(req);
      } catch {
        return sendJson(res, 400, { error: 'invalid JSON body' });
      }
      const saved = await saveDeskState(body || {});
      return sendJson(res, 200, saved);
    }

    if (method === 'GET' && pathname === '/api/desk/sessions') {
      const state = await loadDeskState();
      return sendJson(res, 200, {
        recent_sessions: state.recent_sessions || [],
      });
    }

    if (method === 'POST' && pathname === '/api/paper/plan') {
      let body = {};
      try {
        body = await readJson(req);
      } catch {
        /* empty ok for stub */
      }
      return sendJson(res, 200, paperPlan(body));
    }

    if (method === 'GET' && !pathname.startsWith('/api/')) {
      return serveStatic(req, res, pathname);
    }

    sendJson(res, 404, { error: 'not found' });
  } catch (err) {
    sendJson(res, 500, { error: err.message || 'server error' });
  }
});

server.listen(PORT, () => {
  const h = healthPayload();
  console.log(`AfterHoursDesk listening on http://localhost:${PORT}`);
  console.log(
    `mode=${h.mode} live_llm=${h.live_llm} live_sources=${h.live_sources} live_market=${h.live_market} live_skills=${h.live_skills}`
  );
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `Port ${PORT} in use. Retry with: PORT=3010 npm start`
    );
    process.exit(1);
  }
  throw err;
});
