<script setup>
import { computed, ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { CheckCircle2, LogOut, Heart, Package } from "lucide-vue-next";
import {
  api,
  estado,
  avisar,
  operacion,
  cargar as cargarCatalogo,
} from "../store";
import { dinero } from "../domain";
import EstadoLista from "../components/EstadoLista.vue";
const route = useRoute(),
  router = useRouter(),
  tabs = ["Compras", "Ventas", "Publicaciones", "Anuncios", "Mensajes"];
const tab = computed(() =>
  tabs.includes(route.query.tab) ? route.query.tab : "Compras",
);
const cuenta = ref({ pedidos: [], ganados: [], anuncios: [], mensajes: [] }),
  carga = operacion(),
  { ocupado, error, ejecutar } = operacion(),
  pendiente = ref(null);
const misPedidos = computed(() =>
  cuenta.value.pedidos.filter((p) =>
    tab.value === "Ventas"
      ? p.vendedor === estado.user?.id
      : p.comprador === estado.user?.id,
  ),
);
const pedidoNuevo = computed(() =>
  cuenta.value.pedidos.find(
    (p) => p.id === route.query.pedido && p.comprador === estado.user?.id,
  ),
);
const fechaHora = (ms) =>
  new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeZone: "America/Bogota",
  }).format(new Date(ms));
async function actualizar() {
  await carga.ejecutar(async () => (cuenta.value = await api("cuenta")));
}
function decidir(path, data, etiqueta) {
  pendiente.value = { path, data, etiqueta };
  error.value = "";
}
function confirmar() {
  const p = pendiente.value;
  ejecutar(async () => {
    await api(p.path, p.data);
    pendiente.value = null;
    await actualizar();
    await cargarCatalogo();
    avisar("Cambio guardado.");
  });
}
function salir() {
  ejecutar(async () => {
    await api("salir", {});
    estado.user = null;
    await router.replace("/");
    avisar("Sesión cerrada.");
  });
}
watch(tab, () => {
  pendiente.value = null;
  error.value = "";
});
onMounted(actualizar);
</script>
<template>
  <section class="wrap pagina">
    <div class="section-head">
      <div>
        <p class="kicker"><span class="linea"></span> Mi cuenta</p>
        <h1>Hola, {{ estado.user?.nombre }}</h1>
      </div>
      <div class="acciones">
        <RouterLink to="/catalogo?favoritos=1" class="btn borde compact"
          ><Heart :size="16" /> Favoritos</RouterLink
        ><button class="text-btn" @click="salir" :disabled="ocupado">
          <LogOut :size="16" /> Salir
        </button>
      </div>
    </div>
    <div v-if="pedidoNuevo" class="success" role="status">
      <CheckCircle2 />
      <div>
        <strong
          >Compra registrada · Pedido
          {{ pedidoNuevo.id.slice(0, 8).toUpperCase() }}</strong
        >
        <p>
          Recogida el {{ pedidoNuevo.recogida }} · Total
          {{ dinero(pedidoNuevo.total) }} · Pago contra entrega.
        </p>
      </div>
    </div>
    <div class="tabs">
      <button
        v-for="t in tabs"
        :key="t"
        :aria-pressed="t === tab"
        class="pill"
        @click="router.replace({ query: { tab: t } })"
      >
        {{ t }}
      </button>
    </div>
    <div v-if="pendiente" class="confirm-box" role="alert">
      <strong>{{ pendiente.etiqueta }}</strong>
      <div class="acciones">
        <button
          class="btn verde compact"
          @click="confirmar"
          :disabled="ocupado"
        >
          Confirmar cambio</button
        ><button class="text-btn" @click="pendiente = null" :disabled="ocupado">
          Volver
        </button>
      </div>
    </div>
    <p v-if="error" class="alert" role="alert">{{ error }}</p>
    <EstadoLista
      :cargando="carga.ocupado.value"
      :error="carga.error.value"
      @reintentar="actualizar"
      ><div v-if="tab === 'Compras' || tab === 'Ventas'" class="cuenta-list">
        <article class="surface history" v-for="p in misPedidos" :key="p.id">
          <div>
            <span class="kicker"
              >Pedido {{ p.id.slice(0, 8).toUpperCase() }} ·
              {{ fechaHora(p.creado) }}</span
            >
            <h2>{{ p.titulo }}</h2>
            <p>
              {{ p.cantidad }} {{ p.cantidad === 1 ? "animal" : "animales" }} ·
              Recogida {{ p.recogida }} · {{ p.ubicacion }}
            </p>
            <p>
              {{ tab === "Compras" ? "Vendedor" : "Comprador" }} ·
              {{ tab === "Compras" ? p.nombreVendedor : p.nombreComprador }}
              <a
                v-if="tab === 'Ventas' || p.telVendedor"
                :href="
                  'tel:+57' + (tab === 'Ventas' ? p.telefono : p.telVendedor)
                "
                >{{ tab === "Ventas" ? p.telefono : p.telVendedor }}</a
              >
            </p>
            <p v-if="p.vendedor === 'muestra'" class="muted">
              Compra de demostración.
            </p>
          </div>
          <div class="hist-actions">
            <span class="status">{{ p.estado }}</span
            ><strong>{{ dinero(p.total) }}</strong>
            <button
              class="text-btn"
              v-if="p.estado === 'Confirmado'"
              @click="
                decidir(
                  'pedidos/' + p.id + '/estado',
                  { estado: 'Cancelado' },
                  '¿Cancelar el pedido y liberar los animales?',
                )
              "
            >
              Cancelar pedido</button
            ><button
              class="btn borde compact"
              v-if="p.estado === 'Confirmado' && tab === 'Ventas'"
              @click="
                decidir(
                  'pedidos/' + p.id + '/estado',
                  { estado: 'Entregado' },
                  '¿Ya entregaste estos animales?',
                )
              "
            >
              Marcar entregado</button
            ><button
              class="btn borde compact"
              v-if="p.estado === 'Entregado' && tab === 'Compras'"
              @click="
                decidir(
                  'pedidos/' + p.id + '/estado',
                  { estado: 'Recibido' },
                  '¿Confirmas que recibiste el ganado?',
                )
              "
            >
              Confirmar recepción
            </button>
          </div>
        </article>
        <div v-if="!misPedidos.length" class="empty">
          <Package />
          <h3>Aún no tienes {{ tab.toLowerCase() }}.</h3>
          <RouterLink
            class="btn verde"
            :to="tab === 'Compras' ? '/catalogo' : '/vender'"
            >{{
              tab === "Compras" ? "Explorar ganado" : "Publicar ganado"
            }}</RouterLink
          >
        </div>
      </div>
      <div class="cuenta-list" v-else-if="tab === 'Publicaciones'">
        <article
          class="surface history"
          v-for="g in cuenta.ganados"
          :key="g.id"
        >
          <div>
            <span class="kicker">{{
              g.visible ? "Publicada" : "Retirada"
            }}</span>
            <h2>
              <RouterLink :to="'/ganado/' + g.id">{{ g.titulo }}</RouterLink>
            </h2>
            <p>
              {{ g.disponibles }} de {{ g.cantidad }} animales disponibles ·
              {{ dinero(g.precio) }}
            </p>
          </div>
          <button
            v-if="g.visible"
            class="text-btn"
            @click="
              decidir(
                'ganado/' + g.id + '/retirar',
                {},
                '¿Retirar esta publicación del catálogo?',
              )
            "
          >
            Retirar publicación
          </button>
        </article>
        <p v-if="!cuenta.ganados.length" class="empty">
          Todavía no has publicado ganado.
        </p>
        <RouterLink class="btn verde" to="/vender">Publicar ganado</RouterLink>
      </div>
      <div class="cuenta-list" v-else-if="tab === 'Anuncios'">
        <article
          class="surface history"
          v-for="a in cuenta.anuncios"
          :key="a.id"
        >
          <div>
            <span class="kicker">{{ a.tipo }}</span>
            <h2>{{ a.titulo }}</h2>
            <p>{{ a.mensaje }}</p>
          </div>
          <button
            class="text-btn"
            @click="
              decidir(
                'anuncios/' + a.id + '/retirar',
                {},
                '¿Retirar este anuncio del tablón?',
              )
            "
          >
            Retirar anuncio
          </button>
        </article>
        <p v-if="!cuenta.anuncios.length" class="empty">
          Aún no has publicado anuncios de comunidad.
        </p>
        <RouterLink to="/anuncios?nuevo=1" class="btn verde"
          >Publicar anuncio</RouterLink
        >
      </div>
      <div class="cuenta-list" v-else>
        <article
          v-for="m in cuenta.mensajes"
          :key="m.id"
          class="surface mensaje"
        >
          <span class="kicker"
            >{{ m.emisor === estado.user?.id ? "Enviado" : "Recibido" }} ·
            {{ fechaHora(m.creado) }}</span
          >
          <h2>{{ m.asunto }}</h2>
          <p>{{ m.mensaje }}</p>
          <p v-if="m.receptor === estado.user?.id">
            De {{ m.nombre }} ·
            <a :href="'mailto:' + m.correo">{{ m.correo }}</a>
          </p>
        </article>
        <p v-if="!cuenta.mensajes.length" class="empty">
          Los mensajes enviados y recibidos aparecerán aquí.
        </p>
      </div></EstadoLista
    >
  </section>
</template>
