# Bovimarket

**El mercado ganadero, más cerca de ti.** Proyecto académico de Desarrollo de Aplicación Web Frontend (Universidad de Córdoba).

## Descripción
Bovimarket es una aplicación web frontend para conectar compradores y vendedores de ganado bovino en Colombia. Esta versión integra la interfaz responsive de la primera entrega con la lógica del **Avance 2**: manipulación del DOM, eventos, consumo asíncrono de datos, persistencia local y validación dinámica.

## Tecnologías
- HTML5 semántico y CSS3 (Grid, Flexbox, variables y media queries).
- JavaScript nativo (ES6+), DOM y eventos `submit`, `click`, `input` y `change`.
- Fetch API con `async/await` y manejo de errores HTTP mediante `try/catch`.
- `localStorage` y JSON para publicaciones, contactos y favoritos.
- Google Fonts y Bootstrap Icons por CDN.

## Estructura
```text
Bovimarket/
├── index.html
├── vender.html
├── contacto.html
├── styles.css
├── data.json             # Fuente local consumida mediante Fetch
├── js/
│   └── app.js            # Lógica del Avance 2
├── assets/
│   └── images/
└── README.md
```

## Cómo ejecutar localmente
Fetch no puede leer `data.json` correctamente abriendo el HTML con `file://`. Ejecuta el proyecto desde un servidor local:

**Opción 1 – VS Code:** instala la extensión Live Server, abre la carpeta del proyecto y selecciona **Open with Live Server**.

**Opción 2 – Python:**
```bash
python -m http.server 5500
```
Luego abre `http://localhost:5500` en el navegador.

## Funcionalidades del Avance 2

### 1. DOM y eventos
- El catálogo se construye dinámicamente con `create`/`innerHTML` y se actualiza al filtrar o guardar favoritos.
- Los formularios interceptan `submit` con `event.preventDefault()` para evitar recargas.
- Eventos delegados `click`, `input` y `change` para favoritos, detalles, filtros y validaciones.

### 2. Consumo asíncrono
- `loadCattle()` consulta `data.json` con `fetch` y `async/await`.
- Comprueba `response.ok` y diferencia el error HTTP 404 de otros estados HTTP no exitosos (incluido 500).
- `try/catch` muestra al usuario mensajes de carga, éxito o error. Si falla la consulta, intenta mostrar las publicaciones que ya estén guardadas localmente.

### 3. Persistencia
Los datos se serializan como JSON en `localStorage`:
- `bovimarket_publicaciones`: publicaciones creadas desde **Vender ganado**.
- `bovimarket_contactos`: mensajes enviados desde los formularios de contacto.
- `bovimarket_favoritos`: identificadores de publicaciones favoritas.

Los datos permanecen en el navegador después de recargar la página. Son datos locales de demostración; no se envían a un servidor ni se comparten entre dispositivos.

### 4. Validación
Se combina la validación nativa HTML (`required`, `min`, `max`, `pattern`, `type`) con validación en tiempo real en eventos `input` y `change`. Los campos válidos e inválidos reciben estilos y mensajes junto al campo.

## Pruebas sugeridas para la sustentación
1. Abrir Inicio y observar el estado de carga y luego el catálogo obtenido desde `data.json`.
2. Filtrar por raza, ubicación y rango de precio; pulsar **Limpiar** para restablecer el catálogo.
3. Marcar y desmarcar una publicación como favorita y recargar para comprobar su persistencia.
4. En **Vender ganado**, enviar el formulario vacío para observar la validación; después registrar una publicación completa.
5. Volver a Inicio y recargar: la nueva publicación debe aparecer.
6. En **Contacto**, enviar un mensaje válido y revisar el mensaje de confirmación.
7. Para probar el manejo de error, renombrar temporalmente `data.json`, recargar Inicio y observar el mensaje de error; luego restaurar el nombre.

## Alcance y limitaciones
La API consumida es un archivo JSON local estructurado, alternativa permitida por la guía. `localStorage` guarda los registros únicamente en el navegador y dispositivo actuales. No existe backend, autenticación ni envío real de mensajes.

## Próxima entrega
La entrega final migrará esta lógica a Vue.js, incorporará componentes, Vue Router, estado compartido y despliegue en producción.
