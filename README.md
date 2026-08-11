# ManoAmiga · API

API REST de [ManoAmiga](https://github.com/sebastian-barrera-herrera/mano-amiga-front), la
plataforma ciudadana de ayuda ante el terremoto en Colombia: personas y mascotas desaparecidas
o encontradas, y muro de información comunitaria.

**NestJS 11 + PostgreSQL (Neon).** Frontend en un repositorio aparte:
[`mano-amiga-front`](https://github.com/sebastian-barrera-herrera/mano-amiga-front).

---

## Decisiones de diseño

| Decisión | Motivo |
| --- | --- |
| **Una sola tabla `reports`** con `kind` (person/pet) y `status` (missing/found) | Los cuatro formularios comparten el 80 % de los campos. Con una tabla, el listado, el buscador y los filtros son una única consulta en lugar de cuatro con `UNION`. |
| **SQL directo con `pg`**, sin ORM | Mantiene `node_modules` pequeño y el arranque rápido en el plan gratuito de Render. Todo el SQL vive en `*.repository.ts` con consultas parametrizadas. |
| **Las fotos no pasan por el servidor** | El backend sólo firma la subida; el navegador envía el archivo directo a Cloudinary. Ahorra el ancho de banda del plan gratuito. |
| **Publicar no requiere cuenta** | En una emergencia, obligar a registrarse cuesta reportes. La sesión sólo sirve para administrar lo propio. |

La API **degrada con elegancia**: sin credenciales de Cloudinary la subida de fotos se
deshabilita sola, y sin `GOOGLE_CLIENT_ID` el acceso con Google se desactiva. En ambos casos
el resto sigue funcionando.

---

## Puesta en marcha

Requisitos: **Node 20 o superior** y una base PostgreSQL (Neon sirve, es gratis).

```bash
npm install
cp .env.example .env
```

Rellena al menos `DATABASE_URL` y `JWT_SECRET`. Para generar el secreto:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Crea las tablas y arranca:

```bash
npm run db:migrate
npm run dev
```

La API queda en http://localhost:3000/api

### Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor con recarga automática |
| `npm run build` | Compila a `dist/` |
| `npm start` | Ejecuta lo compilado (lo que usa Render) |
| `npm run db:migrate` | Aplica las migraciones pendientes |
| `npm run db:seed` | Carga datos de ejemplo (bloqueado si `NODE_ENV=production`) |
| `npm run typecheck` | Comprueba los tipos |

### PostgreSQL local en lugar de Neon (opcional)

```bash
docker compose up -d
```

Y en `.env`: `DATABASE_URL=postgresql://manoamiga:manoamiga@localhost:5432/manoamiga`

---

## Estructura

```
src/
├── main.ts                  # CORS, Helmet, pipes y filtros globales
├── app.module.ts
├── config/                  # configuración, validación del entorno y CORS
├── common/
│   ├── database/            # pool de PostgreSQL con reintento
│   ├── decorators/          # @Trim, @TrimToUndefined, @TrimToNull
│   ├── dto/                 # paginación reutilizable
│   ├── filters/             # errores con formato uniforme
│   ├── interfaces/          # respuesta paginada
│   └── middleware/          # log de peticiones
└── modules/
    ├── auth/                # registro, login, Google, guards, decorador
    ├── reports/             # controller · service · repository · dto · entity
    ├── community/           # muro comunitario
    ├── uploads/             # firma de Cloudinary
    └── health/              # health check para Render
```

Cómo se traduce la organización clásica de una API a NestJS:

| Concepto | Dónde está |
| --- | --- |
| Controllers y routes | `*.controller.ts` (los decoradores `@Get`/`@Post` **son** las rutas) |
| Services | `*.service.ts` (reglas de negocio) |
| Models | `entities/*.entity.ts` (tipos + traducción fila ↔ API) y `db/migrations` |
| Validaciones | `dto/*.dto.ts` con class-validator, aplicadas por un `ValidationPipe` global |
| Middlewares | `common/middleware/`, `common/filters/` y los guards de `auth/guards/` |
| Acceso a datos | `*.repository.ts` (todo el SQL está aquí, nunca en los services) |

---

## Variables de entorno

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `DATABASE_URL` | **Sí** | Cadena de PostgreSQL. Con Neon usa la *pooled connection* y `?sslmode=verify-full`. |
| `JWT_SECRET` | **Sí** | Secreto para firmar los tokens. En producción, 32 caracteres o más. |
| `PORT` | No | Puerto (3000 por defecto; Render lo inyecta). |
| `NODE_ENV` | No | `development` o `production`. |
| `CORS_ORIGINS` | No | Orígenes permitidos separados por coma. Admite `*` dentro del dominio (`https://*--misitio.netlify.app`) para las URL de previsualización. Vacío o `*` permite todos (sólo desarrollo). |
| `JWT_EXPIRES_IN` | No | Duración de la sesión (`30d` por defecto). |
| `GOOGLE_CLIENT_ID` | No | Client ID de OAuth. Vacío deshabilita el acceso con Google. |
| `ADMIN_EMAILS` | No | Correos que reciben rol de administrador al registrarse. |
| `CLOUDINARY_CLOUD_NAME` | No | Cuenta de Cloudinary. |
| `CLOUDINARY_API_KEY` | No | API key. |
| `CLOUDINARY_API_SECRET` | No | API secret. **Nunca** se expone al navegador. |
| `CLOUDINARY_FOLDER` | No | Carpeta de las fotos (`manoamiga` por defecto). |
| `DATABASE_POOL_MAX` | No | Conexiones máximas (5 por defecto, adecuado para Neon gratuito). |
| `DATABASE_SSL_NO_VERIFY` | No | `true` sólo si el servidor tiene certificado autofirmado. |

> **Sobre `sslmode`:** Neon sugiere `sslmode=require`, pero `pg` avisa de que en su versión 9
> ese modo pasará a tener garantías más débiles. Usa `sslmode=verify-full`: hoy se comporta
> igual, evita el aviso y queda fijado para el futuro.

---

## Base de datos

Tres tablas. Esquema completo en [`db/migrations/001_init.sql`](db/migrations/001_init.sql).

### `reports`

| Grupo | Columnas |
| --- | --- |
| Clasificación | `kind` (`person`\|`pet`), `status` (`missing`\|`found`) |
| Datos comunes | `name`, `description`, `photo_url`, `photo_public_id` |
| Ubicación | `city`, `neighborhood`, `location_detail`, `event_at` |
| Sólo personas | `approx_age`, `clothing`, `health_status` |
| Sólo mascotas | `species`, `color` |
| Contacto | `contact_name`, `contact_email`, `contact_phone` |
| Ciclo de vida | `user_id`, `resolved_at`, `is_hidden`, `created_at`, `updated_at` |

- `location_detail` guarda la *última ubicación conocida* en las desapariciones y el *lugar del
  hallazgo* en los hallazgos; la interfaz cambia la etiqueta según el caso.
- `resolved_at` cierra el caso: los reportes cerrados salen del listado por defecto sin
  borrarse.
- `is_hidden` oculta contenido inapropiado sin perder el registro.
- Un `CHECK` obliga a que exista **correo o teléfono**.
- Índices: `created_at`, `(kind, status)`, `user_id` y dos índices *trigram* (`pg_trgm`) sobre
  `name` y `city` para que el buscador con `ILIKE '%texto%'` siga siendo rápido.

### `community_messages`

`city`, `author_name` (opcional), `category`, `content`, `contact`, `user_id`, `is_hidden`,
`created_at`.

Las categorías (`water`, `food`, `shelter`, `medical`, `volunteers`, `transport`, `info`)
permiten filtrar el muro, que es lo que hace falta cuando hay cientos de mensajes.

### `users`

`email`, `name`, `password_hash` (bcrypt), `google_sub`, `role` (`user`\|`admin`).

Una cuenta creada con correo se vincula automáticamente a Google si después se entra con el
mismo correo verificado.

Las migraciones se registran en `schema_migrations`, así que ejecutarlas varias veces es
seguro. Para un cambio nuevo, crea `db/migrations/002_lo_que_sea.sql`.

---

## Endpoints

Todo cuelga de `/api`. Los errores siempre tienen esta forma:

```json
{
  "statusCode": 400,
  "message": "La ciudad es obligatoria",
  "errors": ["La ciudad es obligatoria"],
  "path": "/api/reports",
  "timestamp": "2026-08-11T17:48:20.570Z"
}
```

### Reportes

| Método | Ruta | Sesión | Descripción |
| --- | --- | --- | --- |
| `GET` | `/api/reports` | Opcional | Listado paginado con buscador y filtros |
| `GET` | `/api/reports/stats` | No | Contadores para la portada |
| `GET` | `/api/reports/mine` | **Sí** | Mis publicaciones |
| `GET` | `/api/reports/:id` | Opcional | Detalle |
| `POST` | `/api/reports` | Opcional | Crear (10 por minuto y IP) |
| `PATCH` | `/api/reports/:id` | **Sí** | Editar, cerrar o reabrir (autor o admin) |
| `DELETE` | `/api/reports/:id` | **Sí** | Eliminar (autor o admin) |

Parámetros de `GET /api/reports`:

| Parámetro | Valores | Por defecto |
| --- | --- | --- |
| `page` | ≥ 1 | `1` |
| `limit` | 1–50 | `12` |
| `q` | Texto libre: nombre, ciudad, barrio, descripción y especie | — |
| `kind` | `person` \| `pet` | todos |
| `status` | `missing` \| `found` | todos |
| `city` | Coincidencia parcial, sin distinguir mayúsculas | todas |
| `resolution` | `open` \| `resolved` \| `all` | `open` |

Respuesta: `{ items, total, page, limit, totalPages }`.

```bash
curl "http://localhost:3000/api/reports?q=nube&kind=pet&page=1&limit=12"
```

Al crear, `kind`, `status`, `city` y `contactName` son obligatorios, hace falta **correo o
teléfono**, y el nombre es obligatorio si es una persona desaparecida.

### Muro comunitario

| Método | Ruta | Sesión | Descripción |
| --- | --- | --- | --- |
| `GET` | `/api/community` | Opcional | Listado paginado (`city`, `category`, `q`) |
| `GET` | `/api/community/cities` | No | Ciudades con más actividad |
| `POST` | `/api/community` | Opcional | Publicar (8 por minuto y IP) |
| `DELETE` | `/api/community/:id` | **Sí** | Eliminar el propio (o admin) |

### Cuenta

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/auth/providers` | Qué métodos de acceso están configurados |
| `POST` | `/api/auth/register` | Registro con correo (contraseña de 8+ caracteres) |
| `POST` | `/api/auth/login` | Inicio de sesión |
| `POST` | `/api/auth/google` | Inicio de sesión con el ID token de Google |
| `GET` | `/api/auth/me` | Perfil actual |

Devuelven `{ token, user }`. El token viaja en `Authorization: Bearer <token>`.

### Fotos y estado

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/uploads/status` | Si la subida de fotos está disponible |
| `GET` | `/api/uploads/signature` | Firma para subir a Cloudinary (20 por minuto y IP) |
| `GET` | `/api/health` | Estado del servicio y de la base de datos |

Flujo de una foto: el navegador comprime la imagen → pide la firma → sube el archivo directo a
Cloudinary → envía `photoUrl` y `photoPublicId` al crear el reporte. Al eliminar o reemplazar
un reporte, el backend borra la imagen en Cloudinary.

---

## Despliegue en Render

Con [`render.yaml`](render.yaml): en Render elige **New → Blueprint**, apunta a este
repositorio y pega la única variable que pide, `DATABASE_URL`. El resto ya viene resuelto en el
archivo y `JWT_SECRET` lo genera Render.

A mano, si prefieres **New → Web Service**:

| Campo | Valor |
| --- | --- |
| Runtime | Node |
| Build command | `npm ci --include=dev && npm run build` |
| Start command | `npm run db:migrate && npm run start` |
| Health check path | `/api/health` |

> `--include=dev` no es opcional: con `NODE_ENV=production`, npm omite las
> devDependencies y `nest` —que es lo que compila el proyecto— es una de ellas. Sin ese flag el
> build falla con `nest: not found`.

Y estas variables de entorno:

| Variable | Valor |
| --- | --- |
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `20` |
| `DATABASE_URL` | La cadena *pooled* de Neon, con `?sslmode=verify-full` |
| `CORS_ORIGINS` | La URL del frontend en Netlify, sin barra final |
| `JWT_SECRET` | 48 bytes aleatorios (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
| `JWT_EXPIRES_IN` | `30d` |

Cloudinary y Google son opcionales: añádelas cuando las necesites.

> El plan gratuito duerme el servicio tras 15 minutos sin tráfico: la primera petición puede
> tardar ~50 segundos. El pool reintenta una vez cuando Neon ha cerrado la conexión por
> inactividad, para que ese primer acceso no falle.

---

## Moderación y abuso

La API permite escribir sin cuenta, así que incluye varias barreras:

- **Límite por IP** (`@nestjs/throttler`): 90 peticiones/minuto en general, 10 al crear
  reportes, 8 al publicar en el muro y 5 al registrarse. Render va detrás de un proxy, por eso
  el servidor confía en `X-Forwarded-For`.
- **Validación estricta**: el `ValidationPipe` descarta cualquier campo no declarado en el DTO,
  así que no se pueden inyectar columnas como `is_hidden` o `user_id`.
- **`is_hidden`** oculta un reporte o mensaje sin borrarlo. Los correos de `ADMIN_EMAILS`
  reciben rol de administrador y pueden editar o eliminar cualquier publicación.
- **Helmet** para las cabeceras de seguridad y CORS restringido a los dominios configurados.
- Contraseñas con bcrypt, y el mismo mensaje de error tanto si el correo no existe como si la
  contraseña es incorrecta, para no revelar qué correos están registrados.

---

## Licencia

MIT.
