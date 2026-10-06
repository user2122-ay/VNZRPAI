# Panel del Staff · VE:RP

Web interna de Asuntos Internos, Disciplinarios y Sociales. Hosting en Vercel, datos en MongoDB Atlas, login con Discord.

## Estructura

```
api/        funciones serverless (auth, members, cases, blacklist, chat, audit)
lib/        conexión a Mongo y sesión
public/     la página (index.html, css/, js/)
vercel.json package.json .env.example
```

## Puesta en marcha

1. Sube esta carpeta a un repositorio de GitHub.
2. MongoDB Atlas → Network Access: permite `0.0.0.0/0`. Copia la cadena de conexión.
3. Vercel → Add New Project → importa el repo (Framework preset: Other).
4. Settings → Environment Variables: crea las de `.env.example` (`MONGODB_URI`, `DB_NAME`, `SESSION_SECRET`, `ADMIN_USER`, `ADMIN_BADGE`).
5. Redeploy. Entra con `ADMIN_USER` + `ADMIN_BADGE`: queda como Administrador.

No hay bot ni login de Discord: se entra con usuario de Discord + placa. Quien no tiene cuenta pulsa "Solicitar acceso"; el admin lo acepta en Admin → Miembros y desde ahí entra con usuario + placa.

## Base de datos (se crea sola en Mongo)

`members` (_id = usuario de Discord en minúsculas, nick, badge, cargo, role, status), `cases`, `blacklist`, `chat`, `audit`, `attempts` (bloqueo tras 5 intentos fallidos).
