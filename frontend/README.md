# Bicho Malo Taller

Sistema de gestión del taller: ingresos, vehículos adentro e historial de trabajos.

React 19 + Vite · Supabase (auth + Postgres).

## Puesta en marcha

### 1. Crear el proyecto en Supabase

En [supabase.com](https://supabase.com) → **New project**. Anotá la contraseña de la base.

### 2. Crear las tablas

Supabase → **SQL Editor** → pegar entero el contenido de [`../supabase/schema.sql`](../supabase/schema.sql) y ejecutar.

Crea `ingresos` y `mecanicos`, los índices de búsqueda y las políticas de RLS. Se puede volver a correr sin romper nada.

### 3. Crear los usuarios del taller

Supabase → **Authentication → Users → Add user**, con email y contraseña. Marcá *Auto Confirm User* para que no tenga que confirmar el mail.

No hay registro desde la app: es interna, los usuarios los das de alta vos.

### 4. Conectar el frontend

```bash
cp .env.example .env.local
```

Completar con los valores de Supabase → **Project Settings → API**:

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

La *anon key* es pública y va en el navegador; lo que protege los datos es RLS, que exige sesión para leer o escribir.

### 5. Levantar la app

```bash
npm install
```

```bash
npm run dev
```

Si faltan las variables de entorno la app avisa en pantalla en vez de romperse.

## Cómo está armado

```
frontend/src
├─ lib/          Cliente de Supabase, consultas y hook de carga
├─ ui/           Primitivas: iconos, patente, chips, avisos, estados
├─ components/   Una pantalla por archivo, con su CSS al lado
├─ index.css     Tokens del sistema de diseño (claro y oscuro)
└─ ui/ui.css     Botones, campos, tarjetas, estados vacíos
```

### Datos

Una sola tabla `ingresos`. El booleano `finalizado` decide dónde aparece:

| `finalizado` | Pantalla | Qué significa |
|---|---|---|
| `false` | En el taller | Ingreso empezado, el auto sigue adentro |
| `true` | Historial | Trabajo cerrado |

El buscador pega contra `busqueda`, una columna generada que concatena patente, cliente, vehículo, trabajos, motivo y diagnóstico, con índice trigram.

## Comandos

```bash
npm run dev
```

```bash
npm run build
```

```bash
npm run lint
```
