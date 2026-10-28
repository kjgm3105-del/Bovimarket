# Bovimarket

**El mercado ganadero, más cerca de ti.** Primera entrega del proyecto de Desarrollo de Aplicación Web Frontend (Universidad de Córdoba).

## Descripción y objetivo
Bovimarket será una plataforma de compra y venta de ganado bovino en Colombia. Esta entrega construye solo la interfaz estática: semántica HTML5, maquetación responsive y control de versiones.

## Tecnologías
Paleta: verde fuerte, café y amarillo. HTML5 semántico, CSS3 (Grid, Flexbox, variables, Media Queries Mobile First), Google Fonts (Bricolage Grotesque, Figtree) y Bootstrap Icons por CDN, Git y GitHub. Sin JavaScript, frameworks ni backend.

## Estructura
```
Bovimarket/
├── index.html      # Página principal
├── vender.html     # Formulario para publicar ganado
├── contacto.html   # Formulario de contacto
├── styles.css      # Estilos (breakpoints: 640, 1024 y 1440 px)
├── assets/images/  # vaca.svg y hero.svg (ilustraciones de ejemplo)
└── README.md
```

## Abrir localmente
Descarga o clona el repositorio y abre `index.html` en el navegador. No requiere servidor. Los iconos y fuentes necesitan conexión a internet (CDN).

## Funcionalidades visuales incluidas
Encabezado y navegación adaptable, hero con buscador visual, categorías, catálogo de 6 publicaciones de ejemplo, sección para vendedores, pasos, formularios con validación HTML nativa, preguntas frecuentes (`details`) y pie de página.

## Próximas entregas
- **Avance 2:** JavaScript nativo (DOM, eventos), consumo de API con `fetch`, `localStorage` y validaciones dinámicas.
- **Entrega final:** SPA con Vue.js, Vue Router, estado compartido y despliegue en la nube.
