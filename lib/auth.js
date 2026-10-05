const c = require('crypto'), db = require('./db');
const sign = v => c.createHmac('sha256', process.env.SESSION_SECRET).update(v).digest('base64url');
const ROLES = ['Administrador', 'Asuntos Internos', 'Asuntos Disciplinarios', 'Asuntos Sociales'];
exports.ROLES = ROLES;
exports.AREAS = ROLES.slice(1);
exports.ALL = ROLES.slice(0, 2);
exports.setSession = (res, id) => {
  const p = id + '.' + (Date.now() + 6048e5);
  res.setHeader('Set-Cookie', `s=${p}.${sign(p)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`);
};
exports.clear = res => res.setHeader('Set-Cookie', 's=; Path=/; Max-Age=0');
exports.user = async req => {
  const m = (req.headers.cookie || '').match(/(?:^|; )s=([^;]+)/);
  if (!m) return null;
  const [id, exp, sig] = m[1].split('.');
  if (sig !== sign(id + '.' + exp) || +exp < Date.now()) return null;
  return (await db()).collection('members').findOne({ _id: id });
};
exports.log = (d, t) => d.collection('audit').insertOne({ t, ts: new Date() });
exports.who = m => `${m.user} (${m.badge || 'sin placa'})`;
