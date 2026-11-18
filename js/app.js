/* Bovimarket - Avance 2: DOM, eventos, Fetch, localStorage y validación */
'use strict';

// Construye la ruta de data.json desde la ubicación real de app.js.
const appScript = document.querySelector('script[src*="app.js"]');
const DATA_URL = appScript
  ? new URL('../data.json', appScript.src).href
  : new URL('./data.json', document.baseURI).href;

const STORAGE = {
  cattle: 'bovimarket_publicaciones',
  contacts: 'bovimarket_contactos',
  favorites: 'bovimarket_favoritos'
};

const readStorage = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch (error) {
    console.error(`No se pudo leer ${key}:`, error);
    return [];
  }
};

const writeStorage = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const money = (value) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0
}).format(Number(value) || 0);

// Convierte la fotografía seleccionada a una imagen JPEG ligera para guardarla
// en localStorage y poder mostrarla después de recargar la página.
function imageToDataURL(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Selecciona un archivo de imagen válido.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la fotografía.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('La fotografía no tiene un formato válido.'));
      image.onload = () => {
        const maxSide = 1200;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

function showMessage(container, message, type = 'success') {
  if (!container) return;
  container.textContent = message;
  container.className = `feedback feedback-${type}`;
  container.hidden = false;
}

function validateField(field) {
  if (!field.matches('input, select, textarea')) return true;
  const valid = field.checkValidity();
  field.classList.toggle('is-valid', valid && field.value.trim() !== '');
  field.classList.toggle('is-invalid', !valid);
  let hint = field.parentElement.querySelector('.field-error');
  if (!valid) {
    if (!hint) {
      hint = document.createElement('small');
      hint.className = 'field-error';
      field.insertAdjacentElement('afterend', hint);
    }
    hint.textContent = field.validationMessage || 'Revisa este campo.';
  } else if (hint) {
    hint.remove();
  }
  return valid;
}

document.addEventListener('input', (event) => {
  if (event.target.matches('input, textarea')) validateField(event.target);
});
document.addEventListener('change', (event) => {
  if (event.target.matches('input, select, textarea')) validateField(event.target);
});

function renderCattle(items) {
  const grid = document.querySelector('#catalogo-lista');
  if (!grid) return;
  if (!items.length) {
    grid.innerHTML = '<p class="aviso">No encontramos publicaciones que coincidan con tu búsqueda.</p>';
    return;
  }
  const favorites = readStorage(STORAGE.favorites);
  grid.innerHTML = items.map(item => {
    const favorite = favorites.includes(String(item.id));
    const image = item.imagen || 'assets/images/vaca.svg';
    return `<article class="tarjeta" data-id="${escapeHTML(item.id)}">
      <figure><img src="${escapeHTML(image)}" alt="${escapeHTML(item.titulo)}" width="400" height="300" loading="lazy">
      <button class="fav" type="button" data-favorite="${escapeHTML(item.id)}" aria-pressed="${favorite}" aria-label="${favorite ? 'Quitar de' : 'Guardar en'} favoritos">
      <i class="bi ${favorite ? 'bi-heart-fill' : 'bi-heart'}" aria-hidden="true"></i></button></figure>
      <h3>${escapeHTML(item.titulo)}</h3>
      <dl><dt>Raza</dt><dd>${escapeHTML(item.raza)}</dd><dt>Sexo</dt><dd>${escapeHTML(item.sexo)}</dd>
      <dt>Edad</dt><dd>${escapeHTML(item.edad)} meses</dd><dt>Peso</dt><dd>${escapeHTML(item.peso)} kg</dd>
      <dt>Ubicación</dt><dd>${escapeHTML(item.ubicacion)}</dd></dl>
      <p class="precio">${money(item.precio)} COP</p>
      <button class="btn btn-primario btn-detalle" type="button" data-detail="${escapeHTML(item.id)}">Ver detalles</button>
    </article>`;
  }).join('');
}

let cattle = [];

async function loadCattle() {
  const grid = document.querySelector('#catalogo-lista');
  const status = document.querySelector('#api-status');
  if (!grid) return;
  if (status) showMessage(status, 'Cargando publicaciones...', 'loading');
  try {
    if (window.location.protocol === 'file:') {
      throw new Error('Estás abriendo el archivo directamente (file://). Inicia Live Server en index.html para habilitar Fetch.');
    }
    const response = await fetch(DATA_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    if (response.status === 404) throw new Error('No se encontró data.json (HTTP 404).');
    if (!response.ok) throw new Error(`El servidor respondió con HTTP ${response.status}.`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('El formato de datos recibido no es válido.');
    const saved = readStorage(STORAGE.cattle);
    const savedIds = new Set(saved.map(item => String(item.id)));
    cattle = [...data.filter(item => !savedIds.has(String(item.id))), ...saved];
    renderCattle(cattle);
    if (status) showMessage(status, `Publicaciones cargadas correctamente: ${cattle.length}.`, 'success');
  } catch (error) {
    console.error('Error al consultar el catálogo:', error);
    cattle = readStorage(STORAGE.cattle);
    renderCattle(cattle);
    if (status) showMessage(status, `No fue posible consultar el catálogo: ${error.message} Verifica que uses un servidor local y vuelve a intentarlo.`, 'error');
  }
}

function applyFilters() {
  const form = document.querySelector('#buscador');
  if (!form) return;
  const raza = form.elements.raza.value;
  const ubicacion = form.elements.ubicacion.value.trim().toLocaleLowerCase('es');
  const rango = form.elements.precio.value;
  const filtered = cattle.filter(item => {
    const byBreed = !raza || raza === 'Todas' || item.raza === raza;
    const byPlace = !ubicacion || item.ubicacion.toLocaleLowerCase('es').includes(ubicacion);
    const price = Number(item.precio);
    const byPrice = !rango || rango === 'Cualquiera' ||
      (rango === 'bajo' && price <= 3000000) ||
      (rango === 'medio' && price > 3000000 && price <= 6000000) ||
      (rango === 'alto' && price > 6000000);
    return byBreed && byPlace && byPrice;
  });
  renderCattle(filtered);
}

// Vista previa de la foto elegida en el formulario de publicación.
document.addEventListener('change', (event) => {
  if (event.target.id !== 'v-fotos') return;
  const input = event.target;
  let preview = document.querySelector('#vista-previa-foto');
  if (!preview) {
    preview = document.createElement('div');
    preview.id = 'vista-previa-foto';
    preview.className = 'vista-previa-foto';
    input.closest('p')?.insertAdjacentElement('afterend', preview);
  }
  const file = input.files && input.files[0];
  if (!file) {
    preview.innerHTML = '';
    return;
  }
  if (!file.type.startsWith('image/')) {
    preview.textContent = 'El archivo seleccionado no es una imagen.';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    preview.innerHTML = `<p>Vista previa de la fotografía principal:</p><img src="${reader.result}" alt="Vista previa del ganado" style="max-width:240px;max-height:180px;object-fit:cover;border-radius:12px">`;
  };
  reader.readAsDataURL(file);
});

document.addEventListener('submit', async (event) => {
  const form = event.target;
  if (!form.matches('form')) return;
  if (form.id === 'buscador') {
    event.preventDefault();
    applyFilters();
    return;
  }
  if (form.id === 'form-publicar') {
    event.preventDefault();
    const fields = [...form.querySelectorAll('input, select, textarea')];
    const valid = fields.map(validateField).every(Boolean);
    if (!valid || !form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form).entries());
    const photoInput = form.querySelector('#v-fotos');
    let photo = 'assets/images/vaca.svg';
    if (photoInput?.files?.length) {
      try {
        photo = await imageToDataURL(photoInput.files[0]);
      } catch (error) {
        showMessage(form.querySelector('.form-feedback'), error.message, 'error');
        return;
      }
    }
    const publication = {
      id: `local-${Date.now()}`, titulo: values.titulo, raza: values.raza,
      sexo: values.sexo, edad: Number(values.edad), peso: Number(values.peso),
      ubicacion: `${values.municipio}, ${values.departamento}`,
      precio: Number(values.precio), imagen: photo,
      cantidad: Number(values.cantidad), tipo: values.tipo,
      descripcion: values.descripcion, fecha: values.disponibilidad
    };
    const saved = readStorage(STORAGE.cattle);
    saved.push(publication);
    writeStorage(STORAGE.cattle, saved);
    showMessage(form.querySelector('.form-feedback'), '¡Publicación guardada! Ya está disponible en el catálogo de este navegador.', 'success');
    form.reset();
    fields.forEach(field => { field.classList.remove('is-valid', 'is-invalid'); });
    return;
  }
  if (form.matches('[data-contact-form]')) {
    event.preventDefault();
    const fields = [...form.querySelectorAll('input, select, textarea')];
    const valid = fields.map(validateField).every(Boolean);
    if (!valid || !form.reportValidity()) return;
    const contact = Object.fromEntries(new FormData(form).entries());
    contact.id = `contacto-${Date.now()}`;
    contact.fechaRegistro = new Date().toISOString();
    const contacts = readStorage(STORAGE.contacts);
    contacts.push(contact);
    writeStorage(STORAGE.contacts, contacts);
    showMessage(form.querySelector('.form-feedback'), 'Mensaje guardado correctamente en este navegador. ¡Gracias por contactarnos!', 'success');
    form.reset();
    fields.forEach(field => field.classList.remove('is-valid', 'is-invalid'));
  }
});

document.addEventListener('error', (event) => {
  const image = event.target;
  if (image instanceof HTMLImageElement && image.closest('.tarjeta') && !image.dataset.fallbackApplied) {
    image.dataset.fallbackApplied = 'true';
    image.src = 'assets/images/vaca.svg';
  }
}, true);

document.addEventListener('click', (event) => {
  const favoriteButton = event.target.closest('[data-favorite]');
  if (favoriteButton) {
    const id = String(favoriteButton.dataset.favorite);
    let favorites = readStorage(STORAGE.favorites);
    favorites = favorites.includes(id) ? favorites.filter(item => item !== id) : [...favorites, id];
    writeStorage(STORAGE.favorites, favorites);
    const item = cattle.find(cattleItem => String(cattleItem.id) === id);
    if (item) renderCattle(cattle);
    return;
  }
  const detailButton = event.target.closest('[data-detail]');
  if (detailButton) {
    const item = cattle.find(cattleItem => String(cattleItem.id) === detailButton.dataset.detail);
    if (item) alert(`${item.titulo}\nRaza: ${item.raza}\nUbicación: ${item.ubicacion}\nPrecio: ${money(item.precio)}`);
  }
  if (event.target.closest('#limpiar-busqueda')) {
    const form = document.querySelector('#buscador');
    if (form) { form.reset(); renderCattle(cattle); }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  loadCattle();
  document.querySelector('#btn-buscar')?.addEventListener('click', applyFilters);
});
