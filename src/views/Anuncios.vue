<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  Megaphone,
  Tag,
  Plus,
  MapPin,
  Truck,
  MessageCircle,
  Search,
} from "lucide-vue-next";
import {
  api,
  estado,
  operacion,
  avisar,
  guardarLocal,
  leerLocal,
} from "../store";
import { watch } from "vue";
import { tiposAnuncio } from "../domain";
import Campo from "../components/Campo.vue";
import EstadoLista from "../components/EstadoLista.vue";
const route = useRoute(),
  router = useRouter(),
  tipo = ref("Todos"),
  abrir = ref(false),
  responder = ref(""),
  msg = ref(""),
  lista = ref([]);
const draft = "bovimarket_anuncio_" + (estado.user?.id || "visitante"),
  d = ref({
    ...{ tipo: "Busco ganado", titulo: "", ubicacion: "", mensaje: "" },
    ...leerLocal(draft, {}),
  });
watch(d, (v) => guardarLocal(draft, v), { deep: true });
const a = operacion(),
  { ocupado, error, ejecutar } = operacion();
const filtrados = computed(() =>
  lista.value.filter((x) => tipo.value === "Todos" || x.tipo === tipo.value),
);
const iconos = {
  "Ganado en venta": Tag,
  Transporte: Truck,
  Servicios: Megaphone,
  "Busco ganado": Search,
};
function cargar() {
  return a.ejecutar(async () => (lista.value = await api("anuncios")));
}
function nuevo() {
  if (!estado.user)
    return router.push({
      path: "/acceso",
      query: { volver: "/anuncios?nuevo=1" },
    });
  abrir.value = !abrir.value;
  responder.value = "";
  error.value = "";
}
async function publicar() {
  await ejecutar(async () => {
    await api("anuncios", d.value);
    tipo.value = "Todos";
    abrir.value = false;
    d.value = { tipo: "Busco ganado", titulo: "", ubicacion: "", mensaje: "" };
    await cargar();
    avisar("Anuncio publicado en el tablón.");
  });
}
function contacto(id) {
  if (!estado.user)
    return router.push({
      path: "/acceso",
      query: { volver: "/anuncios?contactar=" + id },
    });
  responder.value = id;
  msg.value = "";
  error.value = "";
}
function enviar(x) {
  ejecutar(async () => {
    await api("mensajes", {
      asunto: x.titulo,
      anuncio: x.id,
      mensaje: msg.value,
    });
    responder.value = "";
    avisar("Mensaje enviado al anunciante.");
  });
}
onMounted(async () => {
  await cargar();
  if (estado.user && route.query.nuevo) abrir.value = true;
  if (estado.user && route.query.contactar)
    responder.value = String(route.query.contactar);
});
</script>
<template>
  <section class="wrap pagina">
    <div class="section-head">
      <div>
        <p class="kicker"><span class="linea"></span> Comunidad ganadera</p>
        <h1>Tablón de anuncios</h1>
        <p class="intro">
          Ofertas de ganado, solicitudes de compra y servicios del campo.
        </p>
      </div>
      <button class="btn oro" @click="nuevo">
        <Plus :size="18" />{{
          abrir ? "Cerrar formulario" : "Publicar anuncio"
        }}
      </button>
    </div>
    <form
      v-if="abrir"
      class="surface form-stack notice-form"
      @submit.prevent="publicar"
    >
      <h2>Nuevo anuncio</h2>
      <div class="form-grid">
        <Campo
          v-model="d.tipo"
          label="Tipo de anuncio"
          :options="tiposAnuncio"
          required
        /><Campo
          v-model="d.ubicacion"
          label="Ubicación"
          minlength="3"
          maxlength="100"
          required
        />
      </div>
      <Campo
        v-model="d.titulo"
        label="Título"
        required
        minlength="4"
        maxlength="80"
      /><Campo
        v-model="d.mensaje"
        label="Mensaje"
        type="textarea"
        rows="3"
        required
        minlength="10"
        maxlength="600"
      />
      <p v-if="error" class="alert" role="alert">{{ error }}</p>
      <button class="btn verde" :disabled="ocupado">
        {{ ocupado ? "Publicando…" : "Publicar en el tablón" }}
      </button>
    </form>
    <div class="tabs">
      <button
        v-for="t in ['Todos', 'Ganado en venta', ...tiposAnuncio]"
        :key="t"
        class="pill"
        :aria-pressed="tipo === t"
        @click="tipo = t"
      >
        {{ t }}
      </button>
    </div>
    <EstadoLista
      :cargando="a.ocupado.value"
      :error="a.error.value"
      @reintentar="cargar"
      ><div class="notice-grid" v-if="filtrados.length">
        <article class="surface anuncio" v-for="x in filtrados" :key="x.id">
          <div class="anuncio-head">
            <span class="icon-square"
              ><component :is="iconos[x.tipo]" :size="23" /></span
            ><span class="kicker">{{ x.tipo }}</span>
          </div>
          <h2>{{ x.titulo }}</h2>
          <span class="meta"><MapPin :size="15" />{{ x.ubicacion }}</span>
          <p>{{ x.mensaje }}</p>
          <small>{{ x.nombre }}</small
          ><RouterLink
            v-if="x.tipo === 'Ganado en venta'"
            class="text-link"
            :to="'/ganado/' + x.id"
            >Ver ganado</RouterLink
          ><button
            v-else-if="x.autor !== estado.user?.id && responder !== x.id"
            class="text-btn"
            @click="contacto(x.id)"
          >
            <MessageCircle :size="16" /> Contactar al anunciante</button
          ><RouterLink
            v-else-if="x.autor === estado.user?.id"
            class="text-link"
            to="/cuenta?tab=Anuncios"
            >Gestionar anuncio</RouterLink
          >
          <form
            v-if="responder === x.id"
            @submit.prevent="enviar(x)"
            class="form-stack"
          >
            <Campo
              v-model="msg"
              label="Tu mensaje"
              type="textarea"
              minlength="10"
              maxlength="1000"
              required
            /><small>El anunciante verá tu correo para responderte.</small>
            <p v-if="error" class="alert">{{ error }}</p>
            <div class="acciones">
              <button class="btn verde compact" :disabled="ocupado">
                Enviar</button
              ><button type="button" class="text-btn" @click="responder = ''">
                Cancelar
              </button>
            </div>
          </form>
        </article>
      </div>
      <div v-else class="empty">
        <h3>Aún no hay anuncios en esta categoría.</h3>
        <p>Puedes publicar el primero.</p>
      </div></EstadoLista
    >
  </section>
</template>
