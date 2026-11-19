import { reactive, ref } from "vue";
export function leerLocal(key, defecto) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defecto;
  } catch {
    return defecto;
  }
}
export function guardarLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export const estado = reactive({
  user: null,
  ganado: [],
  anuncios: [],
  cargando: false,
  error: "",
  sesionLista: false,
  favoritos: [],
  aviso: "",
});
const favoritos = leerLocal("bovimarket_favoritos", []);
estado.favoritos = Array.isArray(favoritos) ? favoritos : [];
let timer;
export function avisar(msg) {
  estado.aviso = msg;
  clearTimeout(timer);
  timer = setTimeout(() => (estado.aviso = ""), 4200);
}
export function favorito(id) {
  const guardado = estado.favoritos.includes(id);
  estado.favoritos = guardado
    ? estado.favoritos.filter((x) => x !== id)
    : [...estado.favoritos, id];
  const ok = guardarLocal("bovimarket_favoritos", estado.favoritos);
  avisar(
    ok
      ? guardado
        ? "Retirado de favoritos."
        : "Guardado en tus favoritos."
      : "El navegador no permitió guardar los favoritos.",
  );
}
export async function api(path, body) {
  let res;
  try {
    res = await fetch("/api/" + path, {
      credentials: "same-origin",
      headers:
        body === undefined
          ? { Accept: "application/json" }
          : { "Content-Type": "application/json", Accept: "application/json" },
      method: body === undefined ? "GET" : "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw Error(
      "No hay conexión con Bovimarket. Revisa tu conexión y vuelve a intentar.",
    );
  }
  let data;
  try {
    data = await res.json();
  } catch {
    throw Error(
      "La API no está disponible. Abre la aplicación con npm run dev o usa el sitio publicado.",
    );
  }
  if (!res.ok) {
    if (res.status === 401 && path !== "login") estado.user = null;
    const err = Error(data.error || "Error HTTP " + res.status);
    err.status = res.status;
    throw err;
  }
  return data;
}
export async function cargar() {
  estado.cargando = true;
  estado.error = "";
  try {
    estado.ganado = await api("ganado");
  } catch (e) {
    estado.error = e.message;
  } finally {
    estado.cargando = false;
  }
}
let enSesion;
export function cargarSesion() {
  if (estado.sesionLista) return Promise.resolve();
  if (!enSesion)
    enSesion = api("sesion")
      .then((x) => {
        estado.user = x.user;
        estado.sesionLista = true;
      })
      .catch(() => {
        enSesion = null;
      });
  return enSesion;
}
export function operacion() {
  const ocupado = ref(false),
    error = ref("");
  async function ejecutar(fn) {
    if (ocupado.value) return;
    ocupado.value = true;
    error.value = "";
    try {
      await fn();
    } catch (e) {
      error.value = e.message;
    } finally {
      ocupado.value = false;
    }
  }
  return { ocupado, error, ejecutar };
}
