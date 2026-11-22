// DocTalk-বাংলা — Health Quiz Contest (front end). Scoring, timing and answers live on the server (Google Apps Script).
(function () {
'use strict';
// ===== settings =====
const QUIZ_API = 'https://script.google.com/macros/s/AKfycbzFMFaEF07XPV-SZvXGXrSSi_mD1_WEsU5Ranc9KgNixZq0UvlPtbq1m8s8wyFwXck7/exec';   // ← paste the Google Apps Script web-app URL here (ends with /exec)
const FB_URL = 'https://www.facebook.com/profile.php?id=61596380207663';
const QUIZ_URL = 'https://doctalk-bangla.github.io/quiz.html';

// ===== helpers =====
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const BND = '০১২৩৪৫৬৭৮৯';
const bn = (x) => String(x).replace(/\d/g, (c) => BND[c]);
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
const ORD = ['', '১ম', '২য়', '৩য়', '৪র্থ', '৫ম', '৬ষ্ঠ', '৭ম', '৮ম', '৯ম', '১০ম'];
const ord = (n) => ORD[n] || bn(n) + 'তম';
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || '#0F2A4F';
const ERR = {
  closed: 'এই প্রতিযোগিতা এখন বন্ধ। নতুন কুইজের খবর পেতে পেজ ফলো করুন।',
  name: 'আপনার নাম লিখুন (কমপক্ষে ২ অক্ষর)।', phone: 'সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)।', district: 'জেলা বেছে নিন।',
  already: 'এই নম্বর দিয়ে এই প্রতিযোগিতায় আগেই খেলা হয়েছে। প্রতি নম্বরে একবারই খেলা যায়।',
  device_limit: 'এই ডিভাইস থেকে সর্বোচ্চ ২টি নম্বর দিয়ে খেলা যায়।', slow_down: 'অনেকবার চেষ্টা হয়েছে। ১০ মিনিট পর আবার চেষ্টা করুন।',
  bot: 'দুঃখিত, আবার চেষ্টা করুন।', device: 'পেজটি রিফ্রেশ করে আবার চেষ্টা করুন।', session: 'সেশন শেষ হয়ে গেছে। পেজ রিফ্রেশ করুন।',
  net: 'ইন্টারনেট সংযোগে সমস্যা। আবার চেষ্টা করুন।', server: 'সার্ভারে সমস্যা হয়েছে, একটু পর আবার চেষ্টা করুন।'
};

// device id (one per browser)
let DEV = store.get('qz_dev', '');
if (!DEV) { DEV = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()).replace(/-/g, ''); store.set('qz_dev', DEV); }

// ===== api =====
async function api(action, body) {
  if (!QUIZ_API) throw { err: 'closed' };
  let r;
  try {
    r = body ? await fetch(QUIZ_API, { method: 'POST', body: JSON.stringify(Object.assign({ action }, body)) })
             : await fetch(QUIZ_API + (QUIZ_API.includes('?') ? '&' : '?') + 'action=' + action + '&_=' + Date.now());
  } catch (e) { throw { err: 'net' }; }
  let j; try { j = await r.json(); } catch (e) { throw { err: 'server' }; }
  if (!j.ok) throw j;
  return j;
}

// ===== screens =====
let STATUS = null, boardTimer = null;
function show(name) {
  if (name === 'form' || name === 'play') {
    if (STATUS && !STATUS.open) name = 'closed';
    const mine = STATUS && store.get('qz_res_' + STATUS.cycle, null);
    if (mine && name === 'form') { renderResult(mine, false); name = 'result'; }
  }
  $$('[data-screen]').forEach((s) => { s.hidden = s.dataset.screen !== name; });
  clearInterval(boardTimer);
  if (name === 'board') { loadBoard(); boardTimer = setInterval(loadBoard, 30000); }
  if (name !== 'play') window.scrollTo(0, 0);
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-go]'); if (!a) return;
  e.preventDefault();
  const go = a.dataset.go;
  if (go === 'rules') { show('home'); const d = $('#rules'); d.open = true; setTimeout(() => d.scrollIntoView({ behavior: 'smooth' }), 50); return; }
  if (PLAYING) return;                       // no navigation during the quiz
  show(go);
});
$$('[data-fb]').forEach((a) => { a.href = FB_URL; a.target = '_blank'; a.rel = 'noopener'; });

// ===== status + countdown =====
async function loadStatus() {
  try { STATUS = await api('status'); } catch (e) { STATUS = { open: false, cycle: 0, err: e.err }; }
  if (STATUS.cycle) $('#cycleNo').textContent = '· রাউন্ড ' + bn(STATUS.cycle);
  if (STATUS.players) { $('#playersN').textContent = bn(STATUS.players); $('#playersLine').hidden = false; }
  const mine = STATUS.cycle && store.get('qz_res_' + STATUS.cycle, null);
  if (mine) { $('#playBtn').textContent = '✓ আপনার ফলাফল দেখুন'; }
  if (!STATUS.open) {
    $('#playBtn').textContent = 'প্রতিযোগিতা এখন বন্ধ';
    if (STATUS.start && Date.now() < Date.parse(STATUS.start)) { $('#closedT').textContent = 'কুইজ শিগগিরই শুরু হচ্ছে!'; }
    else if (STATUS.end) { $('#closedT').textContent = 'এই রাউন্ড শেষ হয়েছে 🎉'; $('#closedP').textContent = 'বিজয়ীর নাম শিগগিরই আমাদের ফেসবুক পেজে ঘোষণা হবে। পরের রাউন্ডের খবর পেতে পেজ ফলো করুন।'; }
  }
  tick(); setInterval(tick, 1000);
  const h = location.hash.slice(1);
  if (['board', 'form'].includes(h)) show(h);
}
function tick() {
  if (!STATUS || !STATUS.end) return;
  const target = Date.now() < Date.parse(STATUS.start) ? Date.parse(STATUS.start) : Date.parse(STATUS.end);
  if (target === Date.parse(STATUS.start)) $('#cdLabel').textContent = 'কুইজ শুরু হতে বাকি';
  let s = Math.max(0, Math.floor((target - Date.now()) / 1000));
  const d = Math.floor(s / 86400); s -= d * 86400; const h = Math.floor(s / 3600); s -= h * 3600; const m = Math.floor(s / 60); s -= m * 60;
  const pad = (n) => bn(String(n).padStart(2, '0'));
  $('[data-cd=d]').textContent = pad(d); $('[data-cd=h]').textContent = pad(h); $('[data-cd=m]').textContent = pad(m); $('[data-cd=s]').textContent = pad(s);
}

// ===== districts =====
fetch('data/geo.json').then((r) => r.json()).then((g) => {
  const sel = $('#distSel');
  g.dist.map((d) => d[3]).sort((a, b) => a.localeCompare(b, 'bn')).forEach((n) => { const o = document.createElement('option'); o.value = o.textContent = n; sel.appendChild(o); });
}).catch(() => {});

// ===== form =====
$('#joinForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target, err = $('#formErr'); err.textContent = '';
  const name = f.name.value.trim(), phone = f.phone.value.trim(), district = f.district.value;
  const digits = phone.replace(/[০-৯]/g, (c) => BND.indexOf(c)).replace(/\D/g, '').replace(/^880/, '0').replace(/^00/, '0');
  if (name.length < 2) return (err.textContent = ERR.name);
  if (!/^01[3-9]\d{8}$/.test(digits)) return (err.textContent = ERR.phone);
  if (!district) return (err.textContent = ERR.district);
  if (!f.agree.checked) return (err.textContent = 'নিয়মাবলি মেনে নেওয়ার ঘরে টিক দিন।');
  $('#startBtn').disabled = true;
  PLAYING = true; show('play'); $('#ready').hidden = false; $('#qbox').hidden = true;
  await document.fonts.load('600 20px "Hind Siliguri"').catch(() => {});
  for (const n of [3, 2, 1]) { $('#readyN').textContent = bn(n); await sleep(800); }
  $('#readyN').textContent = '…';
  try {
    const r = await api('start', { name, phone: digits, district, dev: DEV, hp: f.website.value });
    SESSION = { t: r.token, total: r.total, name, phone: digits };
    store.set('qz_me', { n: name, p: digits.slice(-3) });
    renderQ(r.q);
  } catch (x) {
    PLAYING = false; show('form'); err.textContent = ERR[x.err] || ERR.server; $('#startBtn').disabled = false;
  }
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ===== play =====
let PLAYING = false, SESSION = null, CUR = null, timer = null, left = false, blurAt = 0, sending = false;
function renderQ(q) {
  CUR = q; left = false; sending = false;
  $('#ready').hidden = true; $('#qbox').hidden = false; $('#leftWarn').hidden = true;
  $('#qNo').textContent = `প্রশ্ন ${bn(q.i + 1)}/${bn(q.n)}`;
  drawText($('#qCanvas'), q.q, { size: 21, weight: 700, pad: 18, color: css('--ink') });
  const box = $('#opts'); box.innerHTML = ''; box.classList.remove('locked');
  q.o.forEach((txt, k) => {
    const b = document.createElement('button'); b.className = 'opt'; b.type = 'button'; b.setAttribute('aria-label', 'অপশন ' + bn(k + 1));
    const c = document.createElement('canvas'); b.appendChild(c); box.appendChild(b);
    drawText(c, ['ক', 'খ', 'গ', 'ঘ'][k] + ')  ' + txt, { size: 18, weight: 600, pad: 14, color: css('--ink') });
    b.addEventListener('click', () => submit(k, b));
  });
  const total = q.sec, t0 = performance.now();
  clearInterval(timer);
  const upd = () => {
    const rem = Math.max(0, total - (performance.now() - t0) / 1000);
    $('#tmr').textContent = bn(Math.ceil(rem)); $('#tmr').classList.toggle('low', rem <= 5);
    $('#barFill').style.transform = `scaleX(${rem / total})`;
    if (rem <= 0) { clearInterval(timer); submit(-1, null); }
  };
  upd(); timer = setInterval(upd, 100);
}
async function submit(k, btn) {
  if (sending || !CUR) return; sending = true; clearInterval(timer);
  $('#opts').classList.add('locked'); if (btn) btn.classList.add('picked');
  if (blurAt && Date.now() - blurAt > 1500) left = true;
  let r;
  for (let attempt = 0; attempt < 3; attempt++) {
    try { r = await api('answer', { t: SESSION.t, i: CUR.i, c: k, blur: left }); break; }
    catch (x) { if (x.err !== 'net' || attempt === 2) { PLAYING = false; alert(ERR[x.err] || ERR.server); location.reload(); return; } await sleep(1200); }
  }
  if (r.done) return finish(r);
  renderQ(r.q);
}
// leaving the page / switching app during a question = that answer is void
document.addEventListener('visibilitychange', () => { if (PLAYING && CUR && document.hidden) { left = true; $('#leftWarn').hidden = false; } });
window.addEventListener('blur', () => { if (PLAYING && CUR) blurAt = Date.now(); });
window.addEventListener('focus', () => { if (PLAYING && CUR && blurAt && Date.now() - blurAt > 1500) { left = true; $('#leftWarn').hidden = false; } blurAt = 0; });
['copy', 'cut', 'contextmenu', 'selectstart', 'dragstart'].forEach((ev) => document.addEventListener(ev, (e) => { if (PLAYING) e.preventDefault(); }));
window.addEventListener('beforeunload', (e) => { if (PLAYING) { e.preventDefault(); e.returnValue = ''; } });

// Questions are drawn on a canvas (not selectable text) so they can't be copy-pasted into AI tools.
function drawText(cv, text, o) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5), w = cv.parentElement.clientWidth || 320;
  const ctx = cv.getContext('2d'), font = `${o.weight} ${o.size}px "Hind Siliguri", sans-serif`;
  ctx.font = font;
  const maxW = w - o.pad * 2, words = text.split(' '), lines = []; let line = '';
  words.forEach((wd) => { const t = line ? line + ' ' + wd : wd; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = wd; } else line = t; });
  if (line) lines.push(line);
  const lh = o.size * 1.55, h = Math.ceil(lines.length * lh + o.pad * 2);
  cv.width = w * dpr; cv.height = h * dpr; cv.style.height = h + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.font = font; ctx.fillStyle = o.color; ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, o.pad, o.pad + lh * i + lh / 2));
}

// ===== result =====
function finish(r) {
  PLAYING = false; CUR = null;
  const res = { cycle: STATUS.cycle, score: r.score, total: r.total, timeSec: r.timeSec, rank: r.rank, players: r.players, name: SESSION.name };
  store.set('qz_res_' + STATUS.cycle, res);
  renderResult(res, true); show('result');
}
function renderResult(res, fresh) {
  // result stays blurred until the player taps Follow on this round's result screen
  const gateKey = 'qz_fr_' + res.cycle, card = $('#rCard');
  if (!store.get(gateKey, false)) {
    card.classList.add('locked');
    const gb = $('#fGateBtn'); gb.href = FB_URL;
    gb.onclick = () => {
      store.set(gateKey, true); store.set('fb_followed', true);
      try { fetch('https://countapi.mileshilliard.com/api/v1/hit/doctalk-bangla-quiz-follow', { keepalive: true }); } catch (e) {}
      setTimeout(() => { card.classList.remove('locked'); card.classList.add('reveal'); }, 1200);
    };
  } else card.classList.remove('locked');
  $('#rScore').textContent = bn(res.score); $('.score span').textContent = '/' + bn(res.total || 15);
  $('#rTime').textContent = bn(res.timeSec); $('#rRank').textContent = res.rank ? ord(res.rank) + (res.players ? ` (${bn(res.players)} জনের মধ্যে)` : '') : '-';
  const s = res.score;
  $('#rMsg').textContent = s >= 14 ? 'অসাধারণ! আপনি তো একেবারে ডাক্তারি লেভেলে 🩺🔥' : s >= 11 ? 'দারুণ! আপনার স্বাস্থ্য জ্ঞান খুব ভালো 👏' : s >= 7 ? 'ভালো চেষ্টা! আরও জানতে আমাদের পেজ ফলো করুন 💪' : 'স্বাস্থ্য জ্ঞান বাড়ানোর সময় এসেছে! আমাদের ভিডিওগুলো দেখুন 📚';
  $('#fbShare').href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(QUIZ_URL);
  makeCard(res).then((blob) => {
    CARD = blob; $('#shareImg').src = URL.createObjectURL(blob);
  });
}
let CARD = null;
$('#shareBtn').addEventListener('click', async () => {
  const text = `আমি DocTalk-বাংলার স্বাস্থ্য কুইজে ১৫-তে ${bn(store.get('qz_res_' + STATUS.cycle, {}).score || 0)} পেয়েছি! 🩺 তুমি কি আমাকে হারাতে পারবে? জিতে নাও সারপ্রাইজ গিফট হ্যাম্পার 🎁`;
  try {
    const file = CARD && new File([CARD], 'doctalk-quiz-score.png', { type: 'image/png' });
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: text + ' ' + QUIZ_URL }); return; }
    if (navigator.share) { await navigator.share({ title: 'DocTalk-বাংলা স্বাস্থ্য কুইজ', text, url: QUIZ_URL }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  if (CARD) { const a = document.createElement('a'); a.href = URL.createObjectURL(CARD); a.download = 'doctalk-quiz-score.png'; a.click(); }
  window.open($('#fbShare').href, '_blank', 'noopener');
});
async function makeCard(res) {
  await document.fonts.load('700 60px "Hind Siliguri"').catch(() => {});
  const W = 1080, H = 1080, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#0B2346'); g.addColorStop(1, '#0E4C6E'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  const g2 = x.createRadialGradient(900, 180, 20, 900, 180, 520); g2.addColorStop(0, 'rgba(63,224,207,.35)'); g2.addColorStop(1, 'rgba(63,224,207,0)'); x.fillStyle = g2; x.fillRect(0, 0, W, H);
  x.fillStyle = 'rgba(255,255,255,.06)'; for (let i = 0; i < W; i += 36) for (let j = 0; j < H; j += 36) { x.beginPath(); x.arc(i, j, 2, 0, 7); x.fill(); }
  x.textAlign = 'center'; x.fillStyle = '#fff';
  x.textAlign = 'left'; x.font = '700 46px "Plus Jakarta Sans", sans-serif'; const w1 = x.measureText('DocTalk').width; x.font = '600 42px "Hind Siliguri"'; const w2 = x.measureText('-বাংলা').width;
  const lx = (W - w1 - w2) / 2; x.font = '700 46px "Plus Jakarta Sans", sans-serif'; x.fillText('DocTalk', lx, 120); x.fillStyle = '#3FE0CF'; x.font = '600 42px "Hind Siliguri"'; x.fillText('-বাংলা', lx + w1, 120); x.textAlign = 'center';
  x.fillStyle = '#C9D6E8'; x.font = '600 44px "Hind Siliguri"'; x.fillText('স্বাস্থ্য কুইজ চ্যালেঞ্জ', W / 2, 210);
  x.fillStyle = '#fff'; x.font = '700 64px "Hind Siliguri"'; x.fillText('আমি পেয়েছি', W / 2, 340);
  const sg = x.createLinearGradient(300, 0, 780, 0); sg.addColorStop(0, '#5AAEFF'); sg.addColorStop(1, '#3FE0CF'); x.fillStyle = sg;
  x.font = '800 230px "Plus Jakarta Sans", sans-serif'; x.fillText(`${res.score}/${res.total || 15}`, W / 2, 560);
  x.fillStyle = '#E6EEF8'; x.font = '600 46px "Hind Siliguri"'; x.fillText(`সময়: ${bn(res.timeSec)} সেকেন্ড` + (res.rank ? `  ·  অবস্থান: ${ord(res.rank)}` : ''), W / 2, 650);
  // gift box
  const bx = W / 2 - 60, by = 700; x.fillStyle = '#16B6A8'; x.fillRect(bx, by + 30, 120, 90); x.fillStyle = '#3FE0CF'; x.fillRect(bx - 10, by + 8, 140, 30); x.fillStyle = '#FFC94A'; x.fillRect(bx + 50, by + 8, 20, 112);
  x.beginPath(); x.ellipse(bx + 40, by + 4, 24, 12, -0.5, 0, 7); x.ellipse(bx + 80, by + 4, 24, 12, 0.5, 0, 7); x.fill();
  x.fillStyle = '#FFC94A'; x.font = '700 60px "Hind Siliguri"'; x.fillText('তুমি কি পারবে আমাকে হারাতে?', W / 2, 900);
  x.fillStyle = '#C9D6E8'; x.font = '600 38px "Plus Jakarta Sans", sans-serif'; x.fillText('doctalk-bangla.github.io/quiz.html', W / 2, 990);
  return new Promise((r) => c.toBlob(r, 'image/png'));
}

// ===== leaderboard =====
async function loadBoard() {
  const ol = $('#board');
  try {
    const b = await api('board'); const me = store.get('qz_me', null);
    $('#bUpd').textContent = `${bn(b.players)} জন খেলেছেন`;
    if (!b.top.length) { ol.innerHTML = '<li class="muted">এখনো কেউ খেলেনি, প্রথম হোন আপনিই! 🚀</li>'; return; }
    ol.innerHTML = b.top.map((r, i) => {
      const mine = me && r.p === '***' + me.p && me.n.startsWith(r.n.split(' ')[0]);
      const medal = ['🥇', '🥈', '🥉'][i] || bn(i + 1);
      return `<li class="${mine ? 'me' : ''}"><span class="rk">${medal}</span><span class="nm"><b>${esc(r.n)}${mine ? ' (আপনি)' : ''}</b><span>${esc(r.d)} · ${esc(r.p)}</span></span><span class="sc">${bn(r.s)}/১৫<span>${bn(r.tm)} সে.</span></span></li>`;
    }).join('');
  } catch (x) { ol.innerHTML = `<li class="muted">${x.err === 'closed' ? 'লিডারবোর্ড শিগগিরই চালু হবে।' : ERR.net}</li>`; }
}
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ===== follow popup (same as main site) =====
(function followGate() {
  const dlg = $('#followDlg'), btn = $('#followBtn');
  if (!dlg || store.get('fb_followed', false)) return;
  btn.href = FB_URL; btn.target = '_blank'; btn.rel = 'noopener';
  btn.addEventListener('click', () => {
    store.set('fb_followed', true);
    try { fetch('https://countapi.mileshilliard.com/api/v1/hit/doctalk-bangla-follow-clicks', { keepalive: true }); } catch (err) {}
    setTimeout(() => dlg.close(), 100);
  });
  dlg.addEventListener('cancel', (e) => e.preventDefault());
  setTimeout(() => { try { dlg.showModal(); } catch (e) {} }, 1200);
})();

// quiz page visits (same free counter as the site)
try { if (!store.get('qz_vc', false)) { fetch('https://countapi.mileshilliard.com/api/v1/hit/doctalk-bangla-quiz-visits'); store.set('qz_vc', true); } } catch (e) {}

loadStatus();
})();
