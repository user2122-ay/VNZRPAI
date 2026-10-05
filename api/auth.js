const db = require('../lib/db'), { setSession, clear } = require('../lib/auth');
module.exports = async (req, res) => {
  const a = req.query.action, E = process.env, redirect = E.APP_URL + '/auth/callback';
  if (a === 'login') return res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${E.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirect)}&response_type=code&scope=identify`);
  if (a === 'logout') { clear(res); return res.redirect('/'); }
  const t = await (await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: E.DISCORD_CLIENT_ID, client_secret: E.DISCORD_CLIENT_SECRET, grant_type: 'authorization_code', code: req.query.code || '', redirect_uri: redirect })
  })).json();
  if (!t.access_token) return res.redirect('/');
  const u = await (await fetch('https://discord.com/api/users/@me', { headers: { Authorization: 'Bearer ' + t.access_token } })).json();
  const M = (await db()).collection('members'), adm = u.username === E.ADMIN_USER;
  await M.updateOne({ _id: u.id }, {
    $set: { user: u.username, avatar: u.avatar },
    $setOnInsert: adm ? { nick: u.username, badge: 'AI-01', cargo: 'Asuntos Internos', role: 'Administrador', status: 'activo' } : { nick: u.username, status: 'nuevo' }
  }, { upsert: true });
  setSession(res, u.id);
  res.redirect('/');
};
