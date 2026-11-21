{
// ===== settings (edit these) =====
const CONFIG = {
  FB_URL: 'https://www.facebook.com/profile.php?id=61596380207663',   // Facebook page link
  SURVEY_URL: ''                                      // Google Apps Script web-app URL (survey answers -> Google Sheet)
};
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const L = (bn, en) => `<span lang="bn">${bn}</span><span lang="en">${en}</span>`;
const BND = '০১২৩৪৫৬৭৮৯';
const isBn = () => document.documentElement.dataset.lang === 'bn';
const num = (x, d = 0) => { const s = Number(x).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d }); return isBn() ? s.replace(/\d/g, (c) => BND[c]) : s; };
const NB = (x, d = 0) => `<span lang="bn">${Number(x).toLocaleString('en-US', { maximumFractionDigits: d }).replace(/\d/g, (c) => BND[c])}</span><span lang="en">${Number(x).toLocaleString('en-US', { maximumFractionDigits: d })}</span>`;
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
const ICON = {
  calc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="3" width="14" height="18" rx="3"/><path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3v6a4 4 0 0 0 8 0V3"/><path d="M10 13v3a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="12" r="2"/></svg>',
  tk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
  baby: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/></svg>',
  drop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/></svg>',
  sos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>'
};

// ===== language + routing =====
function setLang(l) { document.documentElement.dataset.lang = l; document.documentElement.lang = l; $('#langBtn').textContent = l === 'bn' ? 'English' : 'বাংলা'; store.set('lang', l); rerender(); }
$('#langBtn').addEventListener('click', () => setLang(isBn() ? 'en' : 'bn'));
$('#menuBtn').addEventListener('click', () => $('#links').classList.toggle('open'));
const VIEWS = ['home', 'health', 'tools', 'find', 'doctor', 'prices', 'learn', 'about'];
function route() {
  let v = (location.hash || '#home').slice(1); if (v === 'privacy') v = 'about'; if (!VIEWS.includes(v)) v = 'home';
  $$('[data-view]').forEach((s) => s.classList.toggle('hidden', s.dataset.view !== v));
  $$('#links a').forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + v));
  $('#links').classList.remove('open'); window.scrollTo(0, 0);
  if (v === 'find') initMap();
}
window.addEventListener('hashchange', route);
$$('[data-fb]').forEach((a) => { a.href = CONFIG.FB_URL; a.target = '_blank'; a.rel = 'noopener'; });

// ===== data =====
const DATA = { posts: [], geo: null, prices: null, alerts: null, lib: null };
const DATA_V = '20261121c';
const getJSON = (u) => fetch(u + (u.includes('?') ? '&' : '?') + 'v=' + DATA_V).then((r) => r.json()).catch(() => null);

// ===== alerts =====
function renderAlerts() {
  const a = DATA.alerts; if (!a || !a.items.length) { $('.alert').classList.add('hidden'); return; }
  let i = 0; const show = () => { const it = a.items[i % a.items.length]; $('#alertText').innerHTML = L(it.bn, it.en); i++; };
  show(); if (a.items.length > 1 && !renderAlerts.t) renderAlerts.t = setInterval(show, 7000);
}

// ===== home features =====
const FEATURES = [
  ['book', '#health', 'রোগ A–Z ও প্রাথমিক চিকিৎসা', 'Diseases A–Z & first aid', '২২টি রোগ, ১২টি জরুরি অবস্থায় করণীয়, চেকআপ গাইড', '22 diseases, 12 first-aid guides, check-up guide'],
  ['calc', '#tools', 'হেলথ ক্যালকুলেটর', 'Health calculators', 'BMI, ক্যালোরি, পানি, প্রেসার ও সুগার রিডিং, ডায়াবেটিস ঝুঁকি', 'BMI, calories, water, BP & sugar readings, diabetes risk'],
  ['pin', '#find', 'কাছের হাসপাতাল', 'Nearby hospitals', 'সারা বাংলাদেশ: বিভাগ, জেলা, উপজেলা বেছে খুঁজুন', 'All of Bangladesh: search by division, district, upazila'],
  ['doc', '#doctor', 'কোন রোগে কোন ডাক্তার', 'Which doctor to see', 'সমস্যা অনুযায়ী সঠিক বিশেষজ্ঞ ও বিপদ চিহ্ন', 'The right specialist and red-flag signs'],
  ['tk', '#prices', 'ল্যাব টেস্টের দাম', 'Lab test prices', 'সরকারি বনাম বেসরকারি দামের তুলনা', 'Government vs private price comparison'],
  ['baby', '#learn', 'শিশুর টিকা', 'Child vaccines', 'জন্মতারিখ দিয়ে টিকার পরের তারিখ জানুন', 'Enter birth date to see upcoming vaccines'],
  ['drop', '#tools', 'রক্তদান', 'Blood donation', 'কে কাকে রক্ত দিতে পারে, আমি কি দিতে পারব?', 'Who can give to whom, can I donate?'],
  ['book', '#learn', 'কুইজ ও ডিকশনারি', 'Quizzes & dictionary', 'ভুল ধারণা বনাম সত্য, মেডিকেল শব্দের মানে', 'Myths vs facts, medical words explained']
];
function renderFeatures() { $('#featureGrid').innerHTML = FEATURES.map(([i, h, tb, te, db, de]) => `<a class="card link" href="${h}" style="text-decoration:none;color:inherit"><div class="ico">${ICON[i]}</div><h3>${L(tb, te)}</h3><p class="muted small" style="margin:0">${L(db, de)}</p></a>`).join(''); }

// ===== posts =====
const fmtDate = (d) => { const [y, m, dd] = d.split('-').map(Number); const mb = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'], me = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; return L(`${NB(dd)} ${mb[m - 1]} ${NB(y).replace(/,/g, '')}`, `${dd} ${me[m - 1]} ${y}`); };
const postCard = (p, i) => `<article class="card post link" data-post="${i}"><img src="${p.img}" alt="" loading="lazy"><p class="small muted" style="margin:10px 0 0">${fmtDate(p.date)}</p><h3>${p.title}</h3></article>`;
function renderPosts() { $('#latestPosts').innerHTML = DATA.posts.slice(0, 3).map(postCard).join('') || `<p class="muted">${L('লোড হচ্ছে…', 'Loading…')}</p>`; }
document.addEventListener('click', (e) => { const c = e.target.closest('[data-post]'); if (!c) return; const p = DATA.posts[+c.dataset.post]; openDlg(p.title, `<img src="${p.img}" alt="" style="width:100%;border-radius:12px;margin-bottom:14px">${esc(p.body)}${p.body ? '' : ''}<p class="small muted">${L('পোস্টের লেখা বাংলায়।', 'Post text is in Bangla.')}</p>`); });
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
function openDlg(t, h) { $('#dlgTitle').innerHTML = t; $('#dlgBody').innerHTML = h; $('#dlg').showModal(); }
$('#dlgClose').addEventListener('click', () => $('#dlg').close());

// ===== tools =====
const TOOLS = [
  ['bmi', 'BMI', 'BMI'], ['cal', 'ক্যালোরি', 'Calories'], ['water', 'পানি', 'Water'], ['bp', 'প্রেসার', 'Blood pressure'],
  ['sugar', 'সুগার', 'Blood sugar'], ['risk', 'ডায়াবেটিস ঝুঁকি', 'Diabetes risk'], ['preg', 'প্রেগন্যান্সি তারিখ', 'Due date'], ['period', 'মাসিক ক্যালেন্ডার', 'Period calendar'], ['sleep', 'ঘুমের সময়', 'Sleep timer'], ['waist', 'কোমর-উচ্চতা', 'Waist-to-height'], ['blood', 'রক্তদান', 'Blood donation']
];
let curTool = store.get('tool', 'bmi');
function renderToolTabs() { $('#toolTabs').innerHTML = TOOLS.map(([id, b, e]) => `<button data-tool="${id}" class="${id === curTool ? 'on' : ''}">${L(b, e)}</button>`).join(''); }
$('#toolTabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tool]'); if (!b) return; curTool = b.dataset.tool; store.set('tool', curTool); renderToolTabs(); renderTool(); });
const inp = (id, lb, le, attrs = '') => `<div><label for="${id}">${L(lb, le)}</label><input id="${id}" ${attrs}></div>`;
const sel = (id, lb, le, opts) => `<div><label for="${id}">${L(lb, le)}</label><select id="${id}">${opts.map(([v, b, e]) => `<option value="${v}">${isBn() ? b : e}</option>`).join('')}</select></div>`;
const toolWrap = (form, title) => `<div class="tool"><div><h3>${title}</h3>${form}</div><div class="result" id="res" aria-live="polite"></div></div>`;
const saved = store.get('vals', {});
function bindInputs(fn) { $$('#toolBox input,#toolBox select').forEach((el) => { if (saved[el.id] !== undefined) el.value = saved[el.id]; el.addEventListener('input', () => { saved[el.id] = el.value; store.set('vals', saved); fn(); }); }); fn(); }
const v = (id) => parseFloat($('#' + id)?.value);
const badge = (cls, b, e) => `<span class="badge ${cls}">${L(b, e)}</span>`;
const seeDoc = L('চিন্তা থাকলে বা লক্ষণ থাকলে ডাক্তার দেখান। এটি রোগ নির্ণয় নয়।', 'See a doctor if you are worried or have symptoms. This is not a diagnosis.');
function renderTool() {
  const B = $('#toolBox');
  if (curTool === 'bmi') {
    B.innerHTML = toolWrap(`<div class="row2">${inp('h', 'উচ্চতা (সেমি)', 'Height (cm)', 'type=number inputmode=decimal value=165')}${inp('w', 'ওজন (কেজি)', 'Weight (kg)', 'type=number inputmode=decimal value=65')}</div><p class="note">${L('৫ ফুট ৫ ইঞ্চি ≈ ১৬৫ সেমি। ১ ইঞ্চি = ২.৫৪ সেমি।', '5 ft 5 in ≈ 165 cm. 1 inch = 2.54 cm.')}</p>`, L('বডি মাস ইনডেক্স (BMI)', 'Body mass index (BMI)'));
    bindInputs(() => { const h = v('h') / 100, w = v('w'); if (!(h > 0.5 && w > 10)) return; const b = w / (h * h); let c;
      if (b < 18.5) c = badge('warn', 'কম ওজন', 'Underweight'); else if (b < 23) c = badge('ok', 'স্বাভাবিক', 'Healthy'); else if (b < 27.5) c = badge('warn', 'বাড়তি ওজন (ঝুঁকি বাড়ছে)', 'Overweight (rising risk)'); else c = badge('bad', 'স্থূলতা (উচ্চ ঝুঁকি)', 'Obesity (high risk)');
      const lo = 18.5 * h * h, hi = 22.9 * h * h, pos = Math.min(100, Math.max(0, (b - 15) / 20 * 100));
      $('#res').innerHTML = `<div class="big">${NB(b, 1)}</div>${c}<div class="meter"><i style="left:${pos}%"></i></div><p>${L(`আপনার উচ্চতায় স্বাস্থ্যকর ওজন: <b>${NB(lo, 0)}–${NB(hi, 0)} কেজি</b>`, `Healthy weight for your height: <b>${hi ? Math.round(lo) + '–' + Math.round(hi) : ''} kg</b>`)}</p><p class="note">${L('দক্ষিণ এশীয়দের জন্য WHO-এর এশীয় সীমা ব্যবহার করা হয়েছে (২৩ থেকে ঝুঁকি বাড়ে)। ', 'Uses WHO cut-offs for Asian populations (risk rises from 23). ')}${seeDoc}</p>`; });
  } else if (curTool === 'cal') {
    B.innerHTML = toolWrap(`<div class="row2">${sel('sx', 'লিঙ্গ', 'Sex', [['m', 'পুরুষ', 'Male'], ['f', 'নারী', 'Female']])}${inp('ag', 'বয়স', 'Age', 'type=number value=30')}</div><div class="row2">${inp('h2', 'উচ্চতা (সেমি)', 'Height (cm)', 'type=number value=165')}${inp('w2', 'ওজন (কেজি)', 'Weight (kg)', 'type=number value=65')}</div>${sel('act', 'দৈনিক কাজকর্ম', 'Daily activity', [['1.2', 'বেশিরভাগ বসে থাকা', 'Mostly sitting'], ['1.375', 'হালকা হাঁটাচলা', 'Light activity'], ['1.55', 'মাঝারি পরিশ্রম / ব্যায়াম', 'Moderate exercise'], ['1.725', 'ভারী পরিশ্রম', 'Hard physical work']])}`, L('দৈনিক ক্যালোরির চাহিদা', 'Daily calorie need'));
    bindInputs(() => { const w = v('w2'), h = v('h2'), a = v('ag'); if (!(w > 10 && h > 50 && a > 0)) return; const bmr = 10 * w + 6.25 * h - 5 * a + ($('#sx').value === 'm' ? 5 : -161), t = bmr * parseFloat($('#act').value);
      $('#res').innerHTML = `<div class="big">${NB(t, 0)}</div><p>${L('ক্যালোরি / দিন (ওজন ধরে রাখতে)', 'calories / day (to keep your weight)')}</p><p>${L(`ধীরে ওজন কমাতে মোটামুটি <b>${NB(t - 500, 0)}</b>; কখনোই খুব কম খাবেন না।`, `To lose weight slowly, about <b>${Math.round(t - 500)}</b>; never eat too little.`)}</p><p class="note">${L('Mifflin-St Jeor সূত্র। গর্ভাবস্থা, ডায়াবেটিস বা কিডনি রোগে ডাক্তার/পুষ্টিবিদের পরামর্শ নিন।', 'Mifflin-St Jeor formula. In pregnancy, diabetes or kidney disease, ask a doctor or dietitian.')}</p>`; });
  } else if (curTool === 'water') {
    B.innerHTML = toolWrap(`${inp('w3', 'ওজন (কেজি)', 'Weight (kg)', 'type=number value=65')}${sel('hot', 'আবহাওয়া / পরিশ্রম', 'Weather / activity', [['0', 'স্বাভাবিক', 'Normal'], ['500', 'গরম বা বেশি ঘাম', 'Hot or sweating a lot'], ['750', 'গরম + ভারী পরিশ্রম', 'Hot + hard work']])}`, L('দৈনিক পানির চাহিদা', 'Daily water need'));
    bindInputs(() => { const w = v('w3'); if (!(w > 5)) return; const lo = w * 30 + +$('#hot').value, hi = w * 35 + +$('#hot').value;
      $('#res').innerHTML = `<div class="big">${NB(lo / 1000, 1)}–${NB(hi / 1000, 1)}</div><p>${L('লিটার / দিন (খাবারের পানিসহ মোটামুটি হিসাব)', 'litres / day (rough estimate, including water from food)')}</p><p>${L(`প্রায় ${NB(lo / 250, 0)}–${NB(hi / 250, 0)} গ্লাস (২৫০ মিলি)`, `About ${Math.round(lo / 250)}–${Math.round(hi / 250)} glasses (250 ml)`)}</p><p class="note">${L('প্রস্রাবের রং হালকা হলুদ থাকা ভালো লক্ষণ। হার্ট বা কিডনি রোগে পানির পরিমাণ ডাক্তার ঠিক করে দেবেন।', 'Pale yellow urine is a good sign. With heart or kidney disease, your doctor sets your water limit.')}</p>`; });
  } else if (curTool === 'bp') {
    B.innerHTML = toolWrap(`<div class="row2">${inp('sys', 'উপরের সংখ্যা (সিস্টোলিক)', 'Top number (systolic)', 'type=number value=120')}${inp('dia', 'নিচের সংখ্যা (ডায়াস্টোলিক)', 'Bottom number (diastolic)', 'type=number value=80')}</div><p class="note">${L('৫ মিনিট বিশ্রামের পর বসে মাপুন।', 'Measure sitting, after 5 minutes of rest.')}</p>`, L('ব্লাড প্রেসার রিডিং বুঝুন', 'Understand a blood pressure reading'));
    bindInputs(() => { const s = v('sys'), d = v('dia'); if (!(s > 50 && d > 30)) return; let c, t;
      if (s > 180 || d > 120) { c = badge('bad', 'বিপজ্জনক উচ্চ', 'Dangerously high'); t = L('এখনই হাসপাতালে যান, বিশেষ করে বুকে ব্যথা, শ্বাসকষ্ট, দুর্বলতা বা কথা জড়িয়ে গেলে। জরুরি: ৯৯৯', 'Go to hospital now, especially with chest pain, breathlessness, weakness or slurred speech. Emergency: 999'); }
      else if (s >= 140 || d >= 90) { c = badge('bad', 'উচ্চ রক্তচাপ (ধাপ ২)', 'High (stage 2)'); t = L('শিগগিরই ডাক্তার দেখান।', 'See a doctor soon.'); }
      else if (s >= 130 || d >= 80) { c = badge('warn', 'উচ্চ রক্তচাপ (ধাপ ১)', 'High (stage 1)'); t = L('ডাক্তারের সাথে কথা বলুন; লবণ কমান, হাঁটুন।', 'Talk to a doctor; cut salt, walk more.'); }
      else if (s >= 120) { c = badge('warn', 'একটু বেশি', 'Elevated'); t = L('জীবনযাপনে পরিবর্তন আনুন, নিয়মিত মাপুন।', 'Make lifestyle changes and check regularly.'); }
      else if (s < 90 || d < 60) { c = badge('warn', 'নিম্ন রক্তচাপ', 'Low'); t = L('মাথা ঘোরা বা অজ্ঞান ভাব থাকলে ডাক্তার দেখান।', 'See a doctor if you feel dizzy or faint.'); }
      else { c = badge('ok', 'স্বাভাবিক', 'Normal'); t = L('ভালো! বছরে অন্তত একবার মাপুন।', 'Good! Check at least once a year.'); }
      $('#res').innerHTML = `<div class="big">${NB(s)}/${NB(d)}</div>${c}<p>${t}</p><p class="note">${L('আমেরিকান হার্ট অ্যাসোসিয়েশনের শ্রেণিবিভাগ। একবারের রিডিং দিয়ে রোগ ধরা হয় না।', 'American Heart Association categories. One reading alone does not diagnose.')}</p>`; });
  } else if (curTool === 'sugar') {
    B.innerHTML = toolWrap(`${sel('when', 'কখন মাপা হয়েছে', 'When measured', [['f', 'খালি পেটে (৮ ঘণ্টা না খেয়ে)', 'Fasting (8 h no food)'], ['p', 'খাওয়ার ২ ঘণ্টা পর', '2 hours after a meal'], ['r', 'যেকোনো সময় (র‍্যান্ডম)', 'Any time (random)']])}${inp('mm', 'রিডিং (mmol/L)', 'Reading (mmol/L)', 'type=number step=0.1 value=5.2')}<p class="note">${L('mg/dL থাকলে ১৮ দিয়ে ভাগ করুন (যেমন ১০৮ mg/dL = ৬.০ mmol/L)।', 'If in mg/dL, divide by 18 (e.g. 108 mg/dL = 6.0 mmol/L).')}</p>`, L('ব্লাড সুগার রিডিং বুঝুন', 'Understand a blood sugar reading'));
    bindInputs(() => { const m = v('mm'), w = $('#when').value; if (!(m > 0)) return; let c;
      if (m < 3.9) c = [badge('bad', 'কম সুগার (হাইপো)', 'Low sugar (hypo)'), L('মিষ্টি কিছু খান; অজ্ঞান ভাব থাকলে জরুরি সাহায্য নিন।', 'Eat something sweet; get urgent help if drowsy or confused.')];
      else if (w === 'f') c = m < 5.6 ? [badge('ok', 'স্বাভাবিক', 'Normal'), ''] : m < 7 ? [badge('warn', 'প্রি-ডায়াবেটিস সীমা', 'Prediabetes range'), L('ডাক্তার দেখান ও HbA1c পরীক্ষা নিয়ে কথা বলুন।', 'See a doctor and ask about an HbA1c test.')] : [badge('bad', 'ডায়াবেটিস সীমা', 'Diabetes range'), L('ডাক্তার দেখান; নিশ্চিত হতে আবার পরীক্ষা লাগে।', 'See a doctor; a repeat test is needed to confirm.')];
      else c = m < 7.8 ? [badge('ok', 'স্বাভাবিক', 'Normal'), ''] : m < 11.1 ? [badge('warn', w === 'p' ? 'প্রি-ডায়াবেটিস সীমা' : 'বেশি', w === 'p' ? 'Prediabetes range' : 'High'), L('ডাক্তার দেখান।', 'See a doctor.')] : [badge('bad', 'ডায়াবেটিস সীমা', 'Diabetes range'), L('ডাক্তার দেখান।', 'See a doctor.')];
      $('#res').innerHTML = `<div class="big">${NB(m, 1)} <span style="font-size:20px">mmol/L</span></div>${c[0]}<p>${c[1]}</p><p class="note">${L('WHO/ADA সীমা। ', 'WHO/ADA cut-offs. ')}${seeDoc}</p>`; });
  } else if (curTool === 'risk') {
    const yn = (id, b, e) => sel(id, b, e, [['0', 'না', 'No'], ['1', 'হ্যাঁ', 'Yes']]);
    B.innerHTML = toolWrap(`<div class="row2">${sel('ra', 'বয়স', 'Age', [['0', '৪০-এর কম', 'Under 40'], ['1', '৪০–৪৯', '40–49'], ['2', '৫০–৫৯', '50–59'], ['3', '৬০ বা বেশি', '60+']])}${sel('rs', 'লিঙ্গ', 'Sex', [['1', 'পুরুষ', 'Male'], ['0', 'নারী', 'Female']])}</div>${yn('rf', 'বাবা/মা/ভাই/বোনের ডায়াবেটিস আছে?', 'Parent or sibling with diabetes?')}${yn('rh', 'উচ্চ রক্তচাপ আছে বা ওষুধ খান?', 'High blood pressure or on BP medicine?')}${sel('rp', 'নিয়মিত ব্যায়াম / হাঁটাচলা করেন?', 'Physically active most days?', [['0', 'হ্যাঁ', 'Yes'], ['1', 'না', 'No']])}${yn('rg', '(নারী) গর্ভকালীন ডায়াবেটিস হয়েছিল?', '(Women) ever had gestational diabetes?')}${sel('rb', 'BMI', 'BMI', [['0', '২৩-এর কম', 'Under 23'], ['1', '২৩–২৭.৪', '23–27.4'], ['2', '২৭.৫–৩৪.৯', '27.5–34.9'], ['3', '৩৫ বা বেশি', '35+']])}`, L('টাইপ ২ ডায়াবেটিসের ঝুঁকি', 'Type 2 diabetes risk'));
    bindInputs(() => { const s = ['ra', 'rs', 'rf', 'rh', 'rp', 'rg', 'rb'].reduce((a, k) => a + (+$('#' + k).value || 0), 0); const hi = s >= 5;
      $('#res').innerHTML = `<div class="big">${NB(s)} / ${NB(10)}</div>${hi ? badge('bad', 'ঝুঁকি বেশি', 'Higher risk') : badge('ok', 'ঝুঁকি কম', 'Lower risk')}<p>${hi ? L('ডাক্তার দেখিয়ে সুগার পরীক্ষা (FBS বা HbA1c) করান। ওজন কমানো ও হাঁটা ঝুঁকি অনেক কমায়।', 'See a doctor for a sugar test (FBS or HbA1c). Losing weight and walking cut the risk a lot.') : L('ভালো! স্বাস্থ্যকর খাবার ও নিয়মিত হাঁটা চালিয়ে যান।', 'Good! Keep up healthy food and regular walking.')}</p><p class="note">${L('আমেরিকান ডায়াবেটিস অ্যাসোসিয়েশনের ঝুঁকি পরীক্ষার ধাঁচে, এশীয়দের BMI সীমায়। ৫ বা বেশি = ঝুঁকি বেশি।', 'Modelled on the American Diabetes Association risk test, with Asian BMI cut-offs. 5 or more = higher risk.')}</p>`; });
  } else if (curTool === 'preg') {
    const today = new Date().toISOString().slice(0, 10);
    B.innerHTML = toolWrap(`${inp('lmp', 'শেষ মাসিকের প্রথম দিন', 'First day of last period', `type=date max=${today}`)}<p class="note">${L('মাসিক নিয়মিত (২৮ দিন) ধরে হিসাব।', 'Assumes a regular 28-day cycle.')}</p>`, L('প্রেগন্যান্সির সম্ভাব্য তারিখ', 'Pregnancy due date'));
    bindInputs(() => { const d = new Date($('#lmp').value); if (isNaN(d)) { $('#res').innerHTML = `<p class="muted">${L('তারিখ দিন', 'Enter a date')}</p>`; return; } const due = new Date(d.getTime() + 280 * 864e5), wk = Math.floor((Date.now() - d) / 864e5 / 7), dd = Math.floor((Date.now() - d) / 864e5) % 7;
      const ds = due.toLocaleDateString(isBn() ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      const tri = wk < 13 ? L('প্রথম ত্রৈমাসিক', 'First trimester') : wk < 28 ? L('দ্বিতীয় ত্রৈমাসিক', 'Second trimester') : L('তৃতীয় ত্রৈমাসিক', 'Third trimester');
      $('#res').innerHTML = `<p>${L('সম্ভাব্য প্রসবের তারিখ', 'Estimated due date')}</p><div class="big" style="font-size:32px">${ds}</div>${wk >= 0 && wk < 43 ? `<p><b>${L(`এখন ${NB(wk)} সপ্তাহ ${NB(dd)} দিন`, `Now ${wk} weeks ${dd} days`)}</b> · ${tri}</p>` : ''}<p>${L('গর্ভাবস্থায় অন্তত ৪ বার (WHO এখন ৮ বার বলে) চেকআপ করান। রক্তপাত, তীব্র মাথাব্যথা, চোখে ঝাপসা, খিঁচুনি বা বাচ্চার নড়াচড়া কমে গেলে সাথে সাথে হাসপাতালে যান।', 'Have regular check-ups (WHO advises 8 contacts). Go to hospital at once for bleeding, severe headache, blurred vision, fits or less baby movement.')}</p>`; });
  } else if (curTool === 'period') {
    const today = new Date().toISOString().slice(0, 10);
    B.innerHTML = toolWrap(`${inp('pl', 'শেষ মাসিকের প্রথম দিন', 'First day of last period', `type=date max=${today}`)}${inp('pc', 'মাসিক চক্র কত দিনের? (সাধারণত ২১–৩৫)', 'Cycle length in days (usually 21–35)', 'type=number value=28 min=20 max=45')}`, L('মাসিক ক্যালেন্ডার', 'Period calendar'));
    bindInputs(() => { const d = new Date($('#pl').value), c = v('pc'); if (isNaN(d) || !(c >= 20 && c <= 45)) { $('#res').innerHTML = `<p class="muted">${L('তারিখ দিন', 'Enter a date')}</p>`; return; }
      const f = (x) => x.toLocaleDateString(isBn() ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'long' }); let n = new Date(d.getTime() + c * 864e5); while (n < Date.now() - 864e5) n = new Date(n.getTime() + c * 864e5);
      const ov = new Date(n.getTime() - 14 * 864e5), f1 = new Date(ov.getTime() - 5 * 864e5);
      $('#res').innerHTML = `<p>${L('পরের মাসিক সম্ভবত', 'Next period likely')}</p><div class="big" style="font-size:34px">${f(n)}</div><p>${L(`সম্ভাব্য উর্বর সময়: <b>${f(f1)} – ${f(ov)}</b>`, `Likely fertile window: <b>${f(f1)} – ${f(ov)}</b>`)}</p><p class="note">${L('এটি আনুমানিক হিসাব; জন্মনিয়ন্ত্রণের পদ্ধতি হিসেবে ভরসা করবেন না। খুব বেশি রক্তপাত, ৩ মাস মাসিক বন্ধ বা তীব্র ব্যথায় গাইনি বিশেষজ্ঞ দেখান।', 'This is an estimate; do not rely on it for contraception. See a gynaecologist for very heavy bleeding, 3 missed periods or severe pain.')}</p>`; });
  } else if (curTool === 'sleep') {
    B.innerHTML = toolWrap(`${inp('wake', 'কখন উঠতে চান?', 'What time do you want to wake up?', 'type=time value=06:30')}`, L('কখন ঘুমাতে যাবেন', 'When to go to bed'));
    bindInputs(() => { const [hh, mm] = ($('#wake').value || '06:30').split(':').map(Number); const w = hh * 60 + mm; const opts = [6, 5, 4].map((cyc) => { let t = (w - cyc * 90 - 15 + 1440) % 1440; const d = new Date(2000, 0, 1, Math.floor(t / 60), t % 60); return [cyc, d.toLocaleTimeString(isBn() ? 'bn-BD' : 'en-US', { hour: 'numeric', minute: '2-digit' })]; });
      $('#res').innerHTML = `<p>${L('এই সময়গুলোর একটিতে বিছানায় যান:', 'Go to bed at one of these times:')}</p>${opts.map(([c, t], i) => `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)"><span class="big" style="font-size:28px">${t}</span>${i === 0 ? badge('ok', `${NB(c * 1.5, 1)} ঘণ্টা · সেরা`, `${c * 1.5} h · best`) : badge(i === 1 ? 'ok' : 'warn', `${NB(c * 1.5, 1)} ঘণ্টা`, `${c * 1.5} h`)}</div>`).join('')}<p class="note">${L('ঘুম ৯০ মিনিটের চক্রে হয়; ঘুম আসতে ~১৫ মিনিট ধরা হয়েছে। প্রাপ্তবয়স্কদের রাতে অন্তত ৭ ঘণ্টা ঘুম দরকার।', 'Sleep runs in ~90-minute cycles; allows ~15 minutes to fall asleep. Adults need at least 7 hours a night.')}</p>`; });
  } else if (curTool === 'waist') {
    B.innerHTML = toolWrap(`<div class="row2">${inp('wc', 'কোমরের মাপ (সেমি)', 'Waist (cm)', 'type=number value=85')}${inp('wh', 'উচ্চতা (সেমি)', 'Height (cm)', 'type=number value=165')}</div><p class="note">${L('নাভির একটু ওপরে, শ্বাস ছেড়ে মাপুন। ১ ইঞ্চি = ২.৫৪ সেমি।', 'Measure just above the navel after breathing out. 1 inch = 2.54 cm.')}</p>`, L('কোমর-উচ্চতা অনুপাত', 'Waist-to-height ratio'));
    bindInputs(() => { const r = v('wc') / v('wh'); if (!(r > 0.2 && r < 1.5)) return; const c = r < 0.5 ? badge('ok', 'ঠিক আছে', 'Healthy') : r < 0.6 ? badge('warn', 'ঝুঁকি বাড়ছে', 'Increased risk') : badge('bad', 'ঝুঁকি অনেক বেশি', 'High risk');
      $('#res').innerHTML = `<div class="big">${NB(r, 2)}</div>${c}<p>${L(`লক্ষ্য: কোমর উচ্চতার অর্ধেকের কম, অর্থাৎ <b>${NB(v('wh') / 2, 0)} সেমির কম</b>।`, `Goal: waist under half your height, i.e. <b>under ${Math.round(v('wh') / 2)} cm</b>.`)}</p><p class="note">${L('পেটের চর্বি ডায়াবেটিস ও হৃদরোগের ঝুঁকি বাড়ায়; BMI স্বাভাবিক হলেও এটা দেখা জরুরি। (NICE নির্দেশিকা)', 'Belly fat raises diabetes and heart risk even with a normal BMI. (NICE guidance)')}</p>`; });
  } else if (curTool === 'blood') {
    const G = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
    const can = (d, r) => { const ab = (g) => g.replace(/[+-]/, ''), rh = (g) => g.endsWith('+'); if (rh(d) && !rh(r)) return false; const D = ab(d), R = ab(r); return D === 'O' || R === 'AB' || D === R; };
    B.innerHTML = `<div class="tool"><div><h3>${L('কে কাকে রক্ত দিতে পারে', 'Who can give blood to whom')}</h3>${sel('bg', 'আপনার রক্তের গ্রুপ', 'Your blood group', G.map((g) => [g, g, g]))}<div id="bgRes" style="margin-top:14px"></div></div><div class="result"><h3>${L('আমি কি রক্ত দিতে পারব?', 'Can I donate?')}</h3>${inp('bage', 'বয়স', 'Age', 'type=number value=25')}${inp('bwt', 'ওজন (কেজি)', 'Weight (kg)', 'type=number value=60')}${inp('blast', 'শেষবার রক্ত দেওয়ার পর কত মাস?', 'Months since last donation', 'type=number value=6')}<div id="bRes" style="margin-top:12px"></div></div></div><p class="note">${L('WHO রক্তদাতা নির্বাচনের সাধারণ নিয়ম। চূড়ান্ত সিদ্ধান্ত ব্লাড ব্যাংক দেবে (হিমোগ্লোবিন, প্রেসার, অসুখ যাচাই করে)।', 'General WHO donor rules. The blood bank decides after checking haemoglobin, blood pressure and health.')}</p>`;
    bindInputs(() => { const g = $('#bg').value; $('#bgRes').innerHTML = `<p><b>${L('দিতে পারবেন:', 'Can give to:')}</b> ${G.filter((r) => can(g, r)).join(', ')}</p><p><b>${L('নিতে পারবেন:', 'Can receive from:')}</b> ${G.filter((d) => can(d, g)).join(', ')}</p>`;
      const a = v('bage'), w = v('bwt'), m = v('blast'); const ok = a >= 18 && a <= 65 && w >= 50 && m >= 3;
      $('#bRes').innerHTML = ok ? badge('ok', 'সম্ভবত পারবেন', 'Probably yes') + `<p class="small">${L('ভরপেট খেয়ে, ভালো ঘুমের পর যান।', 'Go after a good meal and a good sleep.')}</p>` : badge('warn', 'এখন নয়', 'Not now') + `<p class="small">${L('সাধারণত বয়স ১৮–৬৫, ওজন ৫০ কেজি+, আর পুরুষদের ৩ মাস ও নারীদের ৪ মাস পর পর।', 'Usually age 18–65, weight 50 kg+, and 3 months apart for men, 4 for women.')}</p>`; });
  }
}

// ===== finder =====
const TYPES = [['care', 'হাসপাতাল ও ক্লিনিক', 'Hospitals & clinics'], ['hospital', 'শুধু হাসপাতাল', 'Hospitals only'], ['pharmacy', 'ফার্মেসি', 'Pharmacies'], ['lab', 'ডায়াগনস্টিক / ল্যাব', 'Diagnostic labs'], ['dentist', 'দাঁতের ডাক্তার', 'Dentists']];
let map, layer;
function fillGeo() {
  const g = DATA.geo; if (!g) return; const nm = (r) => (isBn() ? r[2] : r[1]);
  const dv = $('#fDiv'), keep = { d: dv.value, s: $('#fDist').value, u: $('#fUpa').value, t: $('#fType').value };
  dv.innerHTML = g.div.map((r) => `<option value="${r[0]}">${nm(r)}</option>`).join(''); dv.value = keep.d || store.get('fdiv', '6');
  const fillDist = () => { const ds = g.dist.filter((d) => d[1] == dv.value); $('#fDist').innerHTML = ds.map((d) => `<option value="${d[0]}">${isBn() ? d[3] : d[2]}</option>`).join(''); };
  const fillUpa = () => { const us = g.upa.filter((u) => u[1] == $('#fDist').value); $('#fUpa').innerHTML = `<option value="">${isBn() ? 'পুরো জেলা' : 'Whole district'}</option>` + us.map((u) => `<option value="${u[0]}">${isBn() ? u[3] : u[2]}</option>`).join(''); };
  fillDist(); if (keep.s) $('#fDist').value = keep.s; fillUpa(); if (keep.u) $('#fUpa').value = keep.u;
  $('#fType').innerHTML = TYPES.map(([v, b, e]) => `<option value="${v}">${isBn() ? b : e}</option>`).join(''); $('#fType').value = keep.t || 'care';
  dv.onchange = () => { store.set('fdiv', dv.value); fillDist(); fillUpa(); }; $('#fDist').onchange = fillUpa;
}
function initMap() {
  if (map) { setTimeout(() => map.invalidateSize(), 50); return; }
  if (!window.L) { if (!window.L) $('#fStatus').innerHTML = L('ম্যাপ লোড হয়নি; ইন্টারনেট সংযোগ দেখুন।', 'Map did not load; check your connection.'); return; }
  map = window.L.map('map').setView([23.7, 90.35], 7);
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
  layer = window.L.layerGroup().addTo(map); setTimeout(() => map.invalidateSize(), 50);
}
const TMAP = { care: 'hcd', hospital: 'h', pharmacy: 'p', lab: 'l', dentist: 't' };
const KIND = { h: ['হাসপাতাল', 'Hospital'], c: ['ক্লিনিক / স্বাস্থ্যকেন্দ্র', 'Clinic / health centre'], d: ['ডাক্তারের চেম্বার', "Doctor's chamber"], p: ['ফার্মেসি', 'Pharmacy'], l: ['ডায়াগনস্টিক / ল্যাব', 'Diagnostic lab'], t: ['দাঁতের ডাক্তার', 'Dentist'] };
let FAC = null;
async function loadFac() { if (FAC) return FAC; const j = await getJSON('data/facilities.json'); FAC = j ? j.f : []; return FAC; }
async function search(lat, lon, r, label) {
  initMap(); if (map) { map.setView([lat, lon], r > 15000 ? 11 : 13); layer.clearLayers(); window.L.circleMarker([lat, lon], { radius: 8, color: '#ffc94a', fillOpacity: 1 }).addTo(layer); }
  $('#fStatus').innerHTML = L('খোঁজা হচ্ছে…', 'Searching…'); $('#fList').innerHTML = '';
  const F = await loadFac(), want = TMAP[$('#fType').value], cosl = Math.cos(lat * Math.PI / 180);
  let P = F.filter((f) => want.includes(f[2])).map((f) => ({ name: f[1] || f[0], en: f[0], k: f[2], lat: f[3], lon: f[4], up: f[5], di: f[6], d: Math.hypot((f[3] - lat) * 111, (f[4] - lon) * 111 * cosl) }));
  let R = r / 1000; let near = P.filter((p) => p.d <= R); if (near.length < 5) { R = R * 2.5; near = P.filter((p) => p.d <= R); }
  near.sort((a, b) => a.d - b.d);
  $('#fStatus').innerHTML = near.length ? L(`${label}: ${NB(near.length)}টি জায়গা পাওয়া গেছে (${NB(R, 0)} কিমির মধ্যে, কাছ থেকে দূরে)`, `${label}: ${near.length} places within ${Math.round(R)} km (nearest first)`) : L('কাছাকাছি তালিকাভুক্ত কিছু পাওয়া যায়নি। অন্য ধরন বা "পুরো জেলা" বেছে দেখুন, অথবা উপজেলা স্বাস্থ্য কমপ্লেক্সে যোগাযোগ করুন।', 'Nothing listed nearby. Try another type or "Whole district", or contact the upazila health complex.');
  $('#fList').innerHTML = near.slice(0, 60).map((p) => { const k = KIND[p.k];
    if (map) window.L.marker([p.lat, p.lon]).addTo(layer).bindPopup(`<b>${esc(isBn() ? p.name : p.en)}</b><br>${k[isBn() ? 0 : 1]}`);
    return `<div class="place"><b>${esc(isBn() ? p.name : p.en)}</b><div class="small muted">${L(k[0], k[1])} · ${NB(p.d, 1)} ${L('কিমি', 'km')}${p.up ? ' · ' + esc(p.up) : ''}</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><a class="btn" style="min-height:38px;padding:6px 12px;font-size:14px" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}">${L('দিকনির্দেশ', 'Directions')}</a><a class="btn ghost" style="min-height:38px;padding:6px 12px;font-size:14px" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.en + ' ' + (p.di || ''))}">${L('ফোন ও রিভিউ', 'Phone & reviews')}</a></div></div>`; }).join('');
}
$('#fGo').addEventListener('click', () => { const g = DATA.geo; if (!g) return; const u = g.upa.find((x) => x[0] == $('#fUpa').value), d = g.dist.find((x) => x[0] == $('#fDist').value);
  if (u) search(u[4], u[5], 10000, isBn() ? u[3] : u[2]); else if (d) search(d[4], d[5], 22000, isBn() ? d[3] : d[2]); });
$('#fMe').addEventListener('click', () => { if (!navigator.geolocation) return; $('#fStatus').innerHTML = L('লোকেশন নেওয়া হচ্ছে…', 'Getting your location…');
  navigator.geolocation.getCurrentPosition((p) => search(p.coords.latitude, p.coords.longitude, 5000, isBn() ? 'আপনার কাছে' : 'Near you'), () => { $('#fStatus').innerHTML = L('লোকেশন পাওয়া যায়নি। জেলা/উপজেলা বেছে খুঁজুন।', 'Could not get your location. Pick a district/upazila instead.'); }, { timeout: 10000 }); });
const SOS = [['৯৯৯', '999', 'জাতীয় জরুরি সেবা (পুলিশ, ফায়ার, অ্যাম্বুলেন্স)', 'National emergency (police, fire, ambulance)'], ['১৬২৬৩', '16263', 'স্বাস্থ্য বাতায়ন: ফোনে ডাক্তারের পরামর্শ (স্বাস্থ্য অধিদপ্তর)', 'Shasthya Batayon: doctor advice by phone (DGHS)'], ['৩৩৩', '333', 'জাতীয় তথ্য বাতায়ন: সরকারি সেবার তথ্য', 'National information line: government services']];
function renderSOS() { $('#sosGrid').innerHTML = SOS.map(([b, e, tb, te]) => `<div class="card"><div class="big">${L(b, e)}</div><p class="small">${L(tb, te)}</p><a class="btn y" href="tel:${e}">${L('কল করুন', 'Call')} ${e}</a></div>`).join(''); }

// ===== which doctor =====
const DOCS = [
  ['মেডিসিন বিশেষজ্ঞ', 'Medicine specialist (internist)', 'জ্বর, দুর্বলতা, ডায়াবেটিস, প্রেসার, সাধারণ অসুখ; কোথায় যাবেন বুঝতে না পারলে প্রথমে', 'Fever, weakness, diabetes, blood pressure, general illness; start here if unsure', 'fever jor jor durbolota weakness diabetes pressure general', 'জ্বর ৩ দিনের বেশি, অজ্ঞান ভাব, শ্বাসকষ্ট', 'Fever over 3 days, drowsiness, breathlessness'],
  ['হৃদরোগ বিশেষজ্ঞ (কার্ডিওলজিস্ট)', 'Cardiologist', 'বুক ধড়ফড়, বুকে চাপ, উচ্চ রক্তচাপ, হার্টের সমস্যা', 'Palpitations, chest tightness, high BP, heart problems', 'chest pain buk betha heart palpitation dhorfor', 'বুকে তীব্র ব্যথা যা হাত/চোয়ালে ছড়ায়, ঘাম: এখনই ৯৯৯', 'Severe chest pain spreading to arm/jaw, sweating: call 999 now'],
  ['নিউরোলজিস্ট (স্নায়ুরোগ)', 'Neurologist', 'মাথাব্যথা, খিঁচুনি, হাত-পা অবশ, মাথা ঘোরা, স্মৃতি সমস্যা', 'Headache, seizures, numbness, dizziness, memory problems', 'headache matha betha khichuni seizure stroke numb obosh', 'মুখ বেঁকে যাওয়া, হাত দুর্বল, কথা জড়ানো (স্ট্রোক): এখনই হাসপাতাল', 'Face drooping, arm weakness, slurred speech (stroke): hospital now'],
  ['শিশু বিশেষজ্ঞ', 'Paediatrician', '১৮ বছরের কম বয়সীদের অসুখ, টিকা, বৃদ্ধি', 'Illness in under-18s, vaccines, growth', 'child baby shishu bachcha children', 'শিশুর দ্রুত শ্বাস, খেতে না পারা, নেতিয়ে পড়া, খিঁচুনি', 'Fast breathing, not feeding, very sleepy, fits'],
  ['গাইনি ও প্রসূতি বিশেষজ্ঞ', 'Gynaecologist & obstetrician', 'গর্ভাবস্থা, মাসিকের সমস্যা, নারীদের প্রজনন স্বাস্থ্য', 'Pregnancy, period problems, women’s reproductive health', 'pregnancy masik period gynae women', 'গর্ভাবস্থায় রক্তপাত, তীব্র পেটব্যথা, খিঁচুনি', 'Bleeding in pregnancy, severe belly pain, fits'],
  ['এন্ডোক্রাইনোলজিস্ট (হরমোন)', 'Endocrinologist', 'ডায়াবেটিস নিয়ন্ত্রণে না থাকা, থাইরয়েড, হরমোনের সমস্যা', 'Uncontrolled diabetes, thyroid, hormone problems', 'thyroid hormone diabetes sugar', 'খুব বেশি বা খুব কম সুগার, অজ্ঞান ভাব', 'Very high or very low sugar, confusion'],
  ['চর্মরোগ বিশেষজ্ঞ', 'Dermatologist', 'চুলকানি, ফুসকুড়ি, ব্রণ, চুল পড়া, এলার্জি', 'Itching, rashes, acne, hair loss, allergies', 'skin chulkani rash acne bron hair allergy', 'হঠাৎ সারা শরীরে র‍্যাশ ও মুখ/ঠোঁট ফোলা, শ্বাসকষ্ট', 'Sudden body rash with face/lip swelling, breathlessness'],
  ['অর্থোপেডিক (হাড় ও জোড়া)', 'Orthopaedic surgeon', 'হাড় ভাঙা, জোড়ায় ব্যথা, কোমর ও ঘাড় ব্যথা', 'Fractures, joint pain, back and neck pain', 'bone har fracture joint komor back pain hatu knee', 'দুর্ঘটনার পর হাড় বেঁকে যাওয়া, অবশ ভাব', 'Bent limb after injury, numbness'],
  ['গ্যাস্ট্রোএন্টারোলজিস্ট / লিভার বিশেষজ্ঞ', 'Gastroenterologist / hepatologist', 'পেটব্যথা, গ্যাস্ট্রিক, জন্ডিস, লিভার, পাতলা পায়খানা দীর্ঘদিন', 'Stomach pain, acidity, jaundice, liver, long-term diarrhoea', 'stomach pet betha gastric jaundice liver jondis', 'রক্তবমি, কালো পায়খানা, তীব্র পেটব্যথা', 'Vomiting blood, black stool, severe belly pain'],
  ['বক্ষব্যাধি বিশেষজ্ঞ (পালমোনোলজিস্ট)', 'Pulmonologist (chest specialist)', 'দীর্ঘ কাশি, হাঁপানি, শ্বাসকষ্ট, যক্ষ্মা', 'Long cough, asthma, breathlessness, TB', 'cough kashi asthma hapani tb breath shash', 'ঠোঁট নীল হয়ে যাওয়া, কথা বলতে কষ্ট', 'Blue lips, cannot speak in sentences'],
  ['কিডনি বিশেষজ্ঞ (নেফ্রোলজিস্ট)', 'Nephrologist', 'কিডনি রোগ, শরীর ফোলা, প্রস্রাবে প্রোটিন, ক্রিয়েটিনিন বেশি', 'Kidney disease, swelling, protein in urine, high creatinine', 'kidney swelling fola creatinine', 'প্রস্রাব প্রায় বন্ধ, শ্বাসকষ্ট', 'Very little urine, breathlessness'],
  ['ইউরোলজিস্ট', 'Urologist', 'কিডনিতে পাথর, প্রস্রাবে জ্বালা/রক্ত, প্রোস্টেট', 'Kidney stones, burning/blood in urine, prostate', 'stone pathor urine prosrab prostate', 'প্রস্রাব একদম আটকে যাওয়া, তীব্র কোমর ব্যথা ও জ্বর', 'Cannot pass urine, severe flank pain with fever'],
  ['নাক-কান-গলা (ENT)', 'ENT specialist', 'কানে ব্যথা, কম শোনা, সাইনাস, টনসিল, গলা ব্যথা', 'Ear pain, hearing loss, sinus, tonsils, sore throat', 'ear kan nose nak throat gola tonsil sinus', 'শ্বাস নিতে কষ্ট, গলায় কিছু আটকে যাওয়া', 'Breathing difficulty, something stuck in throat'],
  ['চক্ষু বিশেষজ্ঞ', 'Ophthalmologist', 'চোখে কম দেখা, চোখ লাল, ছানি, চোখে আঘাত', 'Poor vision, red eye, cataract, eye injury', 'eye chokh vision cataract chani', 'হঠাৎ দৃষ্টি চলে যাওয়া, চোখে রাসায়নিক পড়া', 'Sudden vision loss, chemical in the eye'],
  ['দন্ত চিকিৎসক', 'Dentist', 'দাঁতে ব্যথা, মাড়ি থেকে রক্ত, দাঁত ক্ষয়', 'Toothache, bleeding gums, tooth decay', 'tooth dat dant teeth gum mari', 'মুখ ও গলা ফুলে শ্বাসকষ্ট', 'Face and neck swelling with breathing trouble'],
  ['মনোরোগ বিশেষজ্ঞ (সাইকিয়াট্রিস্ট)', 'Psychiatrist', 'দুশ্চিন্তা, বিষণ্নতা, ঘুমের সমস্যা, আসক্তি', 'Anxiety, depression, sleep problems, addiction', 'anxiety depression mon mental ghum sleep tension', 'নিজের ক্ষতির চিন্তা আসলে দেরি না করে সাহায্য নিন: ৯৯৯', 'Thoughts of self-harm: get help now, call 999'],
  ['জেনারেল সার্জন', 'General surgeon', 'হার্নিয়া, অ্যাপেন্ডিক্স, ফোঁড়া, পিত্তথলির পাথর', 'Hernia, appendix, abscess, gallstones', 'surgery hernia appendix fora gallstone', 'ডান পাশের তলপেটে তীব্র ব্যথা ও জ্বর', 'Severe lower-right belly pain with fever'],
  ['ক্যান্সার বিশেষজ্ঞ (অনকোলজিস্ট)', 'Oncologist', 'ক্যান্সার শনাক্ত হলে চিকিৎসা ও পরামর্শ', 'Treatment and advice after a cancer diagnosis', 'cancer tumor tumour chaka', 'অকারণে ওজন কমা, চাকা বা গোটা যা বড় হচ্ছে: ডাক্তার দেখান', 'Unexplained weight loss, a growing lump: see a doctor']
];
function renderDocs() { const q = ($('#docSearch').value || '').toLowerCase().trim();
  $('#docGrid').innerHTML = DOCS.filter((d) => !q || (d.join(' ').toLowerCase().includes(q))).map((d) => `<div class="card"><div class="ico">${ICON.doc}</div><h3>${L(d[0], d[1])}</h3><p class="small">${L(d[2], d[3])}</p><p class="small" style="color:var(--red);margin:0"><b>⚠ ${L('বিপদ চিহ্ন:', 'Red flag:')}</b> ${L(d[5], d[6])}</p></div>`).join('') || `<p class="muted">${L('মেলেনি। মেডিসিন বিশেষজ্ঞ দিয়ে শুরু করুন।', 'No match. Start with a medicine specialist.')}</p>`; }
$('#docSearch').addEventListener('input', renderDocs);

// ===== prices =====
const PCAT = [['all', 'সব', 'All'], ['pat', 'রক্ত ও প্যাথলজি', 'Blood & lab'], ['rad', 'এক্স-রে, সিটি, এমআরআই', 'X-ray, CT, MRI'], ['usg', 'আল্ট্রাসাউন্ড', 'Ultrasound'], ['card', 'হার্ট', 'Heart'], ['neu', 'স্নায়ু', 'Nerves'], ['endo', 'এন্ডোস্কপি', 'Endoscopy']];
let pCat = 'all', pGov = true, pLimit = 60;
function renderPrices() { const P = DATA.prices; if (!P || !P.rows) return; const q = ($('#priceSearch').value || '').toLowerCase().trim();
  const govN = P.rows.filter((r) => r[3]).length;
  $('#priceNote').innerHTML = L(`মোট ${NB(P.rows.length)}টি টেস্ট। প্রথম ${NB(govN)}টি সাধারণ টেস্টে সরকারি ও বেসরকারি দুই দামই আছে; বাকিগুলোর বেসরকারি দাম। সরকারি হাসপাতালে একই টেস্ট অনেক কম দামে হয়। যাচাই ${fmtDate(P.checked)}; দাম হাসপাতালভেদে আলাদা ও বদলাতে পারে, যাওয়ার আগে ফোন করে নিশ্চিত হোন।`, `${P.rows.length.toLocaleString()} tests in all. The first ${govN} common tests show both government and private prices; the rest show private prices. Government hospitals charge far less for the same test. Checked ${P.checked}; prices differ between hospitals and change, so call before you go.`);
  if (!$('#pChips').dataset.ready) { $('#pChips').dataset.ready = 1; }
  $('#pChips').innerHTML = PCAT.map(([v, b, e]) => `<button data-pc="${v}" class="${v === pCat ? 'on' : ''}">${L(b, e)}</button>`).join('') + `<button data-pg="1" class="${pGov && !q ? 'on' : ''}">${L('শুধু সরকারি দাম আছে এমন', 'Only with government price')}</button>`;
  const effGov = pGov && !q; const list = P.rows.filter((r) => (pCat === 'all' || r[2] === pCat) && (!effGov || r[3]) && (!q || ((r[0] || '') + ' ' + r[1]).toLowerCase().includes(q)));
  const head = `<thead><tr><th>${L('টেস্ট', 'Test')}</th><th>${L('সরকারি হাসপাতাল', 'Government hospital')}</th><th>${L('বেসরকারি', 'Private')}</th><th>${L('সাশ্রয়', 'You save')}</th></tr></thead>`;
  const rows = list.slice(0, pLimit).map((r) => { const sv = r[3] && r[4] ? r[4] - r[3] : null; return `<tr><td>${r[0] ? L(r[0], r[1]) : esc(r[1])}</td><td class="n gov">${r[3] ? '৳ ' + NB(r[3]) : `<span class="muted small">${L('তালিকায় নেই', 'Not listed')}</span>`}</td><td class="n">${r[4] ? '৳ ' + NB(r[4]) : '—'}</td><td class="n">${sv > 0 ? L(`৳ ${NB(sv)}`, `৳ ${sv.toLocaleString()}`) : '—'}</td></tr>`; }).join('');
  $('#priceTable').innerHTML = head + `<tbody>${rows || `<tr><td colspan="4" class="muted">${effGov ? L('সরকারি দামে মেলেনি। "শুধু সরকারি দাম আছে এমন" বন্ধ করে আবার খুঁজুন।', 'No match with a government price. Turn off "Only with government price" and search again.') : L('কিছু মেলেনি', 'No match')}</td></tr>`}</tbody>`;
  $('#pCount').innerHTML = list.length ? L(`${NB(Math.min(pLimit, list.length))} / ${NB(list.length)}টি দেখানো হচ্ছে`, `Showing ${Math.min(pLimit, list.length)} of ${list.length}`) : '';
  $('#pMore').classList.toggle('hidden', list.length <= pLimit);
  $('#priceSrc').innerHTML = `<b>${L('সূত্র', 'Sources')}:</b><br>` + P.sources.map((s) => `• <a href="${s.url}" target="_blank" rel="noopener">${L(s.bn, s.en)}</a>`).join('<br>');
}
$('#priceSearch').addEventListener('input', () => { pLimit = 60; if ($('#priceSearch').value && pGov) { /* search everything */ } renderPrices(); });
document.addEventListener('click', (e) => { const c = e.target.closest('[data-pc]'); if (c) { pCat = c.dataset.pc; pLimit = 60; renderPrices(); } const g = e.target.closest('[data-pg]'); if (g) { pGov = !pGov; pLimit = 60; renderPrices(); } if (e.target.closest('#pMore')) { pLimit += 100; renderPrices(); } });

// ===== learn =====
const LEARN = [['posts', 'স্বাস্থ্য পোস্ট', 'Health posts'], ['quiz', 'কুইজ', 'Quiz'], ['vax', 'শিশুর টিকা', 'Child vaccines'], ['med', 'ওষুধ নিরাপত্তা', 'Medicine safety'], ['dict', 'মেডিকেল ডিকশনারি', 'Medical dictionary'], ['video', 'ভিডিও', 'Videos']];
let curLearn = 'posts';
function renderLearnTabs() { $('#learnTabs').innerHTML = LEARN.map(([id, b, e]) => `<button data-l="${id}" class="${id === curLearn ? 'on' : ''}">${L(b, e)}</button>`).join(''); }
$('#learnTabs').addEventListener('click', (e) => { const b = e.target.closest('[data-l]'); if (!b) return; curLearn = b.dataset.l; renderLearnTabs(); renderLearn(); });
const QUIZ = [
  ['সর্দি-কাশি হলেই অ্যান্টিবায়োটিক খেলে তাড়াতাড়ি সারে।', 'Antibiotics cure a cold faster.', false, 'সাধারণ সর্দি-কাশি ও ফ্লু ভাইরাসজনিত; অ্যান্টিবায়োটিক ভাইরাসে কাজ করে না (WHO)।', 'Colds and flu are viral; antibiotics do not work on viruses (WHO).'],
  ['খাবার স্যালাইন কম পানিতে ঘন করে বানালে বেশি উপকার।', 'ORS works better if made thicker with less water.', false, 'প্যাকেটের নিয়মে পুরো আধা লিটার পানি দিন; ঘন স্যালাইন শিশুর জন্য ক্ষতিকর হতে পারে।', 'Use the full half litre as the packet says; thick ORS can harm children.'],
  ['শুধু মিষ্টি খেলেই ডায়াবেটিস হয়।', 'Only eating sweets causes diabetes.', false, 'বাড়তি ওজন, কম পরিশ্রম ও বংশগত কারণ টাইপ ২ ডায়াবেটিসের বড় ঝুঁকি।', 'Extra weight, low activity and family history are big risks for type 2 diabetes.'],
  ['বন্ধ ঘরে কয়লা বা চুলার আগুন জ্বালিয়ে ঘুমানো বিপজ্জনক।', 'Sleeping in a closed room with a coal or gas fire is dangerous.', true, 'কার্বন মনোক্সাইড জমে ঘুমের মধ্যেই অজ্ঞান হয়ে মৃত্যু হতে পারে।', 'Carbon monoxide can build up and kill during sleep.'],
  ['সাবান দিয়ে অন্তত ২০ সেকেন্ড হাত ধোয়া উচিত।', 'Wash hands with soap for at least 20 seconds.', true, 'এতে ডায়রিয়া ও শ্বাসতন্ত্রের অনেক সংক্রমণ কমে (WHO, CDC)।', 'It cuts diarrhoea and many respiratory infections (WHO, CDC).'],
  ['ডেঙ্গু জ্বরে ব্যথার জন্য যেকোনো ব্যথানাশক খাওয়া যায়।', 'Any painkiller is fine for dengue fever.', false, 'ডেঙ্গুতে আইবুপ্রোফেন/অ্যাসপিরিন জাতীয় ওষুধ রক্তপাতের ঝুঁকি বাড়ায়; ডাক্তারের পরামর্শ নিন।', 'Ibuprofen/aspirin-type drugs raise bleeding risk in dengue; ask a doctor.'],
  ['স্ট্রোকের লক্ষণ দেখা দিলে যত দ্রুত সম্ভব হাসপাতালে যেতে হবে।', 'With stroke signs, get to hospital as fast as possible.', true, 'প্রতিটি মিনিট গুরুত্বপূর্ণ; দ্রুত চিকিৎসায় ক্ষতি কমে।', 'Every minute counts; fast treatment limits damage.'],
  ['সাপে কাটলে শক্ত করে বেঁধে কাটা জায়গা চিরে বিষ বের করা উচিত।', 'For a snake bite, tie it tight and cut the wound to remove venom.', false, 'শক্ত বাঁধন বা কাটাকাটি ক্ষতি করে; স্থির রেখে দ্রুত হাসপাতালে অ্যান্টিভেনম নিন।', 'Tight ties and cutting cause harm; keep still and get antivenom at a hospital fast.'],
  ['পুড়ে গেলে টুথপেস্ট লাগানো ভালো।', 'Toothpaste is good for burns.', false, '২০ মিনিট ঠান্ডা প্রবাহমান পানি দিন; টুথপেস্ট সংক্রমণ বাড়াতে পারে।', 'Cool with running water for 20 minutes; toothpaste can cause infection.'],
  ['খিঁচুনির সময় মুখে চামচ দেওয়া উচিত নয়।', 'You should not put a spoon in the mouth during a fit.', true, 'এতে দাঁত ভাঙা বা শ্বাস আটকানোর ঝুঁকি; কাত করে শুইয়ে দিন।', 'It can break teeth or block breathing; roll them on their side.'],
  ['কুকুর কামড়ালে ক্ষত সাবান-পানিতে ১৫ মিনিট ধোয়া ও টিকা নেওয়া জরুরি।', 'After a dog bite, wash the wound 15 minutes with soap and get the vaccine.', true, 'জলাতঙ্ক একবার শুরু হলে প্রায় সবসময় মারাত্মক; টিকাই রক্ষা করে।', 'Rabies is almost always fatal once it starts; the vaccine protects.'],
  ['যক্ষ্মা পুরোপুরি সারানো যায়, আর সরকারি কেন্দ্রে ওষুধ বিনামূল্যে।', 'TB is fully curable and medicines are free at government centres.', true, 'পুরো কোর্স শেষ করলে সারে।', 'It is cured if the full course is finished.'],
  ['জন্ডিস হলে ঝাড়ফুঁকেই সেরে যায়।', 'Folk healing cures jaundice.', false, 'জন্ডিস লিভারের রোগের লক্ষণ; কারণ খুঁজতে ডাক্তার দেখান।', 'Jaundice is a sign of liver disease; see a doctor to find the cause.'],
  ['উচ্চ রক্তচাপে সবসময় লক্ষণ থাকে।', 'High blood pressure always causes symptoms.', false, 'বেশিরভাগ সময় কোনো লক্ষণ থাকে না, তাই নিয়মিত মাপা জরুরি।', 'It usually has no symptoms, so regular checks matter.']
];
let qi = 0, qs = 0;
const VAX = [[0, 'জন্মের পর', 'At birth', 'বিসিজি (যক্ষ্মা)', 'BCG (tuberculosis)'], [42, '৬ সপ্তাহ', '6 weeks', 'পেন্টাভ্যালেন্ট-১, ওপিভি-১, পিসিভি-১, আইপিভি-১', 'Pentavalent 1, OPV 1, PCV 1, IPV 1'], [70, '১০ সপ্তাহ', '10 weeks', 'পেন্টাভ্যালেন্ট-২, ওপিভি-২, পিসিভি-২', 'Pentavalent 2, OPV 2, PCV 2'], [98, '১৪ সপ্তাহ', '14 weeks', 'পেন্টাভ্যালেন্ট-৩, ওপিভি-৩, পিসিভি-৩, আইপিভি-২', 'Pentavalent 3, OPV 3, PCV 3, IPV 2'], [274, '৯ মাস', '9 months', 'এমআর-১ (হাম-রুবেলা), টাইফয়েড টিকা (টিসিভি)', 'MR 1 (measles-rubella), typhoid vaccine (TCV)'], [456, '১৫ মাস', '15 months', 'এমআর-২', 'MR 2']];
const MED = [
  ['ডাক্তারের প্রেসক্রিপশন ছাড়া অ্যান্টিবায়োটিক খাবেন না, আর শুরু করলে পুরো কোর্স শেষ করুন।', 'Do not take antibiotics without a prescription, and finish the full course once started.'],
  ['প্যারাসিটামল নিরাপদ, কিন্তু মাত্রার বেশি খেলে লিভারের মারাত্মক ক্ষতি হয়। অন্য সর্দি-জ্বরের ওষুধেও প্যারাসিটামল থাকতে পারে, লেবেল দেখুন।', 'Paracetamol is safe at the right dose, but too much badly damages the liver. Cold and flu mixes may also contain it, so read labels.'],
  ['অন্যের প্রেসক্রিপশনের ওষুধ খাবেন না, নিজের ওষুধ অন্যকে দেবেন না।', 'Never take someone else’s prescription medicine, or share yours.'],
  ['কেনার সময় মেয়াদ ও প্যাকেট ঠিক আছে কিনা দেখুন।', 'Check the expiry date and packaging when you buy.'],
  ['গর্ভাবস্থা ও বুকের দুধ খাওয়ানোর সময় যেকোনো ওষুধের আগে ডাক্তারকে জিজ্ঞেস করুন।', 'In pregnancy or while breastfeeding, ask a doctor before any medicine.'],
  ['শিশুর ওষুধের মাত্রা ওজন অনুযায়ী হয়; ড্রপার/চামচ মেপে দিন, আন্দাজে নয়।', 'Children’s doses depend on weight; measure with the dropper or spoon, never guess.'],
  ['ওষুধ শিশুদের নাগালের বাইরে, ঠান্ডা ও শুকনো জায়গায় রাখুন।', 'Keep medicines out of children’s reach, in a cool, dry place.'],
  ['ওষুধ খেয়ে র‍্যাশ, ঠোঁট ফোলা বা শ্বাসকষ্ট হলে সাথে সাথে হাসপাতালে যান।', 'If a medicine causes rash, lip swelling or breathlessness, go to hospital at once.']
];
const DICT = [['CBC', 'রক্তের পূর্ণ পরীক্ষা: হিমোগ্লোবিন, শ্বেত ও লোহিত কণিকা, প্লাটিলেট', 'Complete blood count: haemoglobin, white and red cells, platelets'], ['ESR', 'শরীরে প্রদাহ আছে কিনা তার একটি সাধারণ ইঙ্গিত', 'A general sign of inflammation'], ['HbA1c', 'গত ২–৩ মাসের গড় ব্লাড সুগার', 'Average blood sugar over 2–3 months'], ['FBS / RBS', 'খালি পেটে / যেকোনো সময়ে ব্লাড সুগার', 'Fasting / random blood sugar'], ['ECG', 'হৃৎপিণ্ডের বৈদ্যুতিক সংকেতের পরীক্ষা', 'A recording of the heart’s electrical signals'], ['Echo', 'আলট্রাসাউন্ডে হৃৎপিণ্ডের গঠন ও কাজ দেখা', 'Ultrasound of the heart’s structure and pumping'], ['USG', 'আলট্রাসনোগ্রাম: শব্দতরঙ্গে শরীরের ভেতরের ছবি', 'Ultrasound: pictures of inside the body using sound waves'], ['CT scan', 'এক্স-রে দিয়ে শরীরের ভেতরের স্তরে স্তরে ছবি', 'Layered X-ray pictures of the inside of the body'], ['MRI', 'চুম্বক ও রেডিও তরঙ্গে বিস্তারিত ছবি, কোনো এক্স-রে নেই', 'Detailed pictures with magnets and radio waves, no X-rays'], ['Creatinine', 'কিডনি কতটা ভালো কাজ করছে তার সূচক', 'A marker of how well the kidneys work'], ['SGPT / ALT', 'লিভারের এনজাইম; বেশি হলে লিভারে সমস্যা থাকতে পারে', 'A liver enzyme; high levels can mean liver trouble'], ['TSH', 'থাইরয়েড কতটা কাজ করছে তার পরীক্ষা', 'A test of how the thyroid is working'], ['Lipid profile', 'কোলেস্টেরল ও ট্রাইগ্লিসারাইড পরীক্ষা', 'Cholesterol and triglyceride test'], ['HBsAg', 'হেপাটাইটিস বি ভাইরাস আছে কিনা পরীক্ষা', 'A test for hepatitis B virus'], ['NS1', 'ডেঙ্গুর শুরুর দিকের পরীক্ষা', 'An early dengue test'], ['Platelet', 'রক্ত জমাট বাঁধায় সাহায্যকারী কণা', 'Blood cells that help clotting'], ['Hypertension', 'উচ্চ রক্তচাপ', 'High blood pressure'], ['Hypoglycaemia', 'রক্তে সুগার কমে যাওয়া', 'Low blood sugar'], ['Antibiotic', 'ব্যাকটেরিয়া মারার ওষুধ; ভাইরাসে কাজ করে না', 'Medicine that kills bacteria; useless against viruses'], ['ORS', 'খাবার স্যালাইন: ডায়রিয়ায় পানিশূন্যতা ঠেকায়', 'Oral rehydration salts: prevents dehydration in diarrhoea'], ['BMI', 'উচ্চতা অনুযায়ী ওজনের সূচক', 'Weight-for-height index'], ['AQI', 'বাতাসের মানের সূচক; ৩০০-এর বেশি মানে বিপজ্জনক', 'Air quality index; above 300 is hazardous']];
const SURVEY = [['q1', 'শেষ কবে ব্লাড প্রেসার মেপেছেন?', 'When did you last check your blood pressure?', [['৬ মাসের মধ্যে', 'Within 6 months'], ['১ বছরের মধ্যে', 'Within a year'], ['১ বছরের বেশি আগে', 'Over a year ago'], ['কখনো না', 'Never']]], ['q2', 'অসুস্থ হলে প্রথমে কোথায় যান?', 'Where do you go first when sick?', [['সরকারি হাসপাতাল', 'Government hospital'], ['বেসরকারি হাসপাতাল/ক্লিনিক', 'Private hospital/clinic'], ['ফার্মেসি', 'Pharmacy'], ['অপেক্ষা করি', 'I wait']]], ['q3', 'কোন বিষয়ে ভিডিও চান?', 'Which topic do you want a video on?', [['ডায়াবেটিস', 'Diabetes'], ['হার্ট ও প্রেসার', 'Heart & BP'], ['শিশুর স্বাস্থ্য', 'Child health'], ['মানসিক স্বাস্থ্য', 'Mental health'], ['নারীর স্বাস্থ্য', 'Women’s health']]]];
function renderLearn() {
  const B = $('#learnBox');
  if (curLearn === 'posts') B.innerHTML = `<div class="grid">${DATA.posts.map(postCard).join('')}</div>`;
  else if (curLearn === 'quiz') { const q = QUIZ[qi % QUIZ.length];
    B.innerHTML = `<div class="card" style="max-width:720px"><p class="small muted">${L(`প্রশ্ন ${NB(qi % QUIZ.length + 1)} / ${NB(QUIZ.length)} · স্কোর ${NB(qs)}`, `Question ${qi % QUIZ.length + 1} of ${QUIZ.length} · score ${qs}`)}</p><div class="q">${L(q[0], q[1])}</div><div class="ans"><button class="btn" data-a="1">${L('সত্য', 'True')}</button><button class="btn ghost" data-a="0">${L('মিথ্যা', 'False')}</button></div><div id="qres" style="margin-top:14px"></div></div>`;
    $$('[data-a]', B).forEach((b) => b.addEventListener('click', () => { const ok = (b.dataset.a === '1') === q[2]; if (ok) qs++; $('#qres').innerHTML = `${ok ? badge('ok', 'ঠিক!', 'Correct!') : badge('bad', 'ভুল', 'Wrong')} <b>${q[2] ? L('সত্য', 'True') : L('মিথ্যা', 'False')}</b><p>${L(q[3], q[4])}</p><button class="btn y" id="qn">${L('পরের প্রশ্ন', 'Next question')}</button>`; $$('[data-a]', B).forEach((x) => (x.disabled = true)); $('#qn').onclick = () => { qi++; renderLearn(); }; })); }
  else if (curLearn === 'vax') { B.innerHTML = `<div class="tool card"><div><h3>${L('সরকারি টিকা (EPI) সময়সূচি', 'Government EPI schedule')}</h3><label for="dob">${L('শিশুর জন্মতারিখ', "Child's date of birth")}</label><input type="date" id="dob" max="${new Date().toISOString().slice(0, 10)}"><p class="note">${L('সব টিকা সরকারি কেন্দ্রে বিনামূল্যে। মেয়েদের জন্য ১০–১৪ বছর বয়সে এইচপিভি টিকা (জরায়ুমুখ ক্যান্সার প্রতিরোধ)।', 'All vaccines are free at government centres. HPV vaccine for girls aged 10–14 (cervical cancer prevention).')}</p></div><div class="result" id="vres"></div></div>`;
    const draw = () => { const d = new Date($('#dob').value), has = !isNaN(d); store.set('dob', $('#dob').value);
      $('#vres').innerHTML = VAX.map(([days, ab, ae, vb, ve]) => { const due = has ? new Date(d.getTime() + days * 864e5) : null, past = has && due < Date.now(); return `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><b>${L(ab, ae)}</b>${has ? ` · <span class="small">${due.toLocaleDateString(isBn() ? 'bn-BD' : 'en-GB')}</span> ${past ? badge('ok', 'সময় হয়েছে / পার হয়েছে', 'Due / past') : badge('warn', 'আসছে', 'Upcoming')}` : ''}<div class="small">${L(vb, ve)}</div></div>`; }).join('') + `<p class="note">${L('সূত্র: স্বাস্থ্য অধিদপ্তরের ইপিআই সময়সূচি। টিকা কার্ড দেখে স্বাস্থ্যকর্মীর সাথে মিলিয়ে নিন।', 'Source: DGHS EPI schedule. Check with your health worker using the vaccine card.')}</p>`; };
    $('#dob').value = store.get('dob', ''); $('#dob').addEventListener('input', draw); draw(); }
  else if (curLearn === 'med') B.innerHTML = `<div class="grid">${MED.map((m, i) => `<div class="card"><div class="ico">${NB(i + 1)}</div><p style="margin:0">${L(m[0], m[1])}</p></div>`).join('')}</div><p class="note">${L('আমরা কোনো ওষুধের মাত্রা বলি না; মাত্রা শুধু ডাক্তার ঠিক করবেন।', 'We never give medicine doses; only a doctor should set them.')}</p>`;
  else if (curLearn === 'dict') { B.innerHTML = `<input id="dq" placeholder="${isBn() ? 'শব্দ খুঁজুন' : 'Search a word'}" aria-label="search"><div class="scroll" style="margin-top:14px"><table class="stack"><thead><tr><th>${L('শব্দ', 'Word')}</th><th>${L('মানে', 'Meaning')}</th></tr></thead><tbody id="dbody"></tbody></table></div>`;
    const draw = () => { const q = $('#dq').value.toLowerCase(); $('#dbody').innerHTML = DICT.filter((d) => d.join(' ').toLowerCase().includes(q)).map((d) => `<tr><td><b>${d[0]}</b></td><td>${L(d[1], d[2])}</td></tr>`).join(''); }; $('#dq').addEventListener('input', draw); draw(); }
  else if (curLearn === 'survey') { B.innerHTML = `<form class="card" id="sv" style="max-width:720px"><h3>${L('২ মিনিটের স্বাস্থ্য সার্ভে', '2-minute health survey')}</h3><p class="small muted">${L('নাম লাগবে না। উত্তরগুলো আমাদের পরবর্তী কনটেন্ট ঠিক করতে সাহায্য করবে।', 'No name needed. Your answers help us plan content.')}</p>${SURVEY.map(([id, qb, qe, opts]) => `<fieldset style="border:0;padding:0;margin:14px 0"><legend><b>${L(qb, qe)}</b></legend>${opts.map((o, i) => `<label style="font-weight:400;display:flex;gap:10px;align-items:center;min-height:40px"><input type="radio" name="${id}" value="${o[1]}" style="width:auto;min-height:0" ${i ? '' : 'required'}> ${L(o[0], o[1])}</label>`).join('')}</fieldset>`).join('')}<button class="btn" ${CONFIG.SURVEY_URL ? '' : 'disabled'}>${L('জমা দিন', 'Submit')}</button><p id="svmsg" class="small">${CONFIG.SURVEY_URL ? '' : L('সার্ভে খুব শিগগিরই চালু হচ্ছে।', 'The survey opens very soon.')}</p></form>`;
    $('#sv').addEventListener('submit', async (e) => { e.preventDefault(); if (!CONFIG.SURVEY_URL) return; const fd = new FormData(e.target); fd.append('lang', document.documentElement.dataset.lang); fd.append('ts', new Date().toISOString());
      try { await fetch(CONFIG.SURVEY_URL, { method: 'POST', mode: 'no-cors', body: fd }); $('#svmsg').innerHTML = L('ধন্যবাদ! আপনার উত্তর জমা হয়েছে।', 'Thank you! Your answers were submitted.'); e.target.querySelector('button').disabled = true; } catch (err) { $('#svmsg').innerHTML = L('জমা হয়নি, আবার চেষ্টা করুন।', 'Not submitted, please try again.'); } }); }
  else if (curLearn === 'video') B.innerHTML = `<div class="grid">${[['ডেঙ্গু: লক্ষণ, বিপদ চিহ্ন, প্রতিরোধ', 'Dengue: signs, danger signs, prevention'], ['শীতে শিশুর নিউমোনিয়া', 'Child pneumonia in winter'], ['হাম: লক্ষণ, বিপদ চিহ্ন, টিকা', 'Measles: signs, danger signs, vaccine'], ['স্ট্রোক: F.A.S.T. ও প্রথমে করণীয়', 'Stroke: F.A.S.T. and first steps']].map(([b, e]) => `<a class="card link" target="_blank" rel="noopener" href="${CONFIG.FB_URL}${CONFIG.FB_URL.includes('?') ? '&sk=videos' : '/videos'}" style="text-decoration:none;color:inherit"><div class="ico">▶</div><h3>${L(b, e)}</h3><p class="small muted" style="margin:0">${L('ফেসবুকে দেখুন', 'Watch on Facebook')}</p></a>`).join('')}</div>`;
}

// ===== health A-Z =====
const HT = [['dz', 'রোগ A–Z', 'Diseases A–Z'], ['fa', 'প্রাথমিক চিকিৎসা', 'First aid'], ['rf', 'কখন হাসপাতালে?', 'When to go to hospital'], ['ck', 'চেকআপ গাইড', 'Check-up guide'], ['ss', 'ঋতুভিত্তিক রোগ', 'Seasonal illness'], ['lv', 'সুস্থ জীবন', 'Healthy living'], ['aq', 'বায়ুদূষণ গাইড', 'Air quality guide']];
let curH = 'dz', dzCat = 'all';
const tb = (a) => (isBn() ? a[0] : a[1]);
function renderHealthTabs() { $('#hTabs').innerHTML = HT.map(([id, b, e]) => `<button data-h="${id}" class="${id === curH ? 'on' : ''}">${L(b, e)}</button>`).join(''); }
$('#hTabs').addEventListener('click', (e) => { const b = e.target.closest('[data-h]'); if (!b) return; curH = b.dataset.h; renderHealthTabs(); renderHealth(); });
function renderHealth() { const D = DATA.lib, B = $('#hBox'); if (!D) { B.innerHTML = ''; return; }
  if (curH === 'dz') { const cats = [['all', 'সব', 'All'], ['inf', 'সংক্রামক', 'Infections'], ['ncd', 'দীর্ঘমেয়াদি', 'Long-term'], ['mind', 'মানসিক', 'Mental']];
    B.innerHTML = `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px"><input id="dzq" placeholder="${isBn() ? 'রোগ বা লক্ষণ খুঁজুন' : 'Search a disease or symptom'}" aria-label="search" style="flex:1 1 260px"><div class="tabs" style="margin:0">${cats.map(([v, b, e]) => `<button data-c="${v}" class="${v === dzCat ? 'on' : ''}">${L(b, e)}</button>`).join('')}</div></div><div class="grid" id="dzg" style="grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),1fr))"></div>`;
    const draw = () => { const q = $('#dzq').value.toLowerCase(); $('#dzg').innerHTML = D.diseases.filter((d) => (dzCat === 'all' || d.cat === dzCat) && (!q || JSON.stringify(d).toLowerCase().includes(q))).map((d) => `<article class="card dz"><h3>${L(d.n[0], d.n[1])}</h3><p class="small" style="margin:0">${L(d.w[0], d.w[1])}</p><dl><dt>${L('লক্ষণ', 'Symptoms')}</dt><dd>${L(d.s[0], d.s[1])}</dd><dt>${L('প্রতিরোধ', 'Prevention')}</dt><dd>${L(d.p[0], d.p[1])}</dd><dt class="rf">⚠ ${L('কখন ডাক্তার/হাসপাতাল', 'When to get help')}</dt><dd class="rf">${L(d.r[0], d.r[1])}</dd></dl><p class="small muted" style="margin:10px 0 0">${L('কোন ডাক্তার:', 'Which doctor:')} <a href="#doctor" data-docq="${d.d}">${(DOCS.find((x) => x[1].startsWith(d.d)) || [d.d, d.d])[isBn() ? 0 : 1]}</a></p></article>`).join('') || `<p class="muted">${L('মেলেনি', 'No match')}</p>`; };
    $('#dzq').addEventListener('input', draw); $$('[data-c]', B).forEach((b) => b.addEventListener('click', () => { dzCat = b.dataset.c; renderHealth(); })); draw();
    B.insertAdjacentHTML('beforeend', `<p class="note">${L('সূত্র: WHO ফ্যাক্ট শিট, স্বাস্থ্য অধিদপ্তর ও icddr,b নির্দেশিকা। এটি সচেতনতার জন্য; চিকিৎসা ডাক্তার ঠিক করবেন।', 'Sources: WHO fact sheets, DGHS and icddr,b guidance. For awareness; treatment is for a doctor to decide.')}</p>`); }
  else if (curH === 'fa') B.innerHTML = `<p class="card" style="background:#1d0e0e;color:#fff;border:0">${L('জীবন ঝুঁকিতে থাকলে আগে ৯৯৯-এ কল করুন, তারপর প্রাথমিক চিকিৎসা দিন।', 'If a life is at risk, call 999 first, then give first aid.')}</p><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(min(100%,360px),1fr));margin-top:14px">${D.firstaid.map((f, i) => `<article class="card" id="fa${i}"><h3>${L(f.n[0], f.n[1])}</h3><div class="cols2"><div class="do"><b>✓ ${L('যা করবেন', 'Do')}</b><br>${L(f.do[0], f.do[1])}</div><div class="dont"><b>✗ ${L('যা করবেন না', "Don't")}</b><br>${L(f.dont[0], f.dont[1])}</div></div></article>`).join('')}</div><p class="note">${L('সূত্র: WHO, রেড ক্রস ও NHS প্রাথমিক চিকিৎসা নির্দেশিকা।', 'Sources: WHO, Red Cross and NHS first-aid guidance.')}</p>`;
  else if (curH === 'rf') B.innerHTML = `<p class="muted">${L('এসব লক্ষণে অপেক্ষা না করে হাসপাতালের জরুরি বিভাগে যান বা ৯৯৯-এ কল করুন।', 'With any of these signs, go to emergency now or call 999.')}</p><div class="grid">${D.redflags.map((g) => `<div class="card"><h3 style="color:var(--red)">⚠ ${L(g.g[0], g.g[1])}</h3><ul style="margin:0;padding-left:20px">${g.l.map((x) => `<li>${L(x[0], x[1])}</li>`).join('')}</ul></div>`).join('')}</div>`;
  else if (curH === 'ck') B.innerHTML = `<div class="scroll"><table class="stack"><thead><tr><th>${L('পরীক্ষা', 'Check')}</th><th>${L('কখন', 'When')}</th></tr></thead><tbody>${D.checkups.map((c) => `<tr><td><b>${L(c.t[0], c.t[1])}</b></td><td>${L(c.w[0], c.w[1])}</td></tr>`).join('')}</tbody></table></div><p class="note">${L('সাধারণ নির্দেশনা (WHO, ADA, NHS ও জাতীয় স্ক্রিনিং কর্মসূচি)। আপনার ঝুঁকি অনুযায়ী ডাক্তার সময় বদলাতে পারেন।', 'General guidance (WHO, ADA, NHS and the national screening programme). A doctor may change timing for your risk.')} <a href="#prices">${L('টেস্টের দাম দেখুন →', 'See test prices →')}</a></p>`;
  else if (curH === 'ss') { const m = new Date().getMonth(), cur = m >= 2 && m <= 4 ? 0 : m >= 5 && m <= 8 ? 1 : m <= 10 && m >= 9 ? 2 : 3;
    B.innerHTML = `<div class="grid">${D.seasons.map((x, i) => `<div class="card" style="${i === cur ? 'border:2px solid var(--yel)' : ''}"><h3>${L(x.s[0], x.s[1])} ${i === cur ? badge('warn', 'এখন', 'Now') : ''}</h3><p class="small"><b>${L('যে রোগ বাড়ে:', 'What rises:')}</b> ${L(x.d[0], x.d[1])}</p><p class="small" style="margin:0"><b>${L('করণীয়:', 'What to do:')}</b> ${L(x.t[0], x.t[1])}</p></div>`).join('')}</div>`; }
  else if (curH === 'lv') B.innerHTML = `<div class="grid">${D.living.map((x) => `<div class="card"><h3>${L(x.t[0], x.t[1])}</h3><p class="small" style="margin:0">${L(x.v[0], x.v[1])}</p></div>`).join('')}</div><h3 style="margin-top:26px">${L('বয়স অনুযায়ী কত ঘণ্টা ঘুম দরকার', 'How much sleep by age')}</h3><div class="scroll"><table><thead><tr><th>${L('বয়স', 'Age')}</th><th>${L('ঘণ্টা / দিন', 'Hours / day')}</th></tr></thead><tbody>${D.sleep.map((r) => `<tr><td>${L(r[0][0], r[0][1])}</td><td class="n" style="text-align:left">${L(r[1], r[2])}</td></tr>`).join('')}</tbody></table></div><p class="note">${L('ঘুমের সূত্র: আমেরিকান একাডেমি অব স্লিপ মেডিসিন।', 'Sleep source: American Academy of Sleep Medicine.')} <a href="#tools" data-tool-go="sleep">${L('ঘুমের সময় ক্যালকুলেটর →', 'Sleep timer →')}</a></p>`;
  else if (curH === 'aq') B.innerHTML = `<div class="scroll"><table class="aqi stack"><thead><tr><th>AQI</th><th>${L('মান', 'Level')}</th><th>${L('করণীয়', 'What to do')}</th></tr></thead><tbody>${D.aqi.map((r) => `<tr><td><span class="sw" style="background:${r[4]}"></span>${L(r[0], r[1])}</td><td>${L(r[2], r[3])}</td><td>${L(r[5], r[6])}</td></tr>`).join('')}</tbody></table></div><p class="note">${L('যুক্তরাষ্ট্রের EPA মানদণ্ড, যা IQAir-সহ বেশিরভাগ অ্যাপ ব্যবহার করে। দূষিত দিনে N95/KN95 মাস্ক সাধারণ মাস্কের চেয়ে ভালো কাজ করে।', 'US EPA scale, used by IQAir and most apps. On polluted days N95/KN95 masks work better than cloth masks.')}</p>`;
}
document.addEventListener('click', (e) => { const a = e.target.closest('[data-docq]'); if (a) { setTimeout(() => { $('#docSearch').value = a.dataset.docq.split(' ')[0]; renderDocs(); }, 0); } const t = e.target.closest('[data-tool-go]'); if (t) { curTool = t.dataset.toolGo; renderToolTabs(); renderTool(); } });
function renderHome2() { const D = DATA.lib; if (!D) return; const m = new Date().getMonth(), cur = m >= 2 && m <= 4 ? 0 : m >= 5 && m <= 8 ? 1 : m <= 10 && m >= 9 ? 2 : 3, x = D.seasons[cur];
  $('#seasonCard').innerHTML = `<h3>${L('এই মৌসুমে সাবধান', 'Watch out this season')}: ${L(x.s[0], x.s[1])}</h3><p class="small"><b>${L('যে রোগ বাড়ে:', 'What rises:')}</b> ${L(x.d[0], x.d[1])}</p><p class="small" style="margin:0"><b>${L('করণীয়:', 'What to do:')}</b> ${L(x.t[0], x.t[1])}</p><p style="margin:12px 0 0"><a href="#health">${L('রোগের তালিকা দেখুন →', 'See the disease list →')}</a></p>`;
  $('#faChips').innerHTML = D.firstaid.map((f, i) => `<a href="#health" data-fa="${i}">${L(f.n[0], f.n[1])}</a>`).join(''); }
document.addEventListener('click', (e) => { const a = e.target.closest('[data-fa]'); if (!a) return; curH = 'fa'; setTimeout(() => { renderHealthTabs(); renderHealth(); const el = $('#fa' + a.dataset.fa); if (el) { el.scrollIntoView({ block: 'center' }); el.style.outline = '3px solid var(--yel)'; } }, 60); });
function renderInst() { const D = DATA.lib; if (!D) return; const q = ($('#instSearch').value || '').toLowerCase();
  $('#instGrid').innerHTML = D.institutes.filter((r) => !q || r.join(' ').toLowerCase().includes(q)).map((r) => `<div class="card"><h3 style="font-size:17px">${L(r[0], r[1])}</h3><p class="small muted" style="margin:0">${L(r[2], r[3])} · ${L(r[4], r[5])}</p><a class="small" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r[1] + ' ' + r[3])}">${L('ম্যাপে দেখুন', 'Open in maps')} →</a></div>`).join(''); }
$('#instSearch').addEventListener('input', renderInst);

// ===== boot =====
function rerender() { renderFeatures(); renderPosts(); renderToolTabs(); renderTool(); fillGeo(); renderSOS(); renderDocs(); renderPrices(); renderLearnTabs(); renderLearn(); renderAlerts(); renderHealthTabs(); renderHealth(); renderHome2(); renderInst(); $('#instSearch').placeholder = isBn() ? 'হাসপাতাল বা রোগ খুঁজুন (যেমন: হার্ট, চট্টগ্রাম)' : 'Search hospital or illness (e.g. heart, Chattogram)'; $('#docSearch').placeholder = isBn() ? 'যেমন: বুকে ব্যথা, জ্বর, চোখ' : 'e.g. chest pain, fever, eye'; $('#priceSearch').placeholder = isBn() ? 'টেস্ট খুঁজুন' : 'Search a test'; }
(async () => {
  const [posts, geo, prices, alerts, lib] = await Promise.all(['data/posts.json', 'data/geo.json', 'data/prices.json', 'data/alerts.json', 'data/library.json'].map(getJSON));
  DATA.posts = posts || []; DATA.geo = geo; DATA.prices = prices; DATA.alerts = alerts; DATA.lib = lib;
  setLang(store.get('lang', 'bn')); route();
})();
if ('serviceWorker' in navigator && location.protocol === 'https:' && /github\.io$/.test(location.hostname)) navigator.serviceWorker.register('sw.js').catch(() => {});
}
