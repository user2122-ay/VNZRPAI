const db = require('../lib/db'), { user, log, who, ALL, AREAS } = require('../lib/auth');
const P = { 'Asuntos Internos': 'AI', 'Asuntos Disciplinarios': 'AD', 'Asuntos Sociales': 'AS' };
const F = ['tipo', 'dep', 'cl', 'inv', 'san', 'comp', 'foto', 'ant', 'hip', 'fue', 'pat', 'rie', 'rec', 'mot'];
const links = s => (Array.isArray(s) ? s : String(s || '').split(/\s+/)).filter(x => /^https?:\/\//.test(x)).slice(0, 12);
module.exports = async (req, res) => {
  const me = await user(req);
  if (!me || me.status !== 'activo') return res.status(403).json({});
  const d = await db(), C = d.collection('cases'), all = ALL.includes(me.role), b = req.body || {}, w = who(me), now = new Date();
  if (req.method === 'GET') return res.json(await C.find(all ? {} : { area: me.role }).sort({ fa: -1 }).limit(200).toArray());
  if (b.action === 'create') {
    const area = all ? b.area : me.role;
    if (!AREAS.includes(area) || !['Seguimiento', 'Expediente', 'Sanción'].includes(b.tipo) || !b.dep || !b.inv) return res.status(400).json({});
    const id = `${P[area]}-${now.getFullYear()}-${String((await C.countDocuments({ area })) + 1).padStart(4, '0')}`;
    const c = { _id: id, id, area, pru: links(b.pru), est: b.tipo === 'Sanción' ? 'Registrada' : 'En investigación', by: `${me.nick} (${me.badge})`, fa: now };
    F.forEach(k => c[k] = String(b[k] || '').slice(0, 2000));
    c.ev = [{ h: now, t: b.tipo === 'Sanción' ? `Sanción ${c.san} registrada por ${w}` : `Caso abierto por ${w} · En investigación` }];
    await C.insertOne(c);
    await log(d, `${w} ${b.tipo === 'Sanción' ? 'registró la sanción' : 'abrió el ' + b.tipo.toLowerCase()} ${id} · ${area}`);
    return res.json({ id });
  }
  const c = await C.findOne({ _id: String(b.id) });
  if (!c || !(all || c.area === me.role)) return res.status(404).json({});
  if (b.action === 'status' && ['Cerrado', 'Concluido'].includes(b.est) && b.res) {
    await C.updateOne({ _id: c._id }, { $set: { est: b.est, res: String(b.res).slice(0, 2000), fc: now }, $push: { ev: { h: now, t: `Caso ${b.est.toLowerCase()} por ${w}` } } });
    await log(d, `${w} ${b.est === 'Cerrado' ? 'cerró' : 'concluyó'} el caso ${c._id}`);
  }
  if (b.action === 'proof' && links(b.pru).length) {
    await C.updateOne({ _id: c._id }, { $push: { pru: { $each: links(b.pru) }, ev: { h: now, t: `Pruebas agregadas por ${w}` } } });
    await log(d, `${w} agregó pruebas al caso ${c._id}`);
  }
  if (b.action === 'copied') {
    await C.updateOne({ _id: c._id }, { $push: { ev: { h: now, t: `Texto para Discord copiado por ${w}` } } });
    await log(d, `${w} copió el texto de Discord del caso ${c._id}`);
  }
  res.json({ ok: 1 });
};
