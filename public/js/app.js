const $ = s => document.querySelector(s);
const E = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const api = async (u, b) => {
  const r = await fetch(u, b ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) } : {});
  if (r.status === 401) return null;
  return r.json().catch(() => ({}));
};
const ROLES = ['Administrador', 'Asuntos Internos', 'Asuntos Disciplinarios', 'Asuntos Sociales'], AREAS = ROLES.slice(1);
const DS = { 'Asuntos Internos': 'Comunidad: usuarios, miembros y civiles', 'Asuntos Disciplinarios': 'Staff y usuarios', 'Asuntos Sociales': 'Departamentos y sistema civil' };
const fd = d => new Date(d).toLocaleDateString('es-VE'), ft = d => new Date(d).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' });
const ST = [
  ['Datos del caso', [['dep', 'Departamento, facción o sector de la comunidad', 'i'], ['cl', 'Clasificación', 's', ['Confidencial', 'Reservado', 'Secreto']]]],
  ['Investigado', [['inv', 'Usuario completo (Roblox y Discord)', 'i'], ['comp', 'Comportamientos y actitudes', 't'], ['foto', 'Fotografía: link de imagen (opcional)', 'i']]],
  ['Motivo de investigación', [['ant', 'Antecedentes narrativos', 't'], ['hip', 'Hipótesis inicial', 't'], ['fue', 'Fuente de denuncia o inicio', 'i']]],
  ['Análisis y pruebas', [['pat', 'Patrones detectados', 't'], ['rie', 'Riesgos potenciales', 't'], ['rec', 'Recomendaciones', 't'], ['pru', 'Pruebas: links de imágenes de Discord, uno por línea (opcional)', 't']]]
];
const SA = [['Sanción', [['dep', 'Departamento', 'i'], ['inv', 'Sancionado', 'i'], ['san', 'Sanción aplicable', 's', ['Adv. 1', 'Adv. 2', 'Warn 1', 'Warn 2', 'Warn 3']], ['mot', 'Motivo', 't'], ['pru', 'Pruebas: links de imágenes de Discord, uno por línea (opcional)', 't']]]];
let me, members = [], cases = [], bl = [], aud = [], tab = 'inicio', sub = 'miembros', lt = 'staff', det = null, out = null, w = null, ch = 'General', timer, note = '', msg = '', ed = null;
const isAll = () => ['Administrador', 'Asuntos Internos'].includes(me.role), isAdm = () => me.role === 'Administrador';
const canSee = t => isAll() || (t === 'staff' && me.role === 'Asuntos Disciplinarios');
const canMng = t => isAdm() || me.role === (t === 'staff' ? 'Asuntos Disciplinarios' : 'Asuntos Internos');
const opts = (l, s) => l.map(x => `<option${x === s ? ' selected' : ''}>${x}</option>`).join('');
const val = i => $('#' + i).value.trim();
const avatar = () => '';

let lm = 'in';
function landing(m) {
  const r = lm === 'req';
  $('#app').innerHTML = `<main class="hero"><div class="flag"></div><h1>Asuntos Internos y Administrativos</h1><p>Panel interno del Staff de Venezuela Community. ${r ? 'Pide acceso con tu usuario de Discord y tu placa.' : 'Entra con tu usuario de Discord y tu placa.'}</p><label>Usuario de Discord<input id="lu" autocapitalize="none" autocomplete="username" placeholder="usuario"></label><label>Placa<input id="lb" placeholder="AI-02" onkeydown="if(event.key==='Enter')sendLogin()"></label>${r ? `<label>Cargo<select id="lc">${opts(AREAS)}</select></label>` : ''}<p class="${m && m.ok ? 'okm' : 'err'}" id="le">${E((m && m.t) || '')}</p><button class="btn pri" onclick="sendLogin()">${r ? 'Enviar solicitud' : 'Entrar'}</button><button class="btn" onclick="lm='${r ? 'in' : 'req'}';landing()">${r ? 'Ya tengo acceso' : 'Solicitar acceso'}</button></main>`;
}
async function sendLogin() {
  const user = val('lu'), badge = val('lb'), req = lm === 'req';
  if (!user || !badge) { $('#le').textContent = 'Escribe tu usuario de Discord y tu placa.'; return; }
  const r = await fetch('/api/auth?action=' + (req ? 'request' : 'login'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user, badge, cargo: req ? val('lc') : undefined }) });
  const j = await r.json().catch(() => ({}));
  if (r.ok && !req) return boot();
  if (r.ok) { lm = 'in'; return landing({ ok: 1, t: 'Solicitud enviada. Cuando te acepten, entra con tu usuario y tu placa.' }); }
  $('#le').textContent = j.e || 'Error. Intenta de nuevo.';
}
async function boot() {
  const r = await api('/api/members');
  if (!r) return landing();
  me = r.me; members = r.members || [];
  lt = canSee('staff') ? 'staff' : 'miembro';
  cases = await api('/api/cases') || [];
  go('inicio');
}
async function go(t, s) {
  clearInterval(timer); tab = t; if (s) sub = s; det = out = w = ed = null; note = msg = '';
  if (t === 'casos') cases = await api('/api/cases') || [];
  if (t === 'lista') bl = await api('/api/blacklist') || [];
  if (t === 'admin') { if (sub === 'auditoria') aud = await api('/api/audit') || []; else members = ((await api('/api/members')) || {}).members || []; }
  render();
  if (t === 'chat') { loadChat(); timer = setInterval(loadChat, 4000); }
}
function render() {
  const T = [['inicio', 'Inicio'], ['casos', 'Casos'], ['lista', 'Lista negra'], ['chat', 'Chat']];
  if (isAdm()) T.push(['admin', 'Admin']);
  const v = { inicio: vInicio, casos: vCasos, lista: vLista, chat: vChat, admin: vAdmin }[tab]();
  $('#app').innerHTML = `<header class="top"><div><b>VE:RP</b><span>Asuntos Internos y Administrativos</span></div><div class="who"><div><p>${E(me.nick)}</p><small>${E(me.badge || '')} · ${E(me.role)}</small></div><a class="btn" href="/api/auth?action=logout" style="margin-left:10px">Salir</a></div></header><main class="wrap">${v}</main><nav class="nav">${T.map(x => `<button class="${tab === x[0] ? 'on' : ''}" onclick="go('${x[0]}')">${x[1]}</button>`).join('')}</nav>`;
}
function vInicio() {
  const n = cases.filter(c => c.est === 'En investigación').length;
  return `<h1>Hola, ${E(me.nick)}</h1><p class="mu">Busca a una persona antes de aceptarla, sancionarla o abrirle un caso.</p><div class="search"><input id="q" placeholder="Usuario de Discord, ID de Discord o usuario de Roblox" onkeydown="if(event.key==='Enter')buscar()"><button class="btn pri" onclick="buscar()">Buscar</button></div><div id="res"></div><div class="card"><h3>${n} caso${n === 1 ? '' : 's'} en investigación</h3><p class="mu">${isAll() ? 'Ves los casos de todas las áreas.' : E(me.role) + ': ' + DS[me.role]}</p><div class="row"><button class="btn" onclick="go('casos')">Ver casos</button></div></div>`;
}
async function buscar() {
  const q = val('q'), r = $('#res');
  if (q.length < 2) { r.innerHTML = '<p class="err">Escribe al menos 2 caracteres.</p>'; return; }
  const l = await api('/api/blacklist?q=' + encodeURIComponent(q)) || [];
  r.innerHTML = l.length ? l.map(x => blCard(x, true)).join('') : '<div class="card clean">Sin coincidencias en las listas negras.</div>';
}
function blCard(x, s) {
  return `<div class="card hit"><span class="stamp">Lista negra · ${x.tipo === 'staff' ? 'Staff' : 'Miembros'}</span><div class="kv"><small>Discord / ID / Roblox</small>${E(x.discord || '—')} · ${E(x.did || '—')} · ${E(x.roblox || '—')}</div>${x.razon ? `<div class="kv"><small>Razón</small>${E(x.razon)}</div>` : ''}<small>Agregado por ${E(x.by)} el ${fd(x.ts)}</small>${x.can && !s ? `<div class="row"><button class="btn dan" onclick="retirar('${x._id}')">Retirar</button></div>` : ''}</div>`;
}
function vLista() {
  const ts = ['staff', 'miembro'].filter(canSee);
  if (!ts.length) return '<h2>Lista negra</h2><div class="card"><p>Tu área no administra listas negras. Usa el buscador de Inicio para consultar a alguien.</p></div>';
  const l = bl.filter(x => x.tipo === lt);
  return `<h2>Lista negra</h2><div class="seg">${ts.map(t => `<button class="btn ${lt === t ? 'on' : ''}" onclick="lt='${t}';msg='';w=null;render()">${t === 'staff' ? 'Staff' : 'Miembros'}</button>`).join('')}</div>` + (w && w.bl ? `<div class="card"><h3>Agregar a la lista negra de ${lt === 'staff' ? 'Staff' : 'miembros'}</h3><label>Usuario de Discord<input id="b1"></label><label>ID de Discord<input id="b2" inputmode="numeric"></label><label>Usuario de Roblox<input id="b3"></label><label>Razón (obligatoria)<textarea id="b4" rows="3"></textarea></label>${msg ? `<p class="err">${msg}</p>` : ''}<div class="row"><button class="btn dan" onclick="addBl()">Agregar</button><button class="btn" onclick="w=null;msg='';render()">Cancelar</button></div></div>` : (canMng(lt) ? '<div class="row" style="margin:0 0 12px"><button class="btn pri" onclick="w={bl:1};render()">Agregar persona</button></div>' : '')) + (l.length ? l.map(x => blCard(x)).join('') : '<div class="card"><p class="mu">No hay nadie en esta lista.</p></div>');
}
async function addBl() {
  const r = await api('/api/blacklist', { action: 'add', tipo: lt, discord: val('b1'), did: val('b2'), roblox: val('b3'), razon: val('b4') });
  if (r && r.ok) return go('lista');
  msg = (r && r.e) || 'No se pudo agregar.'; render();
}
async function retirar(id) {
  const razon = prompt('Razón para retirar de la lista negra');
  if (!razon || razon.trim().length < 5) return;
  await api('/api/blacklist', { action: 'remove', id, razon });
  go('lista');
}
function vCasos() {
  if (out) return vOut();
  if (w) return vWiz();
  if (det) return vDet(cases.find(c => c.id === det));
  return `<h2>Casos</h2><p class="mu" style="margin:-6px 0 12px">${isAll() ? 'Ves los casos de todas las áreas.' : E(me.role) + ': ' + DS[me.role]}</p><div class="row" style="margin:0 0 14px"><button class="btn pri" onclick="nw('Seguimiento')">Seguimiento</button><button class="btn pri" onclick="nw('Expediente')">Expediente</button><button class="btn pri" onclick="nw('Sanción')">Sanción</button></div>` + (cases.length ? cases.map(c => `<div class="card"><h3>${c.id} <span class="tag">${c.est}</span></h3><p class="mu">${c.tipo} · ${E(c.dep)} · ${c.area}</p><p class="mu">Abierto por ${E(c.by)} el ${fd(c.fa)}</p><div class="row">${c.cl ? `<span class="stamp">${c.cl}</span>` : ''}<button class="btn" onclick="det='${c.id}';note='';msg='';render()">Ver caso</button></div></div>`).join('') : '<div class="card"><p class="mu">Aún no hay casos. Abre el primero con uno de los botones.</p></div>');
}
const gal = l => l && l.length ? `<div class="gal">${l.map(u => `<a href="${E(u)}" target="_blank" rel="noopener"><img loading="lazy" src="${E(u)}" alt="Prueba" onerror="this.remove()">Ver prueba</a>`).join('')}</div>` : '';
function vDet(c) {
  const F = [['Departamento o sector', 'dep'], ['Investigado', 'inv'], ['Sanción', 'san'], ['Comportamientos', 'comp'], ['Antecedentes', 'ant'], ['Motivo', 'mot'], ['Hipótesis', 'hip'], ['Fuente', 'fue'], ['Patrones', 'pat'], ['Riesgos', 'rie'], ['Recomendaciones', 'rec'], ['Resultado', 'res'], ['Foto', 'foto']];
  const o = c.est === 'En investigación' && c.tipo !== 'Sanción';
  return (note ? `<div class="note">${note}</div>` : '') + `<div class="card"><h3>${c.id} <span class="tag">${c.est}</span></h3><p class="mu">${c.tipo} · ${c.area}</p>${c.cl ? `<p style="margin-top:8px"><span class="stamp">${c.cl}</span></p>` : ''}${F.filter(x => c[x[1]]).map(x => `<div class="kv"><small>${x[0]}</small>${E(c[x[1]])}</div>`).join('')}<div class="kv"><small>Pruebas</small>${gal(c.pru) || '<span class="mu">Sin pruebas adjuntas.</span>'}<div class="row"><input id="np" placeholder="Pega un link de imagen" style="flex:1"><button class="btn" onclick="addProof()">Agregar prueba</button></div></div><div class="kv"><small>Línea de tiempo</small><div class="tl">${(c.ev || []).map(e => `<div><small>${ft(e.h)}</small><p>${E(e.t)}</p></div>`).join('')}</div></div>` + (o ? `<div class="kv"><label>Resultado narrativo<textarea id="rs" rows="2"></textarea></label>${msg ? `<p class="err">${msg}</p>` : ''}<div class="row" style="margin-top:0"><button class="btn" onclick="setEst('Cerrado')">Cerrar caso</button><button class="btn" onclick="setEst('Concluido')">Concluir caso</button></div></div>` : '') + `<div class="row"><button class="btn pri" onclick="out=det;render()">Texto para Discord</button><button class="btn" onclick="det=null;note='';render()">Volver a casos</button></div></div>`;
}
async function reloadCases(n) { cases = await api('/api/cases') || []; note = n || ''; msg = ''; render(); }
async function addProof() {
  const pru = val('np');
  if (!/^https?:\/\//.test(pru)) { msg = ''; note = 'Pega un link que empiece con https://'; return render(); }
  await api('/api/cases', { action: 'proof', id: det, pru });
  reloadCases('Prueba agregada. Recuerda también adjuntarla en el canal de Discord.');
}
async function setEst(est) {
  const res = val('rs');
  if (!res) { msg = 'Escribe el resultado para cerrar o concluir.'; return render(); }
  await api('/api/cases', { action: 'status', id: det, est, res });
  reloadCases('Cambio registrado. Anótalo también a mano en el canal de ' + cases.find(c => c.id === det).area + '.');
}
function nw(t) { w = { t, s: 0, d: {}, e: '' }; render(); }
const sp = () => w.t === 'Sanción' ? SA : ST;
function fl() { const f = sp()[w.s][1].slice(); if (w.s === 0 && isAll()) f.unshift(['area', 'Área responsable', 's', AREAS]); return f; }
function vWiz() {
  const P = sp(), f = fl();
  return `<div class="card"><small>${w.t} · paso ${w.s + 1} de ${P.length}</small><h2>${P[w.s][0]}</h2>${f.map(x => { const v = w.d[x[0]] || '', id = 'w_' + x[0]; return `<label>${x[1]}${x[2] === 'i' ? `<input id="${id}" value="${E(v)}">` : x[2] === 't' ? `<textarea id="${id}" rows="3">${E(v)}</textarea>` : `<select id="${id}">${opts(x[3], v)}</select>`}</label>`; }).join('')}${w.e ? `<p class="err">${w.e}</p>` : ''}<div class="row">${w.s > 0 ? '<button class="btn" onclick="nx(-1)">Atrás</button>' : ''}<button class="btn" onclick="w=null;render()">Cancelar</button><button class="btn pri" onclick="nx(1)">${w.s === P.length - 1 ? 'Registrar caso' : 'Siguiente'}</button></div></div>`;
}
async function nx(d) {
  const f = fl(), P = sp(); f.forEach(x => w.d[x[0]] = val('w_' + x[0])); w.e = '';
  if (d < 0) { w.s--; return render(); }
  if (f.some(x => ['dep', 'inv', 'ant', 'mot'].includes(x[0]) && !w.d[x[0]])) { w.e = 'Completa los campos obligatorios.'; return render(); }
  if (w.s < P.length - 1) { w.s++; return render(); }
  const r = await api('/api/cases', { action: 'create', tipo: w.t, ...w.d });
  if (!r || !r.id) { w.e = 'No se pudo registrar el caso. Intenta de nuevo.'; return render(); }
  det = r.id; w = null;
  reloadCases('Caso registrado. Recuérdalo también a mano en el canal de su área.');
}
function fmt(c) {
  const v = x => x || '—', E1 = '<:861752staff:1528695621916164177>', F = '-# <:Mod:1449549450254094447> | Asuntos Internos y Administrativos de Venezuela Community.', pr = (c.pru || []).join('\n') || '—';
  if (c.tipo === 'Sanción') return `# Sanciones aplicables:\n\n**Departamento:** ${v(c.dep)}\n**Sancionado:** ${v(c.inv)}\n\n* **${c.san}**\n\n**Motivo:** ${v(c.mot)}\n**Pruebas:**\n${pr}\n**Registrado por:** ${c.by}\n\n${F}`;
  return `# <:926683website:1528695864497930280> | VE:RP - ${c.tipo.toUpperCase()}\n-# Asuntos Internos y Administrativos de Venezuela Community.\n\n**Departamento:** ${v(c.dep)}\n**N° de expediente:** ${c.id}\n**Clasificación:** ${v(c.cl)}\n**Fecha de apertura:** ${fd(c.fa)}\n\n———\n# Datos del investigado\n-# <:808239search:1528695760231596133> | Datos personales encontrados\n\n**Usuario completo / Roblox y Discord:** ${v(c.inv)}\n**Comportamientos / Actitudes:** ${v(c.comp)}\n**Fotografía (opcional):** ${v(c.foto)}\n\n———\n# Motivo de investigación\n-# ${E1} | Inicio de la apertura del expediente\n\n**Antecedentes narrativos:** ${v(c.ant)}\n**Hipótesis inicial:** ${v(c.hip)}\n**Fuente de denuncia / inicio:** ${v(c.fue)}\n\n———\n# Análisis narrativo\n-# ${E1} | Patrones y coincidencias detectadas en el sujeto\n\n**Patrones detectados:** ${v(c.pat)}\n**Riesgos potenciales:** ${v(c.rie)}\n**Recomendaciones:** ${v(c.rec)}\n\n———\n# Cierre del expediente\n-# <:977720question:1528695812115136572> | Conclusión y resultados\n\n**Fecha de cierre:** ${c.fc ? fd(c.fc) : '—'}\n**Resultado narrativo:** ${c.res || 'Caso ' + c.est.toLowerCase()}\n**Firma del agente responsable:** ${c.by}\n\n**Pruebas:**\n${pr}\n\n${F}`;
}
function vOut() {
  const c = cases.find(x => x.id === out);
  return `<div class="card"><h3>${c.id} <span class="tag">${c.est}</span></h3><div class="note" style="margin:10px 0">Registra este caso también a mano en el canal de ${c.area} antes de enviarlo.${c.pru && c.pru.length ? ' Los links de las pruebas ya van dentro del texto.' : ''}</div><pre id="ot">${E(fmt(c))}</pre><p class="okm" id="cm"></p><div class="row"><button class="btn pri" onclick="copiar()">Copiar para Discord</button><button class="btn" onclick="out=null;render()">Volver al caso</button></div></div>`;
}
async function copiar() {
  const c = cases.find(x => x.id === out);
  try { await navigator.clipboard.writeText(fmt(c)); $('#cm').textContent = 'Copiado'; } catch (e) { $('#cm').textContent = 'Mantén presionado el texto para copiarlo'; }
  api('/api/cases', { action: 'copied', id: c.id });
}
function vChat() {
  const chs = ['General'].concat(isAll() ? AREAS : [me.role]);
  return `<h2>Chat interno</h2><select onchange="ch=this.value;loadChat()">${chs.map(c => `<option${c === ch ? ' selected' : ''}>${c}</option>`).join('')}</select><div id="msgs" class="msgs"></div><div class="send"><input id="mt" placeholder="Escribe un mensaje" onkeydown="if(event.key==='Enter')sendMsg()"><button class="btn pri" onclick="sendMsg()">Enviar</button></div>`;
}
async function loadChat() {
  const l = await api('/api/chat?canal=' + encodeURIComponent(ch)), m = $('#msgs');
  if (!m || !Array.isArray(l)) return;
  m.innerHTML = l.length ? l.map(x => `<div class="msg${x.u === me._id ? ' me' : ''}"><small>${E(x.nick)} · ${E(x.badge || '')} · ${ft(x.ts)}</small><p>${E(x.t)}</p></div>`).join('') : '<p class="mu">Sin mensajes todavía. Escribe el primero.</p>';
  m.scrollTop = m.scrollHeight;
}
async function sendMsg() {
  const i = $('#mt'), t = i.value.trim();
  if (!t) return;
  i.value = '';
  await api('/api/chat?canal=' + encodeURIComponent(ch), { text: t });
  loadChat();
}
function vAdmin() {
  const s = `<div class="seg"><button class="btn ${sub === 'miembros' ? 'on' : ''}" onclick="go('admin','miembros')">Miembros</button><button class="btn ${sub === 'auditoria' ? 'on' : ''}" onclick="go('admin','auditoria')">Auditoría</button></div>`;
  if (sub === 'auditoria') return s + '<h2>Registro de auditoría</h2>' + (aud.length ? aud.map(x => `<div class="card"><small>${ft(x.ts)}</small><p>${E(x.t)}</p></div>`).join('') : '<div class="card"><p class="mu">Aún no hay movimientos.</p></div>');
  const p = members.filter(x => x.status === 'pendiente'), a = members.filter(x => x.status === 'activo');
  return s + (p.length ? '<h2>Solicitudes pendientes</h2>' + p.map(x => `<div class="card"><h3>${E(x.user)} <span class="tag">${E(x.badge)}</span></h3><p class="mu">Pide: ${E(x.cargo)}</p><label style="margin-top:8px">Asignar rol<select id="pr${x._id}">${opts(ROLES, x.cargo)}</select></label><div class="row" style="margin-top:0"><button class="btn pri" onclick="acc('${x._id}')">Aceptar</button><button class="btn" onclick="rej('${x._id}')">Rechazar</button></div></div>`).join('') : '') + '<h2>Miembros</h2>' + a.map(x => ed === x._id
    ? `<div class="card"><h3>${E(x.user)}</h3><label>Nickname<input id="en" value="${E(x.nick)}"></label><label>Placa<input id="eb" value="${E(x.badge)}"></label>${x._id === me._id ? '' : `<label>Rol<select id="er">${opts(ROLES, x.role)}</select></label>`}<div class="row"><button class="btn pri" onclick="sv('${x._id}')">Guardar</button><button class="btn" onclick="ed=null;render()">Cancelar</button></div></div>`
    : `<div class="card"><h3>${E(x.nick)} <span class="tag">${E(x.badge)}</span></h3><p class="mu">@${E(x.user)} · ${E(x.role)}${x.role !== x.cargo ? ' · cargo ' + E(x.cargo) : ''}</p><div class="row"><button class="btn" onclick="ed='${x._id}';render()">Editar</button></div></div>`).join('');
}
const act = async b => { await api('/api/members', b); go('admin', 'miembros'); };
const acc = id => act({ action: 'accept', id, role: val('pr' + id) }), rej = id => act({ action: 'reject', id });
const sv = id => act({ action: 'edit', id, nick: val('en'), badge: val('eb'), role: $('#er') ? val('er') : undefined });
boot();
