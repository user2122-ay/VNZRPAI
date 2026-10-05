const db = require('../lib/db'), { user, ALL, AREAS } = require('../lib/auth');
module.exports = async (req, res) => {
  const me = await user(req);
  if (!me || me.status !== 'activo') return res.status(403).json({});
  const ch = req.query.canal || 'General';
  if (!(ch === 'General' || (AREAS.includes(ch) && (ALL.includes(me.role) || me.role === ch)))) return res.status(403).json({});
  const C = (await db()).collection('chat');
  if (req.method === 'POST') {
    const t = String((req.body || {}).text || '').trim().slice(0, 1000);
    if (t) await C.insertOne({ ch, u: me._id, nick: me.nick, badge: me.badge, t, ts: new Date() });
    return res.json({ ok: 1 });
  }
  res.json((await C.find({ ch }).sort({ ts: -1 }).limit(60).toArray()).reverse());
};
