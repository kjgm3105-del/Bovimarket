# Bovimarket

Compra y venta de ganado bovino en Colombia. La entrega final conserva las fotos, las razas y la identidad verde, crema, café y amarilla del proyecto. La aplicación conecta a compradores y vendedores mediante una SPA en Vue 3 y una API propia con datos compartidos.

**Aplicación de la entrega** · [Abrir Bovimarket](https://bovimarket-campo-colombia.chattydingo512.chatgpt.site)

**Avances en el repositorio** · [Primera entrega](https://github.com/kjgm3105-del/Bovimarket/tree/b0fd220) · [Avance 2](https://github.com/kjgm3105-del/Bovimarket/tree/8751831)

## Abrir en VS Code

Instala Node.js 24 LTS (mínimo 22.13). Abre en VS Code la carpeta que contiene `package.json`. En **Terminal → Nueva terminal**, ejecuta:

```sh
npm install
npm run dev
```

Abre la dirección que imprime Vite, normalmente **http://localhost:5173**. Este comando inicia la interfaz y la API. La base de datos local se crea en `.local/bovimarket.sqlite`. Los favoritos y borradores se guardan en el navegador que utilizas. Live Server corresponde a los dos primeros avances.

Para ejecutar la distribución optimizada:

```sh
npm run build
npm start
```

Entra en **http://localhost:4173**. En Windows, **Ctrl+C** detiene el servidor. La base de datos de tu computador y la de la aplicación alojada son independientes.

## Probar una compra y una venta

1. Crea una cuenta de vendedor. En **Vender ganado**, publica un animal con foto, celular de contacto, cantidad y precio. El borrador del formulario se recupera si recargas.
2. Abre una ventana de incógnito, crea otra cuenta y busca esa publicación por raza o municipio. Pulsa **Comprar ganado**, indica la cantidad, la fecha de recogida y el celular. Revisa el total y confirma.
3. El comprador recibe un número de pedido en **Mi cuenta → Compras**. El vendedor ve la misma operación en **Ventas**. Solo las partes del pedido consultan sus datos de contacto.
4. Para cancelar un pedido confirmado, elige **Cancelar pedido** y confirma el cambio. El stock vuelve al catálogo. Para completar la operación, el vendedor marca **Entregado** y el comprador confirma la recepción.
5. El precio puede fijarse por animal, por lote completo o por kilo en pie. En la tercera modalidad, el total usa el peso por animal anunciado. El servidor calcula el importe. El pago se acuerda **contra entrega**. Las seis publicaciones iniciales están identificadas en su ficha como muestras académicas. Para demostrar la entrega con ambas cuentas, usa una publicación creada por ti.
6. En **Anuncios**, publica una búsqueda de ganado, una oferta de transporte o un servicio. Desde otra cuenta, contacta al anunciante. En **Mi cuenta → Mensajes**, el anunciante puede leer la consulta y responder al correo que compartió el interesado. Los avisos de ganado en venta aparecen automáticamente mientras tienen existencias.

## Dónde está cada avance

| Entrega | Qué mostrar | Dónde está |
| --- | --- | --- |
| Primera | HTML semántico, formularios, imágenes, Grid, Flexbox y adaptación móvil | Primer commit del repositorio. En la SPA se mantienen en `index.html`, `src/App.vue`, las vistas y `src/styles.css`. |
| Avance 2 | Eventos, DOM nativo, Fetch, validación, favoritos y publicaciones locales | Commit del Avance 2, `js/app.js` y `data.json`. La versión final reutiliza los identificadores de favoritos. En **Vender ganado** puedes recuperar una publicación antigua como borrador si sigue en el mismo origen del navegador. |
| Entrega final | Componentes .vue, rutas SPA, estado compartido y distribución de producción | `src/components/`, `src/views/`, `src/router.js`, `src/store.js` y `vite.config.js`. |

## Arquitectura

| Carpeta o archivo | Responsabilidad |
| --- | --- |
| `src/views/` | Inicio, catálogo, ficha, compra, venta, acceso, cuenta, anuncios y contacto. |
| `src/components/` | Barra de marca, filtros, tarjetas, campos con validación y estados de carga o error. |
| `src/domain.js` | Razas, modalidades, departamentos, formato COP y cálculo del resumen. |
| `src/store.js` | Estado reactivo compartido, cliente Fetch, sesión, favoritos y borradores. |
| `server/api.js` | Rutas, permisos por usuario, validación del servidor y reserva de existencias. |
| `server/auth.js` | Registro e inicio de sesión. Contraseñas derivadas con sal individual y sesiones revocables en cookies HttpOnly. |
| `server/schema.js`, `drizzle/` | Tablas SQL y migraciones. |
| `server/local.mjs`, `server/worker.js` | Adaptadores para SQLite local y D1 en la versión alojada. |
| `netlify/functions/`, `netlify.toml` | Despliegue alternativo de la SPA y de la misma API en Netlify con una base Turso. |
| `public/img/` | Fotografías originales optimizadas en WebP. Las imágenes cargadas por los vendedores se comprimen en el navegador y se sirven por la API. |
| `dist/client/`, `dist/server/` | Interfaz optimizada y servidor de producción generados con `npm run build`. |

## API para la sustentación

Abre **Herramientas de desarrollador → Red → Fetch/XHR**. Recarga el catálogo y revisa la respuesta de `/api/ganado`. Después abre **Anuncios** para ver `/api/anuncios`. Los métodos de escritura se prueban desde los formularios de la aplicación.

| Método y ruta | Para qué sirve |
| --- | --- |
| GET `/api/ganado`, GET `/api/ganado/:id` | Consultar el catálogo, el detalle y las existencias disponibles. |
| POST `/api/registro`, POST `/api/login`, GET `/api/sesion`, POST `/api/salir` | Crear una cuenta y abrir, consultar o cerrar la sesión. |
| POST `/api/ganado` | Publicar ganado y su fotografía desde una cuenta identificada. |
| POST `/api/pedidos` | Verificar la cantidad, calcular el total y reservar existencias. Un reintento de la misma solicitud conserva el pedido. |
| POST `/api/pedidos/:id/estado` | Cancelar un pedido confirmado, marcar entrega o confirmar recepción, según el rol. |
| GET y POST `/api/anuncios` | Consultar el tablón o publicar un aviso de la comunidad. |
| POST `/api/mensajes`, GET `/api/cuenta` | Registrar una consulta y ver las operaciones o mensajes de la cuenta. |

**Explicación corta para exponer:** “Con Vue separé cada pantalla en componentes. El catálogo pide los animales a mi API con Fetch. Cuando confirmo una compra, el servidor comprueba el stock, calcula el precio y guarda un pedido que ven tanto el comprador como el vendedor. El tablón consulta la misma base de datos y también permite publicar avisos”.

En `Ficha.vue`, la tarjeta recibe el animal mediante una **prop** y emite el evento **favorito**. En `Campo.vue`, **v-model** conecta el campo con el formulario mediante `update:modelValue`. En `Catalogo.vue`, una propiedad computada filtra los datos y **v-for** dibuja las tarjetas. En `store.js`, la función **api** hace la petición HTTP y maneja las respuestas de error. En `server/api.js`, busca **path === "pedidos"** para explicar la validación de la compra.

## Verificación y despliegue continuo

```sh
npm test
npm run build
```

Las pruebas usan bases temporales. Cubren registro, sesión, permisos, mensajes, cancelación, entrega, precios por modalidad, reintentos y dos compras que compiten por el último lote. La distribución separa las rutas en archivos cargados bajo demanda.

La entrega incluye un servidor de producción con D1. Para administrar una instalación con despliegue continuo desde tu propio GitHub en **Netlify**, importa el repositorio, selecciona la rama de la entrega, crea una base **Turso** y configura `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` en el entorno privado de compilación y funciones. Netlify lee `netlify.toml`, aplica las migraciones pendientes, verifica las pruebas y publica el frontend y la API con cada actualización de la rama. Ambos entornos mantienen bases independientes. Los secretos se configuran en el proveedor.

El formulario de contacto registra tickets de soporte en la tabla `mensajes`. Los mensajes entre usuarios se consultan en sus bandejas. Los correos externos se abren con la aplicación de correo que tenga configurada cada persona.

