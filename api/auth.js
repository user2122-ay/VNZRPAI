const db = require('../lib/db'), { setSession, clear, norm, log, AREAS } = require('../lib/auth');
const E = process.env, same = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
const MAX = 5, WAIT = 15 * 60 * 1000;
module.exports = async (req, res) => {
  const a = req.query.action, b = req.body || {};
  if (a === 'logout') { clear(res); return res.redirect('/'); }
  if (req.method !== 'POST') return res.status(405).json({});
  const d = await db(), M = d.collection('members'), A = d.collection('attempts');
  const id = norm(b.user), badge = String(b.badge || '').trim().slice(0, 20);
  if (!id || !badge) return res.status(400).json({ e: 'Escribe tu usuario de Discord y tu placa.' });

  if (a === 'request') {
    if (!AREAS.includes(b.cargo)) return res.status(400).json({ e: 'Elige tu cargo.' });
    if (id === norm(E.ADMIN_USER) || await M.findOne({ _id: id })) return res.status(409).json({ e: 'Ya existe una solicitud o cuenta con ese usuario.' });
    await M.insertOne({ _id: id, user: id, nick: String(b.user).trim().replace(/^@/, '').slice(0, 40), badge, cargo: b.cargo, status: 'pendiente', ts: new Date() });
    await log(d, `${id} (${badge}) solicitó acceso como ${b.cargo}`);
    return res.json({ ok: 1 });
  }

  if (a === 'login') {
    const t = await A.findOne({ _id: id });
    if (t && t.n >= MAX && Date.now() - t.ts < WAIT) return res.status(429).json({ e: 'Demasiados intentos. Espera 15 minutos.' });
    let m = await M.findOne({ _id: id });
    // el primer ingreso del admin (ADMIN_USER + ADMIN_BADGE) crea la cuenta de Administrador
    if (!m && id === norm(E.ADMIN_USER) && same(badge, E.ADMIN_BADGE || 'AI-01')) {
      m = { _id: id, user: id, nick: E.ADMIN_USER, badge, cargo: 'Asuntos Internos', role: 'Administrador', status: 'activo', ts: new Date() };
      await M.insertOne(m);
    }
    if (!m || !same(m.badge, badge)) {
      await A.updateOne({ _id: id }, t && Date.now() - t.ts < WAIT ? { $inc: { n: 1 }, $set: { ts: Date.now() } } : { $set: { n: 1, ts: Date.now() } }, { upsert: true });
      return res.status(401).json({ e: 'Usuario o placa incorrectos.' });
    }
    if (m.status === 'pendiente') return res.status(403).json({ e: 'Tu solicitud sigue en revisión. Vuelve más tarde.' });
    if (m.status !== 'activo') return res.status(403).json({ e: 'Tu solicitud fue rechazada.' });
    await A.deleteOne({ _id: id });
    setSession(res, m._id);
    return res.json({ ok: 1 });
  }
  res.status(400).json({});
};
