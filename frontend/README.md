# Bicho Malo Taller

Sistema de gestión del taller: ingresos, vehículos adentro, historial por
auto, tablero de estados y reportes de facturación.

React 19 + Vite · Supabase (auth + Postgres).

## Puesta en marcha

### 1. Crear el proyecto en Supabase

En [supabase.com](https://supabase.com) → **New project**. Anotá la contraseña de la base.

### 2. Crear las tablas

Supabase → **SQL Editor** → pegar entero el contenido de [`../supabase/schema.sql`](../supabase/schema.sql) y ejecutar.

Crea `clientes`, `vehiculos`, `visitas`, `mecanicos`, la vista `vehiculos_resumen`
y las políticas de RLS. Se puede volver a correr sin romper nada.

> Si tu base todavía tiene la tabla vieja `ingresos` (versión anterior de
> este sistema), el mismo script la migra sola al modelo nuevo y la borra
> al final. No hace falta hacer nada manual.

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

> `node_modules/` no va en el repo ni en el .zip: son binarios que dependen
> del sistema operativo. Siempre se genera de nuevo con `npm install`.

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

Tres tablas relacionadas:

| Tabla | Qué guarda |
|---|---|
| `clientes` | Nombre y teléfono |
| `vehiculos` | Patente (única) y modelo, ligado a un cliente |
| `visitas` | Una fila por cada paso del vehículo por el taller: motivo, diagnóstico, trabajos, costos, mecánico y `estado` |

El `estado` de una visita es uno de: `Pendiente`, `En reparación`, `Finalizado`, `Entregado`.
El estado *actual* de un vehículo es el de su visita más reciente.

La vista `vehiculos_resumen` da un vehículo por fila con los datos de su
última visita — la usan Inicio, Historial, Pendientes, Buscar y el Tablero.
Para ver el historial completo de un auto (todas sus visitas), la Ficha del
vehículo consulta directamente la tabla `visitas`.

### Pantallas

- **Inicio** — resumen del taller y accesos directos.
- **Nuevo ingreso** — carga o continúa una visita.
- **En el taller** — visitas sin entregar.
- **Historial** — vehículos con la última visita entregada; cada uno abre
  su ficha con todo el historial.
- **Buscar** — por patente, cliente, vehículo o lo hecho al auto.
- **Tablero** — las visitas activas agrupadas por estado, con un botón para
  avanzarlas a la siguiente etapa.
- **Reportes** — facturación de los últimos meses y desempeño por mecánico,
  calculados sobre las visitas entregadas.

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
