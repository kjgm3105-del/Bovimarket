<script setup>
import { reactive, ref, watch, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { Camera, ImagePlus, Tag } from "lucide-vue-next";
import {
  api,
  estado,
  avisar,
  cargar,
  guardarLocal,
  leerLocal,
  operacion,
} from "../store";
import {
  razas,
  sexos,
  modalidades,
  departamentos,
  hoy,
  unidad,
} from "../domain";
import Campo from "../components/Campo.vue";
const router = useRouter(),
  draftKey = "bovimarket_borrador_" + estado.user.id;
const defaults = {
  titulo: "",
  raza: "",
  sexo: "",
  edad: "",
  peso: "",
  cantidad: 1,
  tipo: "Por animal",
  precio: "",
  municipio: "",
  departamento: "",
  fecha: hoy(),
  telefono: "",
  descripcion: "",
};
const d = reactive({ ...defaults, ...leerLocal(draftKey, {}) }),
  foto = ref(""),
  procesando = ref(false),
  errorFoto = ref(""),
  copia = ref(true);
const anteriores = leerLocal("bovimarket_publicaciones", []),
  anterior = ref("");
const { ocupado, error, ejecutar } = operacion();
let guardado = false,
  version = 0;
watch(
  d,
  () => {
    if (!guardado) copia.value = guardarLocal(draftKey, { ...d });
  },
  { deep: true },
);
onBeforeUnmount(() => version++);
function importar() {
  const x = Array.isArray(anteriores)
    ? anteriores.find((a) => String(a.id) === anterior.value)
    : null;
  if (!x) return;
  const [municipio, departamento] = String(x.ubicacion || "")
    .split(",")
    .map((s) => s.trim());
  Object.assign(d, {
    ...defaults,
    titulo: x.titulo || "",
    raza: x.raza,
    sexo: x.sexo === "Lote mixto" ? "Mixto" : x.sexo,
    edad: x.edad,
    peso: x.peso,
    cantidad: x.cantidad || 1,
    tipo: x.tipo || "Por animal",
    precio: x.precio,
    descripcion: x.descripcion || "",
    municipio,
    departamento,
    fecha: x.fecha >= hoy() ? x.fecha : hoy(),
  });
  foto.value =
    String(x.imagen || "").startsWith("data:image/jpeg;base64,") &&
    x.imagen.length <= 650000
      ? x.imagen
      : "";
}
async function elegir(e) {
  const turno = ++version,
    file = e.target.files[0];
  foto.value = "";
  errorFoto.value = "";
  procesando.value = !!file;
  if (!file) return;
  const url = URL.createObjectURL(file);
  try {
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 12 * 1024 * 1024
    )
      throw Error("Elige una foto JPG, PNG o WebP de hasta 12 MB.");
    const img = new Image();
    img.src = url;
    await img.decode();
    const ratio = Math.min(1, 1000 / Math.max(img.width, img.height)),
      c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.width * ratio));
    c.height = Math.max(1, Math.round(img.height * ratio));
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    let data = c.toDataURL("image/jpeg", 0.76);
    if (data.length > 650000) data = c.toDataURL("image/jpeg", 0.48);
    if (data.length > 650000)
      throw Error("La foto supera el tamaño admitido. Elige otra.");
    if (turno === version) foto.value = data;
  } catch (ex) {
    if (turno === version) {
      errorFoto.value = ex.message || "No se pudo leer la foto.";
      e.target.value = "";
    }
  } finally {
    URL.revokeObjectURL(url);
    if (turno === version) procesando.value = false;
  }
}
function publicar() {
  ejecutar(async () => {
    const x = await api("ganado", { ...d, foto: foto.value });
    guardado = true;
    guardarLocal(draftKey, {});
    await cargar();
    avisar("Tu ganado ya está en el catálogo.");
    await router.push("/ganado/" + x.id);
  });
}
</script>
<template>
  <section class="wrap pagina">
    <p class="kicker"><span class="linea"></span> Venta de ganado</p>
    <h1>Publica tu ganado</h1>
    <p class="intro">
      Describe tus animales y define las condiciones que verá el comprador.
    </p>
    <div class="form-layout">
      <form class="surface form-stack" @submit.prevent="publicar">
        <div v-if="Array.isArray(anteriores) && anteriores.length" class="nota">
          <label
            >Recuperar una publicación del Avance 2<select
              v-model="anterior"
              @change="importar"
            >
              <option value="">Selecciona una publicación local</option>
              <option v-for="p in anteriores" :key="p.id" :value="String(p.id)">
                {{ p.titulo }}
              </option>
            </select></label
          >
        </div>
        <h2>Datos del ganado</h2>
        <Campo
          v-model="d.titulo"
          label="Título de la publicación"
          minlength="4"
          maxlength="80"
          required
          placeholder="Ej. Novillas Brahman de levante"
        />
        <div class="form-grid">
          <Campo
            v-model="d.raza"
            label="Raza"
            :options="razas"
            required
          /><Campo
            v-model="d.sexo"
            label="Sexo"
            :options="sexos"
            required
          /><Campo
            v-model="d.edad"
            label="Edad en meses"
            type="number"
            min="1"
            max="300"
            required
          /><Campo
            v-model="d.peso"
            label="Peso por animal en kg"
            type="number"
            min="30"
            max="1500"
            required
          />
        </div>
        <Campo
          v-model="d.descripcion"
          label="Descripción"
          type="textarea"
          rows="4"
          minlength="10"
          maxlength="1000"
          required
          placeholder="Indica el estado, características y condiciones del ganado."
        />
        <div class="campo">
          <label for="foto">Fotografía principal</label>
          <div class="upload-box">
            <ImagePlus :size="26" /><input
              id="foto"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              @change="elegir"
            /><small>JPG, PNG o WebP · Hasta 12 MB</small>
          </div>
          <p v-if="procesando">Optimizando fotografía…</p>
          <p class="fallo" v-if="errorFoto" role="alert">{{ errorFoto }}</p>
          <img
            v-if="foto"
            class="preview-foto"
            :src="foto"
            alt="Vista previa del ganado"
          />
        </div>
        <h2>Condiciones de venta</h2>
        <div class="form-grid">
          <Campo
            v-model="d.tipo"
            label="Tipo de venta"
            :options="modalidades"
            required
          /><Campo
            v-model="d.cantidad"
            label="Cantidad de animales"
            type="number"
            min="1"
            max="500"
            required
          /><Campo
            v-model="d.precio"
            :label="'Precio por ' + unidad(d.tipo) + ' en COP'"
            type="number"
            min="1"
            :max="d.tipo === 'Por kilo en pie' ? 1000000 : 1000000000"
            required
          /><Campo
            v-model="d.fecha"
            label="Disponible desde"
            type="date"
            :min="hoy()"
            required
          /><Campo
            v-model="d.departamento"
            label="Departamento"
            :options="departamentos"
            required
          /><Campo
            v-model="d.municipio"
            label="Municipio"
            minlength="2"
            maxlength="70"
            required
          />
        </div>
        <Campo
          v-model="d.telefono"
          label="Celular para coordinar pedidos"
          type="tel"
          pattern="3[0-9]{9}"
          title="Celular colombiano de 10 dígitos que empieza por 3"
          placeholder="3001234567"
          required
          hint="Se comparte con quienes compren tu ganado."
        />
        <p v-if="error" role="alert" class="alert">{{ error }}</p>
        <button class="btn verde" :disabled="ocupado || procesando">
          <Tag :size="18" />{{ ocupado ? "Publicando…" : "Publicar ganado" }}
        </button>
      </form>
      <aside class="surface side-tip">
        <Camera :size="30" />
        <h2>Una buena publicación</h2>
        <p>
          Toma una foto de perfil con luz natural. Indica cuántos animales
          vendes y comprueba si el precio corresponde al animal, al lote
          completo o al kilo en pie.
        </p>
        <hr />
        <small>{{
          copia
            ? "Los datos del formulario se guardan en este navegador mientras escribes. Vuelve a elegir la foto si recargas."
            : "Tu navegador no permite guardar este borrador."
        }}</small>
      </aside>
    </div>
  </section>
</template>
