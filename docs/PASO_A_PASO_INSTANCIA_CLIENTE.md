# Paso a paso para crear una instancia nueva de HESAKA

Esta guía está pensada para crear una instancia independiente por cliente, con nombres claros en español y sin mezclar datos entre ópticas.

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

No se deben reutilizar bases de datos de otros clientes.

---

## 1. Definir los datos base del cliente

Antes de crear nada, completar esta ficha:

- Nombre comercial: `Koeti`
- Correo administrativo: `hesaka.koeti@gmail.com`
- Nombre corto del cliente: `koeti`
- Repositorio: `hesaka-koeti`
- Proyecto Railway: `hesaka-koeti`
- Proyecto Vercel: `hesaka-koeti`
- Base de datos tenant: `hesaka_koeti`

---

## 2. Crear el repositorio del cliente

Usar como base el repositorio plantilla de HESAKA.

Nombre sugerido:

- `hesaka-koeti`

Este repositorio debe contener:

- backend
- frontend
- `.env.example`
- `frontend/.env.example`
- documentación

No debe contener:

- `.env`
- backups
- dumps
- `media/`
- `venv/`
- datos de otro cliente

---

## 3. Crear el proyecto del cliente en Railway

En Railway:

1. Crear un proyecto nuevo
2. Nombrarlo `hesaka-koeti`
3. Agregar una base PostgreSQL nueva
4. Agregar el servicio backend desde el repositorio `hesaka-koeti`

### Datos que debes copiar y guardar

Guardar estos datos del PostgreSQL nuevo:

- `DATABASE_PUBLIC_URL`
- `DATABASE_URL`
- `PGHOST`
- `PGPORT`
- `PGUSER`
- `PGPASSWORD`
- `PGDATABASE`

### Agregar un Volume para el logo y archivos subidos

El filesystem del contenedor de Railway es efimero: se borra en cada redeploy
o reinicio. Si no se configura un Volume, el logo del cliente (y cualquier
otro archivo subido) desaparece la primera vez que se vuelve a desplegar el
servicio.

Pasos:

1. En el proyecto del cliente, click derecho sobre el servicio del backend
   (`hesaka-koeti`) → **Attach Volume**
2. Mount path: `/data/media`
3. En la pestaña **Variables** del mismo servicio, agregar:
   - `MEDIA_ROOT=/data/media`
4. Railway va a redeployar automaticamente al guardar la variable
5. Volver a subir el logo del cliente despues de este paso (si ya se habia
   subido antes de crear el Volume, ese archivo se perdio y hay que
   resubirlo)

Sin este paso, el logo "funciona una o dos veces y despues se rompe" en
realidad se rompe en cada redeploy, no despues de N usos.

---

## 4. Configurar el backend del cliente

Tomar `backend/.env.example` como base.

Valores recomendados para Koeti:

- `DEFAULT_TENANT_SLUG=koeti`
- `TENANT_DB_PREFIX=hesaka_`
- `ENVIRONMENT=production`

### Importante

La base administrativa y la base tenant deben apuntar al PostgreSQL del proyecto del cliente, no a otra óptica.

Si la arquitectura sigue usando base administrativa más tenant derivado, dejar:

- base administrativa del proyecto Koeti
- tenant final `hesaka_koeti`

---

## 5. Crear la base vacía del cliente

La base del cliente debe empezar limpia.

Pasos sugeridos:

1. levantar el backend
2. ejecutar bootstrap o creación de tablas
3. crear usuario administrador inicial
4. verificar login

### No hacer

- no restaurar una base de otra óptica
- no copiar datos de pacientes/clientes reales de otra instancia

---

## 6. Crear el proyecto del cliente en Vercel

En Vercel:

1. crear proyecto nuevo
2. importar el repositorio `hesaka-koeti`
3. nombrarlo `hesaka-koeti`
4. configurar variables de entorno del frontend

Usar `frontend/.env.example` como base.

Valores esperados:

- `VITE_API_BASE_URL`
- `VITE_TENANT_SLUG=koeti`

---

## 7. Conectar frontend y backend

Comprobar:

- login correcto
- datos generales cargan
- creación de cliente funciona
- creación de consulta funciona
- ventas/presupuestos responden

---

## 8. Crear respaldo inicial

Antes de entregar la demo o iniciar carga real:

1. crear un backup de la base online
2. guardar el dump fuera del servidor
3. guardar también una copia local segura

---

## 9. Lista de control final

Antes de mostrar al cliente:

- el nombre del cliente aparece correcto
- el tenant correcto es `koeti`
- la base está vacía o con demo controlada
- no existen datos de otra óptica
- login administrador funciona
- frontend y backend están conectados
- Volume de Railway conectado y `MEDIA_ROOT` configurado (logo sobrevive un redeploy)
- backup inicial realizado

---

## 10. Qué hacer después

Si la demo gusta:

- mantener la misma instancia y pasar a productivo
o
- crear una nueva instancia productiva con el mismo procedimiento

---

## Caso actual: Koeti

Cliente a preparar:

- Óptica: `Koeti`
- Correo administrativo: `hesaka.koeti@gmail.com`
- Slug recomendado: `koeti`
- Repositorio recomendado: `hesaka-koeti`
- Proyecto Railway: `hesaka-koeti`
- Proyecto Vercel: `hesaka-koeti`
- Base de datos recomendada: `hesaka_koeti`

