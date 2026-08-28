# Guía completa: crear, desplegar y respaldar una instancia nueva de HESAKA

Esta guía junta en un solo lugar todo lo necesario para dar de alta un
cliente nuevo: ficha de datos, repositorio, Railway (backend + base de
datos + volumen para el logo), Vercel (frontend), variables de entorno,
checklist final y backups. Reemplaza tener que ir y venir entre varios
documentos.

Se usa `Koeti` como ejemplo real a lo largo de toda la guía.

## Objetivo

Crear una versión nueva de HESAKA para un cliente, con:

- código independiente
- base de datos independiente
- proyecto frontend independiente
- backend independiente
- despliegue independiente

## Regla general

Para cada cliente nuevo:

- un repositorio propio
- un proyecto propio en Railway
- un proyecto propio en Vercel
- una base de datos propia
- variables de entorno propias

No se deben reutilizar bases de datos de otros clientes, ni copiar archivos
`.env` entre clientes, ni reutilizar una base de otro cliente "limpiándola".

---

## 1. Definir los datos base del cliente

Antes de crear nada, completar esta ficha:

| Dato | Valor (ejemplo Koeti) |
|---|---|
| Nombre comercial | `Koeti` |
| Correo administrativo | `hesaka.koeti@gmail.com` |
| Nombre corto / slug | `koeti` |
| Repositorio | `hesaka-koeti` |
| Proyecto Railway | `hesaka-koeti` |
| Proyecto Vercel | `hesaka-koeti` |
| Base de datos tenant | `hesaka_koeti` |

El **slug** es el nombre corto, técnico y estable de la instancia: sin
espacios ni acentos. Se usa para identificar al cliente en configuraciones,
construir nombres de base de datos y definir variables de entorno.

Nombrar todo (repo, proyecto Railway, proyecto Vercel, base tenant) con el
mismo patrón `hesaka-<slug>` / `hesaka_<slug>` evita confusiones.

---

## 2. Crear el repositorio del cliente

Usar como base el repositorio plantilla de HESAKA. Nombre sugerido:
`hesaka-<slug>` (ej. `hesaka-koeti`).

**Debe quedar incluido:**

- código backend
- código frontend
- `.gitignore`
- `backend/.env.example`
- `frontend/.env.example`
- documentación de despliegue

**Debe quedar excluido:**

- `backend/.env`, `frontend/.env`
- `backend/backups/`
- `backend/media/`
- `backend/venv/`
- dumps `.dump`
- logs temporales, archivos de prueba locales
- datos de otro cliente

---

## 3. Crear el proyecto del cliente en Railway

1. Crear un proyecto nuevo
2. Nombrarlo `hesaka-<slug>` (ej. `hesaka-koeti`)
3. Agregar una base PostgreSQL nueva
4. Agregar el servicio backend desde el repositorio `hesaka-<slug>`

### Datos que debes copiar y guardar

Del PostgreSQL nuevo:

- `DATABASE_PUBLIC_URL`
- `DATABASE_URL`
- `PGHOST`
- `PGPORT`
- `PGUSER`
- `PGPASSWORD`
- `PGDATABASE`

### Agregar un Volume para el logo y archivos subidos

El filesystem del contenedor de Railway es efímero: se borra en cada
redeploy o reinicio. Si no se configura un Volume, el logo del cliente (y
cualquier otro archivo subido) desaparece la primera vez que se vuelve a
desplegar el servicio — no "después de un tiempo", sino en cada redeploy.

Pasos:

1. En el proyecto del cliente, click derecho sobre el servicio del backend
   (`hesaka-<slug>`) → **Attach Volume**
2. Mount path: `/data/media`
3. En la pestaña **Variables** del mismo servicio, agregar:
   - `MEDIA_ROOT=/data/media`
4. Railway redeploya automáticamente al guardar la variable
5. Volver a subir el logo del cliente después de este paso (si ya se había
   subido antes de crear el Volume, ese archivo se perdió y hay que
   resubirlo)

---

## 4. Configurar el backend del cliente

Archivo base: `backend/.env.example`. Cargar estos valores directamente en
Railway (pestaña Variables), nunca copiando un `.env` de otro cliente.

Variables principales por cliente:

| Variable | Valor sugerido para Koeti |
|---|---|
| `ADMIN_DATABASE_URL` | (la del Postgres del proyecto Koeti) |
| `TENANT_DB_PREFIX` | `hesaka_` |
| `DEFAULT_TENANT_SLUG` | `koeti` |
| `POSTGRES_HOST` / `PORT` / `USER` / `PASSWORD` | (del Postgres del proyecto Koeti) |
| `SECRET_KEY` | clave propia, larga y única para este cliente |
| `CORS_ORIGINS` | dominio del frontend de Koeti |
| `ENVIRONMENT` | `production` |
| `MEDIA_ROOT` | `/data/media` (ver paso 3) |
| `HESAKA_ADMIN_EMAIL` | email del cliente (ej. `hesaka.koeti@gmail.com`) |
| `HESAKA_ADMIN_PASSWORD` | contraseña única para este cliente (ver 4.1) |
| `HESAKA_ADMIN_NAME` | nombre a mostrar (ej. `Administrador Koeti`) |
| `HESAKA_SUPPORT_EMAIL` | tu email de soporte para este cliente (ver 4.1) |
| `HESAKA_SUPPORT_PASSWORD` | contraseña única para este cliente (ver 4.1) |
| `HESAKA_SUPPORT_NAME` | ej. `Soporte HESAKA` |

### Importante

La base administrativa y la base tenant deben apuntar al PostgreSQL del
proyecto del cliente, no a otra óptica. Si la arquitectura sigue usando base
administrativa más tenant derivado, dejar la base administrativa del
proyecto Koeti y el tenant final `hesaka_koeti`.

---

## 4.1 Cuentas de acceso: la del cliente y la de soporte

Cada instancia arranca con **hasta dos cuentas administrador**, cada una
controlada por su propio par de variables de entorno. Ninguna tiene
contraseña por defecto: si el par `EMAIL`/`PASSWORD` no está cargado en
Railway, esa cuenta simplemente no se crea.

| | Cuenta del cliente | Cuenta de soporte |
|---|---|---|
| Variables | `HESAKA_ADMIN_EMAIL` / `HESAKA_ADMIN_PASSWORD` / `HESAKA_ADMIN_NAME` | `HESAKA_SUPPORT_EMAIL` / `HESAKA_SUPPORT_PASSWORD` / `HESAKA_SUPPORT_NAME` |
| Quién la usa | el cliente, día a día | vos, solo para soporte |
| ¿El cliente la puede desactivar o resetear? | — (es la suya) | **no**, queda bloqueada desde el panel aunque el cliente sea ADMIN |
| ¿Vos podés desactivar/resetear la del cliente? | sí, como cualquier admin | — |

**Por qué existen las dos por separado:** antes había una sola cuenta
(`admin@hesaka.com` / `admin123`) hardcodeada e igual en **todos** los
clientes, usada a la vez como login del cliente y como acceso de soporte.
Eso significaba que cualquiera que leyera el código conocía una contraseña
válida para cualquier instalación, y que para recuperar tu propio acceso
tenías que tocar la misma cuenta que usaba el cliente. Ahora son dos cuentas
independientes, con contraseña propia por cliente, y ninguna se resetea sola
en cada arranque o restore — si el cliente cambia su contraseña, o vos
cambiás la tuya, se queda así.

**Al dar de alta un cliente nuevo:**

1. Generar dos contraseñas fuertes y **distintas entre sí y de las de otros
   clientes** (usar un gestor de contraseñas, no reutilizar).
2. Cargar las 6 variables de la tabla de arriba en Railway antes del primer
   arranque del backend.
3. Guardar ambas contraseñas en el gestor de contraseñas, una entrada por
   cliente (ej. `Koeti - admin cliente`, `Koeti - soporte HESAKA`).
4. Verificar que ambos logins funcionan (ver checklist del paso 9).

**Si perdés la contraseña de soporte de un cliente:** como sos vos quien
administra el proyecto de Railway, nunca quedás completamente bloqueado.
Opciones, de más simple a más directa:

- Volver a ver `HESAKA_SUPPORT_PASSWORD` en la pestaña Variables de Railway
  (solo sirve si nunca la cambiaste manualmente después de creada la cuenta).
- Conectarte directo al PostgreSQL del cliente (Railway te da la cadena de
  conexión) y actualizar la contraseña de esa fila en la tabla `usuarios`, o
  borrar la fila para que se vuelva a crear con el valor de la variable en
  el próximo arranque.
- Si el cliente tiene su propio admin activo, esa cuenta **no** puede
  resetear la de soporte (está bloqueada a propósito) — la recuperación
  siempre pasa por vos y tu acceso a Railway/PostgreSQL, nunca por el
  cliente.

---

## 5. Crear la base vacía del cliente

La base del cliente debe empezar limpia:

1. levantar el backend (ya con las 6 variables `HESAKA_ADMIN_*` /
   `HESAKA_SUPPORT_*` del paso 4.1 cargadas)
2. el bootstrap crea las tablas y, automáticamente, las dos cuentas
   administrador (cliente y soporte) — no hace falta crearlas a mano
3. verificar login con ambas cuentas

**No hacer:** no restaurar una base de otra óptica, no copiar datos de
pacientes/clientes reales de otra instancia.

---

## 6. Crear el proyecto del cliente en Vercel

1. Crear proyecto nuevo
2. Importar el repositorio `hesaka-<slug>`
3. Nombrarlo `hesaka-<slug>` (ej. `hesaka-koeti`)
4. Configurar variables de entorno del frontend

Archivo base: `frontend/.env.example`.

| Variable | Valor sugerido para Koeti |
|---|---|
| `VITE_API_BASE_URL` | URL del backend en Railway |
| `VITE_TENANT_SLUG` | `koeti` |

---

## 7. Conectar frontend y backend

Comprobar:

- login correcto
- datos generales cargan
- creación de cliente funciona
- creación de consulta funciona
- ventas/presupuestos responden

---

## 8. Backups (fuera de Railway)

No conviene depender solo del botón de backup dentro de HESAKA ni del panel
de Railway. El script del repo saca un dump directo del PostgreSQL, lo
guarda en `backups/railway/<tenant>/`, lo valida con `pg_restore -l` y
conserva por defecto los últimos 14 backups.

**Qué no resuelve:** no protege archivos adjuntos fuera de PostgreSQL (por
eso el Volume del paso 3 es aparte), no reemplaza una réplica ni una
estrategia de alta disponibilidad.

### Preparación

1. Instalar cliente de PostgreSQL en la PC que hará el backup
2. Copiar `.env.railway-backup.example` como `.env.railway-backup`
3. Cargar ahí las credenciales del PostgreSQL de Railway (`DATABASE_URL`,
   `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`)

### Ejecución manual

Desde la raíz del repo:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup_railway.ps1
```

Opciones útiles:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup_railway.ps1 -TenantSlug koeti
powershell -ExecutionPolicy Bypass -File .\scripts\backup_railway.ps1 -Retention 30
powershell -ExecutionPolicy Bypass -File .\scripts\backup_railway.ps1 -OutputDir "D:\Backups\Hesaka\koeti"
```

### Programarlo en Windows

Ejemplo diario a las 06:00 usando Task Scheduler:

```powershell
schtasks /Create /SC DAILY /TN "HESAKA Railway Backup" /TR "powershell -ExecutionPolicy Bypass -File \"C:\HESAKA - copia\Hesaka_Web\scripts\backup_railway.ps1\"" /ST 06:00
```

### Recomendación operativa

- guardar la carpeta de backups en OneDrive, Google Drive o un disco externo sincronizado
- hacer al menos un backup diario
- probar una restauración en una base de prueba una vez por semana
- respaldar también `backend/media/` (o el Volume de Railway) si se usan adjuntos en disco

Antes de mostrar la demo o iniciar carga real: crear un backup de la base
online, guardar el dump fuera del servidor y guardar también una copia
local segura.

---

## 9. Lista de control final

Antes de mostrar al cliente:

- el nombre del cliente aparece correcto
- el tenant correcto es el slug definido (ej. `koeti`)
- la base está vacía o con demo controlada
- no existen datos de otra óptica
- login del cliente funciona (`HESAKA_ADMIN_EMAIL`)
- login de soporte funciona (`HESAKA_SUPPORT_EMAIL`)
- ambas contraseñas guardadas en el gestor de contraseñas, y son distintas
  de las de otros clientes
- frontend y backend están conectados
- Volume de Railway conectado y `MEDIA_ROOT` configurado (el logo sobrevive un redeploy)
- backup inicial realizado

### También revisar manualmente

- nombres visibles del negocio
- logos o assets del cliente
- tenant por defecto
- URLs del backend/frontend
- cuentas administrador y soporte (ver 4.1)

---

## 10. Qué hacer después

Si la demo gusta:

- mantener la misma instancia y pasar a productivo, **o**
- crear una nueva instancia productiva con el mismo procedimiento

---

## Caso de referencia: Koeti

- Óptica: `Koeti`
- Correo administrativo: `hesaka.koeti@gmail.com`
- Slug: `koeti`
- Repositorio: `hesaka-koeti`
- Proyecto Railway: `hesaka-koeti`
- Proyecto Vercel: `hesaka-koeti`
- Base de datos: `hesaka_koeti`

Secuencia de trabajo:

1. Crear el repositorio `hesaka-koeti`
2. Crear el proyecto `hesaka-koeti` en Railway (+ Postgres + Volume `/data/media`)
3. Crear el proyecto `hesaka-koeti` en Vercel
4. Cargar variables de entorno (backend, frontend, y `HESAKA_ADMIN_*` / `HESAKA_SUPPORT_*` del paso 4.1)
5. Levantar base vacía (las cuentas admin y soporte se crean solas)
6. Guardar ambas contraseñas en el gestor de contraseñas
7. Probar login con ambas cuentas y módulos base
8. Backup inicial

---

## Documentos originales (mantenidos por separado, con el mismo contenido)

- `PASO_A_PASO_INSTANCIA_CLIENTE.md`
- `VARIABLES_POR_CLIENTE.md`
- `LISTA_DE_VERIFICACION_PLANTILLA.md`
- `KOETI_PREPARACION.md`
- `BACKUPS_RAILWAY.md`
