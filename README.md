# CoffeeFlow Enterprise

Monorepo para una plataforma de cafetería con POS, pantalla de cocina (KDS) y panel de administración.

## Información del proyecto

- _Nombre del proyecto:_ CoffeeFlow Enterprise
- _Descripción general:_ Aplicación de gestión para cafeterías que integra un punto de venta (POS), pantalla de cocina en tiempo real (KDS) y un panel administrativo para inventario, productos y reportes.
- _Materia:_ Diseño e Interacción de Interfaces de Usuario
- _Profesor:_ Pedro César Santana Mancilla
- _Integrantes del equipo:_ Alberto Vazquez Figueroa, Bryan Leonardo Murataya Moreno, Julio César Del Toro Mojarro

## Tecnologías y versiones utilizadas

- _Node.js:_ 20+
- _npm:_ 10+
- _Turborepo / Turbo:_ gestión de monorepo y ejecución de múltiples apps
- _Next.js:_ framework React para aplicaciones web modernas
- _React:_ librería de UI
- _Tailwind CSS:_ estilos utlizados en los componentes
- _Supabase:_ backend de base de datos y autenticación (opcional)
- _TypeScript:_ tipado estático para todo el frontend y los packages compartidos

## Descripción de las funcionalidades implementadas

CoffeeFlow Enterprise ofrece un prototipo funcional con las siguientes pantallas y herramientas:

- _POS:_ Interfaz de caja para agregar productos, crear pedidos y gestionar tickets.
- _KDS:_ Pantalla de cocina/barista para ver el estado de los pedidos y marcar platillos como listos.
- _Admin:_ Panel de administración para gestionar productos, inventario y revisar reportes.
- _Seguimiento de pedidos:_ página pública para que clientes consulten su pedido en tiempo real.
- _Marca de entregado:_ flujo para actualizar pedidos como entregados desde la interfaz de POS.
- _Componentes compartidos:_ librería packages/ui con botones, tarjetas y recursos reutilizables.
- _Conexión de datos:_ lógica de packages/database para manejar datos de Supabase y seeds demo.

## Declaración de uso de inteligencia artificial

- Este proyecto ha sido desarrollado de forma colaborativa con asistencia de herramientas de inteligencia artificial para mejorar la redacción del README y la organización de la documentación.
- Todo el código y la implementación han sido creados y revisados por el equipo, y la IA se ha utilizado únicamente con fines de documentación y apoyo en la estructuración del proyecto.

## Instrucciones para instalar dependencias y ejecutar el prototipo

1. Clona el repositorio:

bash
git clone <URL_DEL_REPOSITORIO>
cd CoffeeFlow-Enterprise

2. Instala dependencias:

bash
npm install

3. Copia las variables de entorno y completa las credenciales si usas Supabase:

bash
cp .env.example .env.local

# Edita .env.local con tu URL/KEY de Supabase si corresponde

4. Ejecuta el prototipo en modo desarrollo:

bash
npm run dev

5. Abre las apps en el navegador según el puerto asignado:

- http://localhost:3000 — apps/kds
- http://localhost:3001 — apps/admin
- http://localhost:3002 — apps/pos

> Si alguno de los puertos está en uso, Turbo puede reasignarlos automáticamente. Revisa la salida de la consola para las URLs exactas.

## Enlace al prototipo funcional

- _Prototipo local:_ abre http://localhost:3002 después de ejecutar npm run dev
- _Nota:_ Si ya existe un prototipo desplegado en la web, agrega aquí el enlace público una vez disponible.

## Requisitos

- Node.js 20+ (recomendado)
- npm 10+
- Una instancia de Supabase para la base de datos (opcional para desarrollo con datos reales)

## Configuración inicial

1. Instala dependencias:

bash
npm install

2. Copia las variables de entorno y completa las credenciales:

bash
cp .env.example .env.local

# Edita .env.local con tu URL/KEY de Supabase si corresponde

3. (Opcional) Si usas Supabase, aplica el esquema o crea la base usando packages/database/schema.sql.

## Arranque en desarrollo

Ejecuta el monorepo en modo desarrollo (Turborepo/Turbo):

bash
npm run dev

## Seeds / Datos demo

Para cargar datos de demostración (categorías, productos, recetas) revisa packages/database/src/seed.ts y usa la utilidad ensureDemoData si está expuesta en tu entorno. En desarrollo local normalmente los datos demo se aplican automáticamente al iniciar.

## Comandos útiles

- Levantar dev: npm run dev
- Build: npm run build
- Lint: npm run lint
- Tests (si están configurados): npm test o npm run test

## Flujo de trabajo rápido

1. Modifica componentes en packages/ui para cambios compartidos.
2. Ajusta lógica en packages/database para queries y seeds.
3. Prueba la UI en apps/pos y apps/kds ejecutando npm run dev.

## Notas y resolución de problemas

- Hidratación React: si ves errores tipo "A tree hydrated but some attributes...", revisa diferencias entre server/client (por ejemplo, atributos de form como method deben coincidir exactamente con mayúsculas). Evita usar valores que cambian entre servidor/cliente (p. ej. Date.now() o Math.random()) en renderizado inicial.
- Puertos en uso: Turbo puede reasignar puertos; revisa la consola para conocer las URLs reales.

## Contribuir

1. Crea una rama con nombre descriptivo feat/mi-cambio.
2. Asegura que lint pasa y los cambios son mínimos.
3. Abre un PR describiendo el propósito y pasos para validar.

## Recursos y archivos importantes

- Esquema de DB: packages/database/schema.sql
- Seeds demo: packages/database/src/seed.ts
- Punto de entrada POS: apps/pos/src/app/pos-workbench.tsx
- Seguimiento de pedidos (público): apps/pos/src/app/seguimiento-pedido/page.tsx
- Acción para marcar entregado: apps/pos/src/app/actions.ts

_Rutas y Endpoints (local)_

- _KDS (pantalla cocina)_: http://localhost:3000/ — app: apps/kds
- _Admin (backoffice)_: http://localhost:3001/ — app: apps/admin
- _POS (caja)_: http://localhost:3002/ — app: apps/pos
- _POS — Seguimiento público_: http://localhost:3002/seguimiento-pedido — página pública para que clientes consulten su ticket (apps/pos/src/app/seguimiento-pedido/page.tsx)
- _POS — Marcar entregado_: http://localhost:3002/marcar-entregado — acción y UI para marcar pedidos como entregados (apps/pos/src/app/marcar-entregado/page.tsx)
- _API (ejemplos)_: revisa apps/\*/src/app/api para endpoints; ejemplo usado en desarrollo: /api/estado-platillos (revalida/consulta estado de platillos)

Nota: los puertos son los más comunes en este proyecto, pero turbo dev puede reasignarlos si alguno ya está en uso — revisa la consola para las URLs exactas.

Nota histórica: originalmente apps/admin, apps/kds y apps/pos estaban configuradas como submódulos. Ahora todos los contenidos de apps/\* están incluidos directamente en este repositorio, por lo que al clonar o descargar desde GitHub las carpetas contendrán sus archivos sin necesidad de inicializar submódulos.
