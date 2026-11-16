# SAHD — Frontend

Pantallas del Sistema de Administración de Horarios Docentes. Angular 21 y PrimeNG.

La aplicación queda en `http://localhost:4200`. Habla con la API en `http://localhost:3000`.

La API, la base y Brevo se configuran en el backend. Este README cubre solo las pantallas. Los pasos de la API están en el README de `horario-backend`.

## Qué hace falta antes de empezar

1. [Node.js 20 o superior](https://nodejs.org/).
2. [pnpm](https://pnpm.io/installation):

```bash
corepack enable
corepack prepare pnpm@10.28.1 --activate
```

3. El backend ya levantado. Sin la API en `http://localhost:3000`, el login y las tablas no cargan. Cómo dejarlo listo está en el README de `horario-backend`.

Comprobá Node y pnpm:

```bash
node -v
pnpm -v
```

## Orden para dejarlo funcionando

### 1. Instalar dependencias

Desde la carpeta `horario-frontend`:

```bash
pnpm install
```

Descarga Angular, PrimeNG y el resto de las librerías. No abre la aplicación.

### 2. Confirmar la dirección de la API

En local no hay un `.env`. La dirección está en `src/app/core/environments/environment.development.ts`:

```ts
export const environment = {
  apiUrl: 'http://localhost:3000'
} as const;
```

Tiene que apuntar al mismo puerto en el que corre el backend. Las peticiones salen con la cookie de sesión. El backend solo acepta el origen `http://localhost:4200`, así que no cambies el puerto del frontend sin cambiar también el CORS de la API.

### 3. Arrancar la aplicación

```bash
pnpm start
```

Ejecuta `ng serve`, compila y abre el servidor de desarrollo. Cada vez que guardás un archivo, la página se recarga sola.

Cuando termina, la consola muestra:

```text
Local: http://localhost:4200/
```

Abrí esa dirección. La primera pantalla es el login.

## Cómo probar que quedó funcional

1. El backend tiene que estar en `http://localhost:3000` y Swagger tiene que abrir en `http://localhost:3000/api/docs`.
2. Entrá a `http://localhost:4200`.
3. Escribí el correo de `SEED_ADMIN_EMAIL` del backend y presioná **Continuar**.
4. Fuera de producción, ese correo entra directo a `/dashboard`.
5. Cualquier otro correo pasa a `/verify-code`. El código llega por Brevo con el asunto `Código para ingresar — Gestión de Horarios`. Si no llega, la configuración está del lado del backend, en las variables `BREVO_*`.

En `/verify-code`, **Volver para corregir el correo** regresa al login.

## Pantallas

| Ruta | Qué muestra |
|---|---|
| `/login` | Correo y botón Continuar |
| `/verify-code` | Código de 6 dígitos |
| `/activate-account` | Activación de una cuenta nueva |
| `/dashboard` | Entrada después del ingreso |
| `/docentes` | Listado de docentes, filtros y alta |
| `/administracion/usuarios` | Usuarios |
| `/administracion/usuarios/nuevo` | Alta de usuario |
| `/administracion/roles` | Roles |
| `/administracion/materias` | Materias |

Docentes pide sesión. Usuarios y roles piden además el permiso que corresponda. El menú muestra Dashboard, Docentes y Administración.

## Comandos

Cada comando se ejecuta dentro de `horario-frontend`.

```bash
pnpm start
```

Levanta el servidor de desarrollo en `http://localhost:4200`. Es el comando de trabajo diario.

```bash
pnpm run build
```

Compila la aplicación para producción y deja el resultado en `dist/`. No abre el navegador.

```bash
pnpm test
```

Corre los tests unitarios con Vitest.

```bash
pnpm exec ng generate component nombre
```

Crea un componente nuevo. `pnpm exec ng generate --help` lista el resto de los generadores.
