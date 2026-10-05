const db = require('../lib/db'), { user, log, who, ROLES } = require('../lib/auth');
module.exports = async (req, res) => {
  const me = await user(req);
  if (!me) return res.status(401).json({});
  const d = await db(), M = d.collection('members'), b = req.body || {};
  if (req.method === 'GET') return res.json({ me, members: me.role === 'Administrador' ? await M.find().toArray() : [] });
  if (b.action === 'request') {
    if (me.status === 'activo') return res.json({ ok: 1 });
    const badge = String(b.badge || '').trim().slice(0, 20);
    if (!badge || !ROLES.includes(b.cargo)) return res.status(400).json({});
    await M.updateOne({ _id: me._id }, { $set: { badge, cargo: b.cargo, status: 'pendiente' } });
    await log(d, `${me.user} (${badge}) solicitó acceso como ${b.cargo}`);
    return res.json({ ok: 1 });
  }
  if (me.role !== 'Administrador') return res.status(403).json({});
  const t = await M.findOne({ _id: String(b.id) });
  if (!t) return res.status(404).json({});
  const w = who(me);
  if (b.action === 'accept' && ROLES.includes(b.role)) {
    await M.updateOne({ _id: t._id }, { $set: { role: b.role, status: 'activo' } });
    await log(d, `${w} aceptó a ${t.user} y le asignó el rol ${b.role}`);
  }
  if (b.action === 'reject') {
    await M.updateOne({ _id: t._id }, { $set: { status: 'rechazado' } });
    await log(d, `${w} rechazó la solicitud de ${t.user}`);
  }
  if (b.action === 'edit') {
    const s = { nick: String(b.nick || t.nick).slice(0, 40), badge: String(b.badge || t.badge).slice(0, 20), role: t._id === me._id || !ROLES.includes(b.role) ? t.role : b.role };
    for (const k of ['nick', 'badge', 'role']) if (s[k] !== t[k]) await log(d, `${w} cambió ${k === 'role' ? 'el rol' : k === 'nick' ? 'el nickname' : 'la placa'} de ${t.user}: ${t[k]} → ${s[k]}`);
    await M.updateOne({ _id: t._id }, { $set: s });
  }
  res.json({ ok: 1 });
};
