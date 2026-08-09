// MTB Skills Pro — Telegram support bot (Cloudflare Worker, free tier).
// Webhook: POST /webhook  (set via https://api.telegram.org/bot<TOKEN>/setWebhook)
// Firestore access via REST using a Google service account (env secret SERVICE_ACCOUNT).
// Secrets: TELEGRAM_TOKEN, SERVICE_ACCOUNT. Vars: ADMIN_IDS (fallback), PROJECT_ID.

const DEFAULT_FAQ = [
  { q: 'Как сохраняется прогресс?', a: 'Войдите в аккаунт — прогресс автоматически синхронизируется с облаком с любого устройства. Без интернета тренировки тоже сохраняются локально и подхватятся после входа.' },
  { q: 'Что такое скиллы и как их прокачать?', a: 'В приложении 5 трюков (Bunny Hop, Manual, Wheelie, Drop, 180). Каждый прокачивается от 1 до 3 уровней. Тренируйтесь и выполняйте челленджи, чтобы получать очки навыков.' },
  { q: 'Как работают уровни и XP?', a: 'XP дают за тренировки и челленджи. Дневные челленджи обновляются каждый день, недельные — раз в неделю. XP накапливается и повышает ваш уровень.' },
  { q: 'Как добавить байк или видео?', a: 'В разделе «Байк» нажмите добавить и выберите фото из галереи. В разделе «Видео» публикуются ссылки на YouTube-ролики с вашими трюками.' },
  { q: 'Как пригласить друга в дуэль?', a: 'Откройте раздел «Дуэли», создайте дуэль и поделитесь ссылкой. Соперник вводит её у себя, и победитель определяется автоматически.' },
  { q: 'Пропали челленджи после обновления?', a: 'Просто обновите страницу или переустановите PWA. Новый список заданий создаётся при смене дня/недели.' },
  { q: 'Как удалить аккаунт?', a: 'В профиле выберите «Удалить аккаунт» — все данные будут стёрты из облака.' },
  { q: 'Как связаться с поддержкой?', a: 'Нажмите «Задать вопрос» и напишите — мы ответим прямо в этом чате.' }
];

// ── Google OAuth (service account) + Firestore REST ────────────────────────
let _tok = null;

function b64url(s) {
  return btoa(String(s)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlBytes(buf) {
  let bin = '';
  for (let i = 0; i < buf.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
  }
  return b64url(bin);
}
async function makeJwt(sa) {
  const now = Math.floor(Date.now() / 1000);
  const enc = (o) => b64url(JSON.stringify(o));
  const header = enc({ alg: 'RS256', typ: 'JWT' });
  const claims = enc({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  });
  const signingInput = header + '.' + claims;
  const pemB64 = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const raw = Uint8Array.from(atob(pemB64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', raw, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput)));
  return signingInput + '.' + b64urlBytes(sig);
}
async function accessToken(env) {
  if (_tok && _tok.exp > Date.now() + 60000) return _tok.v;
  const sa = JSON.parse(env.SERVICE_ACCOUNT);
  const jwt = await makeJwt(sa);
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }).toString()
  });
  const d = await r.json();
  if (!d.access_token) throw new Error('OAuth fail: ' + JSON.stringify(d).slice(0, 200));
  _tok = { v: d.access_token, exp: Date.now() + (d.expires_in || 3600) * 1000 };
  return _tok.v;
}

function FSB(env) {
  return `https://firestore.googleapis.com/v1/projects/${env.PROJECT_ID}/databases/(default)/documents/`;
}

function encodeVal(v) {
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encodeVal) } };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (v && typeof v === 'object') {
    const fields = {};
    for (const k of Object.keys(v)) fields[k] = encodeVal(v[k]);
    return { mapValue: { fields } };
  }
  return { nullValue: null };
}
function encodeFields(obj) {
  const fields = {};
  for (const k of Object.keys(obj || {})) fields[k] = encodeVal(obj[k]);
  return fields;
}
function decodeVal(f) {
  if ('stringValue' in f) return f.stringValue;
  if ('integerValue' in f) return parseInt(f.integerValue, 10);
  if ('doubleValue' in f) return f.doubleValue;
  if ('booleanValue' in f) return f.booleanValue;
  if ('timestampValue' in f) return f.timestampValue;
  if ('nullValue' in f) return null;
  if ('arrayValue' in f) return (f.arrayValue.values || []).map(decodeVal);
  if ('mapValue' in f) return decodeFields(f.mapValue.fields || {});
  return null;
}
function decodeFields(fields) {
  const out = {};
  for (const k of Object.keys(fields || {})) out[k] = decodeVal(fields[k]);
  return out;
}

async function fsGet(path, env) {
  const token = await accessToken(env);
  const r = await fetch(FSB(env) + path, { headers: { Authorization: 'Bearer ' + token } });
  if (!r.ok) throw new Error('fsGet ' + path + ' ' + r.status);
  const d = await r.json();
  return decodeFields(d.fields || {});
}
async function fsList(collection, env) {
  const token = await accessToken(env);
  const r = await fetch(FSB(env) + collection + '?pageSize=200', { headers: { Authorization: 'Bearer ' + token } });
  if (!r.ok) throw new Error('fsList ' + collection + ' ' + r.status);
  const d = await r.json();
  return (d.documents || []).map((x) => ({ id: x.name.split('/').pop(), data: decodeFields(x.fields || {}) }));
}
function genId() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const rnd = crypto.getRandomValues(new Uint32Array(20));
  let id = '';
  for (let i = 0; i < 20; i++) id += chars[rnd[i] % chars.length];
  return id;
}
async function fsAdd(collection, data, env, docId) {
  const id = docId || genId();
  const token = await accessToken(env);
  const r = await fetch(FSB(env) + collection + '/' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: encodeFields(data) })
  });
  const d = await r.json();
  if (!r.ok) throw new Error('fsAdd ' + collection + ' ' + r.status + ' ' + JSON.stringify(d).slice(0, 200));
  return { id, data };
}
async function fsUpdate(path, fields, env) {
  const token = await accessToken(env);
  const mask = Object.keys(fields).map((k) => 'updateMask.fieldPaths=' + encodeURIComponent(k)).join('&');
  const r = await fetch(FSB(env) + path + '?' + mask, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: encodeFields(fields) })
  });
  if (!r.ok) throw new Error('fsUpdate ' + path + ' ' + r.status);
  return r.json();
}
async function fsDelete(path, env) {
  const token = await accessToken(env);
  await fetch(FSB(env) + path, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
}

// ── Telegram API ────────────────────────────────────────────────────────────
async function tg(method, params, env) {
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params || {})
  });
  let d;
  try { d = await r.json(); } catch (e) { d = { ok: false }; }
  if (!d.ok) console.error('[tg]', method, JSON.stringify(d).slice(0, 300));
  return d;
}

// ── Config / FAQ bootstrap ──────────────────────────────────────────────────
async function ensureConfig(env) {
  let doc;
  try { doc = await fsGet('config/settings', env); } catch (e) { doc = null; }
  if (!doc) {
    const envAdmins = String(env.ADMIN_IDS || '').split(',').filter(Boolean).map(String);
    await fsAdd('config', { admins: envAdmins, updatedAt: new Date() }, env, 'settings');
  }
}
async function ensureFaq(env) {
  const list = await fsList('faq', env);
  if (list.length) return;
  for (let i = 0; i < DEFAULT_FAQ.length; i++) {
    await fsAdd('faq', { q: DEFAULT_FAQ[i].q, a: DEFAULT_FAQ[i].a, order: i }, env, 'faq' + (i + 1));
  }
}
async function getAdmins(env) {
  let doc;
  try { doc = await fsGet('config/settings', env); } catch (e) { doc = null; }
  const envAdmins = String(env.ADMIN_IDS || '').split(',').filter(Boolean).map(String);
  const admins = doc && Array.isArray(doc.admins) ? doc.admins : envAdmins;
  return admins.map(String);
}
async function isAdmin(fromId, env) {
  const admins = await getAdmins(env);
  return admins.indexOf(String(fromId)) >= 0;
}

async function getState(chatId, env) {
  try { return await fsGet('bot_state/' + chatId, env); } catch (e) { return null; }
}
async function setState(chatId, data, env) {
  await fsAdd('bot_state', data, env, String(chatId));
}
async function delState(chatId, env) {
  await fsDelete('bot_state/' + chatId, env).catch(() => {});
}

// ── UI handlers ─────────────────────────────────────────────────────────────
async function sendMenu(chatId, env, extra) {
  const kb = {
    inline_keyboard: [
      [{ text: '💬 Задать вопрос', callback_data: 'ask' }],
      [{ text: '📖 Частые вопросы (FAQ)', callback_data: 'faq' }]
    ]
  };
  const text = (extra ? extra + '\n\n' : '') + 'Привет! Это поддержка приложения MTB Skills Pro 🚵\nВыберите действие:';
  await tg('sendMessage', { chat_id: chatId, text, reply_markup: kb }, env);
}

async function askFlow(chatId, fromId, env) {
  let nick = null;
  try { nick = (await fsGet('tg_users/' + fromId, env)).nickname; } catch (e) {}
  if (nick) {
    await setState(chatId, { stage: 'ask_question' }, env);
    return tg('sendMessage', { chat_id: chatId, text: 'Напишите ваш вопрос 🙂' }, env);
  }
  await setState(chatId, { stage: 'ask_nick' }, env);
  return tg('sendMessage', { chat_id: chatId, text: 'Как вас зовут (ник в приложении)?' }, env);
}

async function createTicket(msg, env) {
  const chatId = msg.chat.id;
  const fromId = String(msg.from.id);
  let nickname = msg.from.username ? '@' + msg.from.username : (msg.from.first_name || '');
  try { nickname = (await fsGet('tg_users/' + fromId, env)).nickname || nickname; } catch (e) {}
  const res = await fsAdd('tickets', {
    userId: fromId,
    chatId,
    username: msg.from.username || null,
    firstName: msg.from.first_name || null,
    nickname,
    text: msg.text,
    status: 'new',
    createdAt: new Date(),
    updatedAt: new Date(),
    replies: []
  }, env);
  const id = res.id;
  await tg('sendMessage', { chat_id: chatId, text: '✅ Вопрос принят (#' + id.slice(0, 6) + '). Поддержка ответит прямо в этом чате.' }, env);
  const admins = await getAdmins(env);
  const kb = {
    inline_keyboard: [
      [{ text: '✍️ Ответить', callback_data: 'reply:' + id }, { text: '❌ Закрыть', callback_data: 'close:' + id }]
    ]
  };
  const notif = '🎫 Новый вопрос #' + id + '\n👤 ' + nickname + ' (' + fromId + ')\n\n' + msg.text;
  for (const a of admins) {
    if (!a) continue;
    try { await tg('sendMessage', { chat_id: a, text: notif, reply_markup: kb }, env); }
    catch (e) { console.error('notify admin', a, e.message); }
  }
}

async function adminReply(chatId, ticketId, text, env) {
  let t;
  try { t = await fsGet('tickets/' + ticketId, env); } catch (e) {}
  if (!t) {
    await tg('sendMessage', { chat_id: chatId, text: 'Тикет не найден.' }, env);
    await delState(chatId, env);
    return;
  }
  await tg('sendMessage', { chat_id: t.chatId, text: '📩 Ответ поддержки:\n\n' + text }, env);
  const replies = Array.isArray(t.replies) ? t.replies : [];
  replies.push({ from: chatId, text, at: new Date().toISOString() });
  await fsUpdate('tickets/' + ticketId, { status: 'answered', updatedAt: new Date(), replies }, env);
  await tg('sendMessage', { chat_id: chatId, text: '✅ Ответ отправлен пользователю.' }, env);
  await delState(chatId, env);
}

async function closeTicket(chatId, ticketId, env) {
  let t;
  try { t = await fsGet('tickets/' + ticketId, env); } catch (e) {}
  if (!t) return tg('sendMessage', { chat_id: chatId, text: 'Тикет не найден.' }, env);
  await fsUpdate('tickets/' + ticketId, { status: 'closed', updatedAt: new Date() }, env);
  try {
    await tg('sendMessage', { chat_id: t.chatId, text: 'Тикет закрыт. Если появится ещё вопрос — просто напишите нам 🙂' }, env);
  } catch (e) {}
  return tg('sendMessage', { chat_id: chatId, text: 'Тикет #' + ticketId + ' закрыт.' }, env);
}

async function sendOpenTickets(chatId, env) {
  const list = await fsList('tickets', env);
  const sorted = list.sort((a, b) => String(b.data.createdAt || '').localeCompare(String(a.data.createdAt || ''))).slice(0, 15);
  if (!sorted.length) return tg('sendMessage', { chat_id: chatId, text: 'Тикетов нет.' }, env);
  let text = 'Последние тикеты:\n';
  for (const d of sorted) {
    const t = d.data;
    const open = t.status === 'new' || t.status === 'answered';
    text += '\n' + (open ? '🟢' : '⚪') + ' #' + d.id.slice(0, 6) + ' [' + t.status + '] ' + (t.nickname || '') + ': ' + String(t.text || '').slice(0, 50);
  }
  return tg('sendMessage', { chat_id: chatId, text }, env);
}

async function faqList(chatId, env) {
  const list = (await fsList('faq', env)).sort((a, b) => (a.data.order || 0) - (b.data.order || 0)).slice(0, 15);
  const kb = {
    inline_keyboard: [
      ...list.map((r) => [{ text: String(r.data.q).slice(0, 42), callback_data: 'faq:' + r.id }]),
      [{ text: '💬 Задать вопрос', callback_data: 'ask' }],
      [{ text: '🔙 В меню', callback_data: 'menu' }]
    ]
  };
  return tg('sendMessage', { chat_id: chatId, text: 'Частые вопросы — выберите тему:', reply_markup: kb }, env);
}

async function faqShow(chatId, id, env) {
  let f;
  try { f = await fsGet('faq/' + id, env); } catch (e) {}
  if (!f) return faqList(chatId, env);
  const kb = {
    inline_keyboard: [
      [{ text: '📖 Все вопросы', callback_data: 'faq' }],
      [{ text: '💬 Задать вопрос', callback_data: 'ask' }],
      [{ text: '🔙 В меню', callback_data: 'menu' }]
    ]
  };
  return tg('sendMessage', { chat_id: chatId, text: '❓ ' + f.q + '\n\n' + f.a, reply_markup: kb }, env);
}

async function faqAdd(chatId, text, env) {
  const body = text.replace(/^\/faqadd\s+/i, '');
  const idx = body.indexOf('||');
  if (idx < 0) return tg('sendMessage', { chat_id: chatId, text: 'Формат: /faqadd Вопрос || Ответ' }, env);
  const q = body.slice(0, idx).trim();
  const a = body.slice(idx + 2).trim();
  if (!q || !a) return tg('sendMessage', { chat_id: chatId, text: 'Заполните вопрос и ответ.' }, env);
  const list = await fsList('faq', env);
  const order = list.length ? Math.max(...list.map((x) => x.data.order || 0)) + 1 : 0;
  const res = await fsAdd('faq', { q, a, order }, env);
  return tg('sendMessage', { chat_id: chatId, text: '✅ Добавлено: ' + q + ' (id ' + res.id + ')' }, env);
}

async function faqDel(chatId, text, env) {
  const id = text.replace(/^\/faqdel\s+/i, '').trim();
  if (!id) return tg('sendMessage', { chat_id: chatId, text: 'Формат: /faqdel <id>. Список: /faqlist' }, env);
  await fsDelete('faq/' + id, env).catch(() => {});
  return tg('sendMessage', { chat_id: chatId, text: 'Удалено (если существовало).' }, env);
}

async function faqListAdmin(chatId, env) {
  const list = (await fsList('faq', env)).sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
  if (!list.length) return tg('sendMessage', { chat_id: chatId, text: 'FAQ пуст.' }, env);
  let text = 'FAQ (id — вопрос):\n';
  for (const d of list) text += '\n' + d.id + ' — ' + d.data.q;
  return tg('sendMessage', { chat_id: chatId, text }, env);
}

async function setAdmin(chatId, text, env) {
  const id = text.replace(/^\/setadmin\s+/i, '').trim();
  if (!/^\d+$/.test(id)) return tg('sendMessage', { chat_id: chatId, text: 'Формат: /setadmin <telegram_id>' }, env);
  let doc = null;
  try { doc = await fsGet('config/settings', env); } catch (e) {}
  const admins = doc && Array.isArray(doc.admins) ? doc.admins : [];
  if (admins.map(String).indexOf(id) >= 0) return tg('sendMessage', { chat_id: chatId, text: 'Уже админ.' }, env);
  admins.push(String(id));
  await fsUpdate('config/settings', { admins }, env);
  return tg('sendMessage', { chat_id: chatId, text: '✅ Добавлен админ: ' + id }, env);
}

async function handleMessage(msg, env) {
  const chatId = msg.chat.id;
  const fromId = String(msg.from.id);
  const text = String(msg.text || '').trim();
  if (!text) return;

  await ensureConfig(env);
  await ensureFaq(env);

  if (text === '/start' || text === '/menu' || text === '/help') return sendMenu(chatId, env);

  if (text === '/list' && await isAdmin(fromId, env)) return sendOpenTickets(chatId, env);
  if (text.startsWith('/close ') && await isAdmin(fromId, env)) return closeTicket(chatId, text.replace(/^\/close\s+/i, '').trim(), env);
  if (text.startsWith('/faqadd ') && await isAdmin(fromId, env)) return faqAdd(chatId, text, env);
  if (text.startsWith('/faqdel ') && await isAdmin(fromId, env)) return faqDel(chatId, text, env);
  if (text === '/faqlist' && await isAdmin(fromId, env)) return faqListAdmin(chatId, env);
  if (text.startsWith('/setadmin ') && await isAdmin(fromId, env)) return setAdmin(chatId, text, env);

  const state = await getState(chatId, env);
  if (state) {
    if (state.stage === 'ask_nick') {
      try { await fsAdd('tg_users', { nickname: text.slice(0, 24) }, env, fromId); }
      catch (e) { await fsUpdate('tg_users/' + fromId, { nickname: text.slice(0, 24) }, env); }
      await setState(chatId, { stage: 'ask_question' }, env);
      return tg('sendMessage', { chat_id: chatId, text: 'Спасибо! Напишите ваш вопрос, постарайтесь описать проблему подробнее 🙂' }, env);
    }
    if (state.stage === 'ask_question') {
      await createTicket(msg, env);
      await delState(chatId, env);
      return;
    }
    if (state.stage === 'ask_reply' && state.ticketId) {
      if (!(await isAdmin(fromId, env))) { await delState(chatId, env); return sendMenu(chatId, env); }
      await adminReply(chatId, state.ticketId, text, env);
      return;
    }
  }
  return sendMenu(chatId, env, 'Не понял команду 🙂');
}

async function handleCallback(cq, env) {
  const data = String(cq.data || '');
  const chatId = cq.message.chat.id;
  const fromId = String(cq.from.id);
  await tg('answerCallbackQuery', { callback_query_id: cq.id }, env).catch(() => {});

  if (data === 'ask') return askFlow(chatId, fromId, env);
  if (data === 'faq') return faqList(chatId, env);
  if (data.startsWith('faq:')) return faqShow(chatId, data.slice(4), env);
  if (data === 'menu') return sendMenu(chatId, env);

  if (data.startsWith('reply:') && await isAdmin(fromId, env)) {
    const ticketId = data.slice(6);
    await setState(chatId, { stage: 'ask_reply', ticketId }, env);
    return tg('sendMessage', { chat_id: chatId, text: 'Напишите ответ для пользователя:' }, env);
  }
  if (data.startsWith('close:') && await isAdmin(fromId, env)) {
    return closeTicket(chatId, data.slice(6), env);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/webhook') return new Response('MTB support bot. Use POST /webhook', { status: 200 });
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    try {
      const upd = await request.json();
      if (upd && upd.callback_query) await handleCallback(upd.callback_query, env);
      else if (upd && upd.message) await handleMessage(upd.message, env);
    } catch (e) {
      console.error('[webhook]', e);
    }
    return new Response('ok', { status: 200 });
  }
};
