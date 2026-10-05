const db = require('../lib/db'), { ObjectId } = require('mongodb'), { user, log, who } = require('../lib/auth');
const see = (m, t) => ['Administrador', 'Asuntos Internos'].includes(m.role) || (t === 'staff' && m.role === 'Asuntos Disciplinarios');
const mng = (m, t) => m.role === 'Administrador' || m.role === (t === 'staff' ? 'Asuntos Disciplinarios' : 'Asuntos Internos');
const T = { staff: 'Staff', miembro: 'miembros' };
const s = (v, n = 100) => String(v || '').trim().slice(0, n);
module.exports = async (req, res) => {
  const me = await user(req);
  if (!me || me.status !== 'activo') return res.status(403).json({});
  const d = await db(), B = d.collection('blacklist'), b = req.body || {}, q = s(req.query.q), w = who(me);
  if (req.method === 'GET') {
    const f = { activo: true };
    if (q) { const r = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); f.$or = [{ discord: r }, { did: r }, { roblox: r }]; }
    const l = await B.find(f).sort({ ts: -1 }).limit(100).toArray();
    return res.json(l.filter(x => q || see(me, x.tipo)).map(x => ({ ...x, razon: see(me, x.tipo) ? x.razon : undefined, can: mng(me, x.tipo) })));
  }
  if (b.action === 'add') {
    if (!T[b.tipo] || !mng(me, b.tipo)) return res.status(403).json({});
    const x = { tipo: b.tipo, discord: s(b.discord), did: s(b.did), roblox: s(b.roblox), razon: s(b.razon, 500), by: w, ts: new Date(), activo: true };
    if (!(x.discord || x.did || x.roblox) || x.razon.length < 5) return res.status(400).json({ e: 'Indica un dato de la persona y la razón.' });
    await B.insertOne(x);
    await log(d, `${w} agregó a ${x.discord || x.did || x.roblox} a la lista negra de ${T[b.tipo]} · Razón: ${x.razon}`);
    return res.json({ ok: 1 });
  }
  if (b.action === 'remove') {
    const x = await B.findOne({ _id: new ObjectId(s(b.id, 30)), activo: true }), r = s(b.razon, 500);
    if (!x || !mng(me, x.tipo) || r.length < 5) return res.status(400).json({});
    await B.updateOne({ _id: x._id }, { $set: { activo: false, retiro: { by: w, razon: r, ts: new Date() } } });
    await log(d, `${w} retiró a ${x.discord || x.did || x.roblox} de la lista negra de ${T[x.tipo]} · Razón: ${r}`);
    return res.json({ ok: 1 });
  }
  res.status(400).json({});
};
