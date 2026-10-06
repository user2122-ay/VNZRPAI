const c = require('crypto'), db = require('./db');
const sign = v => c.createHmac('sha256', process.env.SESSION_SECRET).update(v).digest('base64url');
const b64 = s => Buffer.from(s).toString('base64url'), unb64 = s => Buffer.from(s, 'base64url').toString();
const ROLES = ['Administrador', 'Asuntos Internos', 'Asuntos Disciplinarios', 'Asuntos Sociales'];
exports.ROLES = ROLES;
exports.AREAS = ROLES.slice(1);
exports.ALL = ROLES.slice(0, 2);
// el usuario de Discord (sin @, en minúsculas) es el _id del miembro
exports.norm = s => String(s || '').trim().replace(/^@/, '').toLowerCase().slice(0, 40);
exports.setSession = (res, id) => {
  const p = b64(id) + '.' + (Date.now() + 6048e5);
  res.setHeader('Set-Cookie', `s=${p}.${sign(p)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`);
};
exports.clear = res => res.setHeader('Set-Cookie', 's=; Path=/; Max-Age=0');
// solo devuelve miembros ACTIVOS: si lo rechazan o lo quitan, pierde acceso al instante
exports.user = async req => {
  const m = (req.headers.cookie || '').match(/(?:^|; )s=([^;]+)/);
  if (!m) return null;
  const [id, exp, sig] = m[1].split('.');
  if (!sig || sig !== sign(id + '.' + exp) || +exp < Date.now()) return null;
  const u = await (await db()).collection('members').findOne({ _id: unb64(id) });
  return u && u.status === 'activo' ? u : null;
};
exports.log = (d, t) => d.collection('audit').insertOne({ t, ts: new Date() });
exports.who = m => `${m.user} (${m.badge || 'sin placa'})`;
