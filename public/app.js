const $ = (id) => document.getElementById(id);

const questionEl = $('question');
const symbolEl = $('symbol');
const runBtn = $('run');
const errorEl = $('error');
const emptyEl = $('empty');
const cardEl = $('brief-card');
const badgeLlm = $('badge-llm');
const badgeData = $('badge-data');
const badgeMarket = $('badge-market');
const badgeSkills = $('badge-skills');

const deskSegment = $('desk-segment');
const deskRisk = $('desk-risk');
const deskThesis = $('desk-thesis');
const deskWatchlist = $('desk-watchlist');
const deskChecklist = $('desk-checklist');
const saveDeskBtn = $('save-desk');
const deskSavedEl = $('desk-saved');
const watchlistChips = $('watchlist-chips');
const recallChips = $('recall-chips');
const thesisJournalEl = $('thesis-journal');

const LS_KEY = 'afterhours_desk_v1';
const BRIEF_TIMEOUT_MS = 200_000;

let loading = false;
let lastBriefMeta = null;
let deskState = null; // authoritative hydrated state
let saveToastTimer = null;

const SEED = {
  profile: {
    segment: 'Asia overnight US equities',
    risk_note: 'No leverage; size small at open',
    standing_thesis: 'AI infra leaders on dips; avoid chase after +3% AH',
  },
  watchlist: ['NVDA', 'AAPL', 'MSFT'],
  my_checklist: ['Confirm AH vs prior close', 'Check guidance headlines'],
  recent_sessions: [],
  updated_at: null,
};

function setBadge(el, state, liveLabel, mockLabel, pendingLabel) {
  if (state === 'pending') {
    el.textContent = pendingLabel || 'PENDING LLM';
    el.className = 'badge pending';
    return;
  }
  const live = state === true || state === 'live';
  el.textContent = live ? liveLabel : mockLabel;
  el.className = `badge ${live ? 'live' : 'mock'}`;
}

function sourcesLookLive(sources, sourcesMode) {
  if (sourcesMode === 'live') return true;
  if (sourcesMode === 'mock') return false;
  const list = sources || [];
  return list.some((s) => {
    const h = (s.host || '').toLowerCase();
    return h && h !== 'example.com' && h !== 'unknown' && !h.endsWith('.example.com');
  });
}

function setBadges(health, briefMeta) {
  const llmMode = briefMeta?.llm?.mode;
  let llmState;
  if (llmMode === 'pending' || llmMode === 'mock-pending') {
    llmState = 'pending';
  } else if (llmMode === 'live') {
    llmState = 'live';
  } else if (llmMode === 'mock') {
    llmState = 'mock';
  } else {
    llmState = Boolean(health?.live_llm) ? 'live' : 'mock';
  }

  const dataLive =
    briefMeta?.sourcesMode === 'live'
      ? true
      : briefMeta?.sourcesMode === 'mock'
        ? false
        : briefMeta?.sourcesLookLive
          ? true
          : Boolean(health?.live_sources);
  const marketLive =
    briefMeta?.market?.mode === 'live'
      ? true
      : briefMeta?.market?.mode === 'mock'
        ? false
        : Boolean(health?.live_market);
  const digests = briefMeta?.skills?.digests || briefMeta?.digests || null;
  let skillsIsLive = false;
  if (Array.isArray(digests) && digests.length) {
    skillsIsLive = digests.some((d) => d && d.mode === 'live');
  } else if (briefMeta?.skills?.mode === 'live' || briefMeta?.skills?.mode === 'partial') {
    skillsIsLive = true;
  } else if (briefMeta?.skills?.mode === 'mock') {
    skillsIsLive = false;
  } else {
    skillsIsLive = false;
  }

  setBadge(
    badgeLlm,
    llmState,
    'LIVE LLM',
    'LABELED MOCK LLM',
    llmMode === 'mock-pending' ? 'MOCK LLM PENDING' : 'PENDING LLM'
  );
  setBadge(badgeData, dataLive, 'LIVE DATA', 'LABELED MOCK DATA');
  setBadge(badgeMarket, marketLive, 'LIVE MARKET', 'LABELED MOCK MARKET');
  setBadge(
    badgeSkills,
    skillsIsLive,
    'LIVE SKILLS',
    'LABELED MOCK SKILLS'
  );
}

async function refreshHealth(briefMeta) {
  if (briefMeta) lastBriefMeta = briefMeta;
  const meta = briefMeta || lastBriefMeta;
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    setBadges(data, meta);
  } catch {
    setBadges(
      {
        live_llm: false,
        live_sources: false,
        live_market: false,
        live_skills: false,
      },
      meta
    );
  }
}

function showError(msg) {
  errorEl.hidden = !msg;
  errorEl.textContent = msg || '';
}

function parseWatchlist(raw) {
  return String(raw || '')
    .split(/[,·|\s]+/)
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 8);
}

function parseChecklist(raw) {
  return String(raw || '')
    .split(/\n|·|;/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function readFormDesk() {
  return {
    profile: {
      segment: deskSegment.value.trim(),
      risk_note: deskRisk.value.trim(),
      standing_thesis: deskThesis.value.trim(),
    },
    watchlist: parseWatchlist(deskWatchlist.value),
    my_checklist: parseChecklist(deskChecklist.value),
    recent_sessions: deskState?.recent_sessions || [],
    updated_at: new Date().toISOString(),
  };
}

function deskContextFromState(state) {
  const s = state || readFormDesk();
  return {
    segment: s.profile?.segment || '',
    risk_note: s.profile?.risk_note || '',
    standing_thesis: s.profile?.standing_thesis || '',
    watchlist: [...(s.watchlist || [])],
    my_checklist: [...(s.my_checklist || [])],
  };
}

function renderWatchlistChips(list) {
  watchlistChips.innerHTML = '';
  for (const t of list || []) {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = t;
    watchlistChips.appendChild(chip);
  }
}

function fillDeskForm(state) {
  const s = state || SEED;
  deskSegment.value = s.profile?.segment || SEED.profile.segment;
  deskRisk.value = s.profile?.risk_note || SEED.profile.risk_note;
  deskThesis.value = s.profile?.standing_thesis || SEED.profile.standing_thesis;
  const wl = s.watchlist?.length ? s.watchlist : SEED.watchlist;
  deskWatchlist.value = wl.join(', ');
  renderWatchlistChips(wl);
  const cl = s.my_checklist?.length ? s.my_checklist : SEED.my_checklist;
  deskChecklist.value = cl.join('\n');
  renderRecall(s.recent_sessions || []);
  renderThesisJournal(s.recent_sessions || []);
}

function renderRecall(sessions) {
  recallChips.innerHTML = '';
  if (!sessions || !sessions.length) {
    const p = document.createElement('p');
    p.className = 'recall-empty';
    p.id = 'recall-empty';
    p.textContent = 'No sessions yet — run a brief';
    recallChips.appendChild(p);
    return;
  }
  for (const s of sessions) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'recall-chip';
    const label = s.symbol || '?';
    const head = (s.headline || '').slice(0, 42);
    btn.textContent = head ? `${label}: ${head}` : label;
    btn.title = s.headline || label;
    btn.addEventListener('click', () => {
      if (s.symbol) symbolEl.value = s.symbol;
      if (s.headline) {
        questionEl.value = `What hit ${s.symbol || 'this name'} after the close and what should I watch at open?`;
      }
      if (s.session_id) {
        fetch(`/api/session/${s.session_id}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data?.brief) {
              if (data.question) questionEl.value = data.question;
              if (data.symbol) symbolEl.value = data.symbol;
              renderBrief(data);
            }
          })
          .catch(() => {});
      }
    });
    recallChips.appendChild(btn);
  }
}

function renderThesisJournal(sessions) {
  if (!thesisJournalEl) return;
  thesisJournalEl.innerHTML = '';
  const withNotes = (sessions || []).filter((s) => s && s.thesis_note);
  if (!withNotes.length) {
    const li = document.createElement('li');
    li.className = 'thesis-empty';
    li.id = 'thesis-empty';
    li.textContent = 'No thesis notes yet — run a brief';
    thesisJournalEl.appendChild(li);
    return;
  }
  for (const s of withNotes) {
    const li = document.createElement('li');
    li.className = 'thesis-entry';
    const pct =
      s.overnight_pct === null || s.overnight_pct === undefined
        ? 'n/a'
        : `${Number(s.overnight_pct) > 0 ? '+' : ''}${s.overnight_pct}%`;
    const sym = document.createElement('span');
    sym.className = 'thesis-sym';
    sym.textContent = s.symbol || '?';
    const pctEl = document.createElement('span');
    pctEl.className = 'thesis-pct mono';
    pctEl.textContent = pct;
    const note = document.createElement('span');
    note.className = 'thesis-note';
    note.textContent = s.thesis_note;
    li.appendChild(sym);
    li.appendChild(document.createTextNode(' '));
    li.appendChild(pctEl);
    li.appendChild(document.createTextNode(' — '));
    li.appendChild(note);
    if (s.headline) li.title = s.headline;
    thesisJournalEl.appendChild(li);
  }
}

function loadLocalDesk() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveLocalDesk(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

function newerTs(a, b) {
  const ta = a ? Date.parse(a) : 0;
  const tb = b ? Date.parse(b) : 0;
  if (Number.isNaN(ta) && Number.isNaN(tb)) return null;
  if (Number.isNaN(ta)) return b ? 'server' : null;
  if (Number.isNaN(tb)) return a ? 'local' : null;
  if (ta === tb) return 'tie';
  return ta > tb ? 'local' : 'server';
}

async function hydrateDesk() {
  let server = null;
  try {
    const res = await fetch('/api/desk/state');
    if (res.ok) server = await res.json();
  } catch {
    /* offline — seed / local only */
  }
  const local = loadLocalDesk();
  const winner = newerTs(local?.updated_at, server?.updated_at);
  if (winner === 'local' && local) {
    deskState = local;
  } else if (server) {
    deskState = server;
    // Seed first open: if server has no updated_at and no local, keep seeds in form
    if (!server.updated_at && !local) {
      deskState = { ...SEED, ...server, updated_at: null };
    }
  } else if (local) {
    deskState = local;
  } else {
    deskState = { ...SEED };
  }
  fillDeskForm(deskState);
}

function flashSaved() {
  deskSavedEl.hidden = false;
  clearTimeout(saveToastTimer);
  saveToastTimer = setTimeout(() => {
    deskSavedEl.hidden = true;
  }, 1600);
}

async function saveDesk() {
  const state = readFormDesk();
  deskState = state;
  saveLocalDesk(state);
  renderWatchlistChips(state.watchlist);
  try {
    const res = await fetch('/api/desk/state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: state.profile,
        watchlist: state.watchlist,
        my_checklist: state.my_checklist,
      }),
    });
    if (res.ok) {
      const saved = await res.json();
      deskState = {
        ...saved,
        updated_at: saved.updated_at || state.updated_at,
      };
      saveLocalDesk(deskState);
      if (saved.recent_sessions) {
        renderRecall(saved.recent_sessions);
        renderThesisJournal(saved.recent_sessions);
      }
    }
  } catch {
    /* local already saved */
  }
  flashSaved();
}

function metaFromBriefData(data) {
  const sourcesMode =
    data.mode === 'live'
      ? 'live'
      : sourcesLookLive(data.sources, null)
        ? 'live'
        : data.mode === 'mock'
          ? 'mock'
          : undefined;
  return {
    llm: data.llm,
    market: data.market,
    skills: {
      ...(data.skills || {}),
      digests: data.brief?.skill_digest || data.skills?.digests || [],
    },
    digests: data.brief?.skill_digest || [],
    sourcesMode,
    sourcesLookLive: sourcesLookLive(data.sources, sourcesMode),
  };
}

function renderForMyDesk(data) {
  const fmdBlock = $('for-my-desk-block');
  const fmd = data.brief?.for_my_desk;
  if (data.desk_applied && fmd) {
    fmdBlock.hidden = false;
    $('fmd-thesis').textContent = fmd.thesis_fit || '';
    $('fmd-watchlist').textContent = fmd.watchlist_angle || '';

    const peerLabel = $('peer-overnight-label');
    const peerEl = $('peer-overnight');
    const peers = data.brief?.peer_overnight || [];
    if (peers.length) {
      peerLabel.hidden = false;
      peerEl.hidden = false;
      peerEl.innerHTML = '';
      for (const p of peers) {
        const chip = document.createElement('span');
        chip.className = 'peer-chip';
        const pct =
          p.pct === null || p.pct === undefined
            ? 'n/a'
            : `${p.pct > 0 ? '+' : ''}${p.pct}%`;
        chip.innerHTML = `<span class="peer-sym">${p.symbol}</span> <span class="peer-pct">${pct}</span>`;
        if (p.note) chip.title = p.note;
        peerEl.appendChild(chip);
      }
    } else {
      peerLabel.hidden = true;
      peerEl.hidden = true;
      peerEl.innerHTML = '';
    }

    const cl = $('fmd-checklist');
    cl.innerHTML = '';
    for (const item of fmd.checklist_echo || []) {
      const li = document.createElement('li');
      li.className = 'checklist-item';
      if (item && typeof item === 'object') {
        const status = String(item.status || 'warn').toLowerCase();
        const pill = document.createElement('span');
        pill.className = `status-pill status-${status}`;
        pill.textContent = status.toUpperCase();
        li.appendChild(pill);
        li.appendChild(document.createTextNode(` ${item.item || ''}`));
        if (item.note) {
          const note = document.createElement('span');
          note.className = 'checklist-note';
          note.textContent = ` — ${item.note}`;
          li.appendChild(note);
        }
      } else {
        li.textContent = item;
      }
      cl.appendChild(li);
    }
  } else {
    fmdBlock.hidden = true;
  }
}

function renderOvernight(data) {
  const om = data.brief?.overnight_move || {};
  if (om.pct === null || om.pct === undefined) {
    $('overnight').textContent = `Unavailable — ${om.note || 'no market print'}`;
  } else {
    const pct = `${om.pct > 0 ? '+' : ''}${om.pct}%`;
    const asof = om.as_of ? ` · as of ${om.as_of}` : '';
    const src = om.source ? ` · ${om.source}` : '';
    $('overnight').textContent = `${data.symbol} overnight: ${pct}${om.note ? ` — ${om.note}` : ''}${asof}${src}`;
  }
}

function renderClaims(claims, { synthesizing } = {}) {
  const claimsEl = $('claims');
  claimsEl.innerHTML = '';
  if (synthesizing) {
    const li = document.createElement('li');
    li.className = 'synthesizing';
    li.textContent = 'Synthesizing claims…';
    claimsEl.appendChild(li);
    return;
  }
  for (const c of claims || []) {
    const li = document.createElement('li');
    const asof = document.createElement('span');
    asof.className = 'asof';
    asof.textContent = c.as_of || '';
    li.appendChild(asof);
    li.appendChild(document.createTextNode(` ${c.text}`));
    if (c.source_id) {
      li.appendChild(document.createTextNode(` [${c.source_id}]`));
    }
    const snip = c.snippet || c.source_title;
    if (snip) {
      const line = document.createElement('div');
      line.className = 'claim-snippet mono';
      const q = document.createElement('span');
      q.className = 'claim-quote';
      q.textContent = `“${snip}”`;
      line.appendChild(q);
      if (c.source_host) {
        line.appendChild(document.createTextNode(` · ${c.source_host}`));
      }
      li.appendChild(line);
    }
    claimsEl.appendChild(li);
  }
}

function renderWatch(items) {
  const watch = $('watch');
  watch.innerHTML = '';
  for (const w of items || []) {
    const li = document.createElement('li');
    li.textContent = w;
    watch.appendChild(li);
  }
}

function renderSkills(data) {
  const skillsEl = $('skills');
  skillsEl.innerHTML = '';
  const digests = data.brief?.skill_digest || [];
  const skillsBadge = $('skills-badge');
  if (!digests.length) {
    skillsBadge.hidden = true;
    return;
  }
  if (data.skills?.mode === 'mock' || digests.every((d) => d.mode === 'mock')) {
    skillsBadge.hidden = false;
    skillsBadge.textContent = 'LABELED MOCK SKILLS';
    skillsBadge.className = 'skills-badge mock';
  } else if (data.skills?.mode === 'live') {
    skillsBadge.hidden = false;
    skillsBadge.textContent = 'LIVE SKILLS';
    skillsBadge.className = 'skills-badge live';
  } else {
    skillsBadge.hidden = false;
    skillsBadge.textContent = 'PARTIAL SKILLS';
    skillsBadge.className = 'skills-badge partial';
  }
  for (const d of digests) {
    const li = document.createElement('li');
    const name = document.createElement('strong');
    name.textContent = d.skill;
    li.appendChild(name);
    const mode = document.createElement('span');
    mode.className = `skill-mode ${d.mode === 'live' ? 'live' : 'mock'}`;
    mode.textContent = d.mode === 'live' ? 'LIVE' : 'MOCK';
    li.appendChild(mode);
    li.appendChild(document.createTextNode(` — ${d.summary || ''}`));
    skillsEl.appendChild(li);
  }
}

function renderSources(list) {
  const sources = $('sources');
  sources.innerHTML = '';
  for (const s of list || []) {
    const li = document.createElement('li');
    const id = document.createElement('strong');
    id.textContent = `${s.id}${s.rank != null ? ` #${s.rank}` : ''} `;
    li.appendChild(id);
    if (s.host) {
      const host = document.createElement('span');
      host.className = 'host';
      host.textContent = `[${s.host}] `;
      li.appendChild(host);
    }
    if (s.url) {
      const a = document.createElement('a');
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = s.title;
      li.appendChild(a);
    } else {
      li.appendChild(document.createTextNode(s.title || ''));
    }
    if (s.published_at) {
      const when = document.createElement('span');
      when.className = 'when';
      when.textContent = s.published_at;
      li.appendChild(when);
    }
    sources.appendChild(li);
  }
}

function refreshRecallFromServer() {
  fetch('/api/desk/state')
    .then((r) => (r.ok ? r.json() : null))
    .then((st) => {
      if (!st) return;
      if (deskState) {
        deskState.recent_sessions = st.recent_sessions || [];
      }
      renderRecall(st.recent_sessions || []);
      renderThesisJournal(st.recent_sessions || []);
    })
    .catch(() => {});
}

/** Progressive early paint — overnight, sources, skills, for_my_desk shell; pending LLM */
function renderEarly(data) {
  emptyEl.hidden = true;
  cardEl.hidden = false;

  $('headline').textContent = data.brief?.headline || 'Synthesizing brief…';
  renderForMyDesk(data);
  renderOvernight(data);
  renderClaims([], { synthesizing: true });
  renderWatch([]);
  renderSkills(data);
  renderSources(data.sources || []);

  $('disclaimer').textContent =
    data.brief?.disclaimer ||
    'Not financial advice. Human decides. No live orders.';
  $('session').textContent = `mode ${data.mode} · llm ${data.llm?.mode}/${data.llm?.model || '…'} · market ${data.market?.mode}${data.market?.provider ? '/' + data.market.provider : ''} · skills ${data.skills?.mode}${data.desk_applied ? ' · desk applied' : ''} · synthesizing…`;

  refreshHealth(metaFromBriefData(data));
}

function renderBrief(data) {
  emptyEl.hidden = true;
  cardEl.hidden = false;

  $('headline').textContent = data.brief.headline || '';
  renderForMyDesk(data);
  renderOvernight(data);
  renderClaims(data.brief.claims || []);
  renderWatch(data.brief.watch_at_open || []);
  renderSkills(data);
  renderSources(data.sources || []);

  $('disclaimer').textContent =
    data.brief.disclaimer ||
    'Not financial advice. Human decides. No live orders.';
  $('session').textContent = `session ${data.session_id} · mode ${data.mode} · llm ${data.llm?.mode}/${data.llm?.model} · market ${data.market?.mode}${data.market?.provider ? '/' + data.market.provider : ''} · skills ${data.skills?.mode}${data.desk_applied ? ' · desk applied' : ''}`;

  refreshRecallFromServer();
}

function friendlyFetchError(err) {
  if (!err) return 'Network error';
  if (err.name === 'AbortError') return 'Brief timed out — try again';
  const msg = String(err.message || err);
  if (/failed to fetch/i.test(msg) || err.name === 'TypeError') {
    return 'Network error — brief request failed (check server / try again)';
  }
  return msg || 'Network error';
}

/**
 * Parse SSE ReadableStream. Yields { event, data } objects.
 */
async function* parseSseStream(body) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let eventName = 'message';
  let dataLines = [];

  const flush = () => {
    if (!dataLines.length) {
      eventName = 'message';
      return null;
    }
    const raw = dataLines.join('\n');
    dataLines = [];
    const ev = eventName;
    eventName = 'message';
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = { raw };
    }
    return { event: ev, data };
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf('\n')) >= 0) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line === '') {
        const item = flush();
        if (item) yield item;
        continue;
      }
      if (line.startsWith(':')) continue;
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim();
        continue;
      }
      if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trimStart());
        continue;
      }
    }
  }
  if (buf.length) {
    let line = buf;
    if (line.endsWith('\r')) line = line.slice(0, -1);
    if (line.startsWith('event:')) eventName = line.slice(6).trim();
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
  }
  const last = flush();
  if (last) yield last;
}

async function runBriefJson(desk_context, signal) {
  const res = await fetch('/api/brief', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: questionEl.value,
      symbol: symbolEl.value || 'NVDA',
      desk_context,
    }),
    signal,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 429) {
    showError(data.message || 'Brief already running');
    return null;
  }
  if (!res.ok) {
    showError(data.error || `Error ${res.status}`);
    return null;
  }
  return data;
}

async function runBriefProgressive(desk_context, signal) {
  const res = await fetch('/api/brief', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({
      question: questionEl.value,
      symbol: symbolEl.value || 'NVDA',
      desk_context,
      progressive: true,
    }),
    signal,
  });

  if (res.status === 429) {
    const data = await res.json().catch(() => ({}));
    showError(data.message || 'Brief already running');
    return null;
  }

  const ct = res.headers.get('content-type') || '';
  if (!res.ok || !ct.includes('text/event-stream') || !res.body) {
    // Fallback: try non-progressive JSON
    if (res.ok && ct.includes('application/json')) {
      return await res.json();
    }
    throw new Error('SSE unavailable');
  }

  let finalPayload = null;
  let sawEarly = false;
  for await (const { event, data } of parseSseStream(res.body)) {
    if (event === 'early') {
      sawEarly = true;
      renderEarly(data);
    } else if (event === 'final') {
      finalPayload = data;
      renderBrief(data);
      await refreshHealth(metaFromBriefData(data));
    } else if (event === 'error') {
      showError(data.message || data.error || 'Brief failed');
      return null;
    }
  }
  if (!finalPayload && !sawEarly) {
    throw new Error('SSE empty');
  }
  return finalPayload;
}

async function runBrief() {
  if (loading) {
    showError('Brief already running');
    return;
  }
  showError('');
  loading = true;
  runBtn.disabled = true;
  runBtn.textContent = 'Brief running…';
  setBadge(badgeSkills, false, 'LIVE SKILLS', 'LABELED MOCK SKILLS');
  setBadge(badgeLlm, 'pending', 'LIVE LLM', 'LABELED MOCK LLM', 'PENDING LLM');

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), BRIEF_TIMEOUT_MS);

  const desk_context = deskContextFromState(readFormDesk());

  try {
    let data = null;
    try {
      data = await runBriefProgressive(desk_context, ctrl.signal);
    } catch (sseErr) {
      if (sseErr.name === 'AbortError') throw sseErr;
      // Fallback: POST without progressive
      data = await runBriefJson(desk_context, ctrl.signal);
      if (data) {
        renderBrief(data);
        await refreshHealth(metaFromBriefData(data));
      }
      return;
    }
    if (data) {
      // final already rendered in progressive path; ensure health synced
      await refreshHealth(metaFromBriefData(data));
    }
  } catch (err) {
    showError(friendlyFetchError(err));
  } finally {
    clearTimeout(timer);
    loading = false;
    runBtn.disabled = false;
    runBtn.textContent = 'Run brief';
  }
}

saveDeskBtn.addEventListener('click', saveDesk);
deskWatchlist.addEventListener('input', () => {
  renderWatchlistChips(parseWatchlist(deskWatchlist.value));
});
runBtn.addEventListener('click', runBrief);
questionEl.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') runBrief();
});

hydrateDesk();
refreshHealth();
