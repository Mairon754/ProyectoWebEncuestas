# Proyecto Web (WAMP + MySQL) — PWA Offline-first

## Instalación rápida
1) Copia la carpeta `proyecto_web` dentro de:
`C:\wamp64\www\proyecto_web\`

2) En phpMyAdmin importa en este orden:
- `db/schema.sql`
- `db/seed.sql`

3) Abre:
- Participante: `http://localhost/proyecto_web/public/index.html`
- Admin: `http://localhost/proyecto_web/public/admin.html`

## Usuario admin (seed)
- admin@proyecto.com
- Admin123*

## Qué incluye
- PWA instalable (manifest + service worker)
- Offline-first (IndexedDB cola de respuestas)
- Sync automático por lotes a MySQL
- Roles: Admin y Participante
- Exportación CSV del dataset

## Nota
Si tu MySQL no usa root sin contraseña, ajusta:
`backend/config/config.php`
