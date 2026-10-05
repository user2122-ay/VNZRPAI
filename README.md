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
2. Discord Developer Portal → New Application → OAuth2: copia `Client ID` y `Client Secret`, y agrega el redirect `https://TU-PROYECTO.vercel.app/auth/callback`.
3. MongoDB Atlas → Network Access: permite `0.0.0.0/0`.
4. Vercel → Add New Project → importa el repo (Framework preset: Other).
5. En Settings → Environment Variables crea las variables de `.env.example`. `APP_URL` es la URL de Vercel sin barra final.
6. Redeploy. Entra con tu Discord: `ADMIN_USER` queda como Administrador con placa AI-01.
