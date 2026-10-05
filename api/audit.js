const db = require('../lib/db'), { user } = require('../lib/auth');
module.exports = async (req, res) => {
  const me = await user(req);
  if (!me || me.role !== 'Administrador') return res.status(403).json({});
  res.json(await (await db()).collection('audit').find().sort({ ts: -1 }).limit(200).toArray());
};
