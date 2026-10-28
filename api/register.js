/* Vercel serverless function: validates a convention registration and appends it to the church's Google Sheet
   (an Apps Script web app, see google-apps-script/Code.gs). The sheet opens in Excel via File > Download > .xlsx.
   Env vars: SHEET_WEBHOOK_URL (required), SHEET_WEBHOOK_SECRET (recommended, must match the script's SECRET property). */
const DAYS = ['Fri 20 Nov', 'Sat 21 Nov', 'Sun 22 Nov'];
const BRANCHES = ['Lagos', 'Ibadan', 'Delta', 'Abeokuta', 'Visiting from elsewhere'];

/* stop spreadsheet formula injection: a cell starting with = + - @ would be executed as a formula */
const safe = (v, max) => {
  const s = String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
};

const makeRef = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'NT26-';
  for (let i = 0; i < 5; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }
  const url = process.env.SHEET_WEBHOOK_URL;
  if (!url) return res.status(503).json({ ok: false, error: 'not_configured' });

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || typeof b !== 'object') return res.status(400).json({ ok: false, error: 'bad_request' });

  /* honeypot: real people never fill the hidden "website" field; pretend success so bots move on */
  if (b.website) return res.status(200).json({ ok: true, ref: makeRef() });

  const name = safe(b.name, 120);
  const phone = safe(b.phone, 40);
  const email = safe(b.email, 160);
  const branch = BRANCHES.includes(b.branch) ? b.branch : '';
  const days = (Array.isArray(b.days) ? b.days : []).filter(d => DAYS.includes(d));
  const people = Math.min(20, Math.max(1, parseInt(b.people, 10) || 1));
  const firstTime = b.firstTime === 'Yes' ? 'Yes' : 'No';

  if (name.length < 2 || phone.replace(/\D/g, '').length < 7 || !branch || !days.length ||
      (email && !/^\S+@\S+\.\S+$/.test(email))) {
    return res.status(400).json({ ok: false, error: 'invalid' });
  }

  const ref = makeRef();
  try {
    const r = await fetch(url, {
      method: 'POST',
      /* text/plain keeps Apps Script from needing a CORS preflight */
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        secret: process.env.SHEET_WEBHOOK_SECRET || '',
        ref, name, phone, email, branch, days: days.join(', '), people, firstTime
      }),
      redirect: 'follow'
    });
    const data = await r.json().catch(() => null);
    if (!r.ok || !data || !data.ok) return res.status(502).json({ ok: false, error: 'sheet_failed' });
    return res.status(200).json({ ok: true, ref });
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'sheet_failed' });
  }
};
