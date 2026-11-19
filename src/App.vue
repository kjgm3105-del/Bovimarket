<script setup>
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import {
  Menu,
  X,
  UserRound,
  Plus,
  MapPin,
  CheckCircle2,
} from "lucide-vue-next";
import Marca from "./components/Marca.vue";
import { cargar, cargarSesion, estado } from "./store";
const menu = ref(false),
  route = useRoute();
const enlaces = [
  ["/", "Inicio"],
  ["/catalogo", "Comprar ganado"],
  ["/vender", "Vender ganado"],
  ["/anuncios", "Anuncios"],
];
watch(
  () => route.fullPath,
  () => (menu.value = false),
);
onMounted(() => {
  cargar();
  cargarSesion();
});
</script>
<template>
  <a class="saltar" href="#contenido" @click.prevent="$refs.contenido.focus()"
    >Saltar al contenido</a
  >
  <header class="top">
    <div class="wrap barra">
      <Marca />
      <nav class="nav-desktop" aria-label="Principal">
        <RouterLink
          v-for="[url, t] in enlaces"
          :key="url"
          :to="url"
          :class="{ activo: route.path === url }"
          >{{ t }}</RouterLink
        >
      </nav>
      <div class="user-actions">
        <RouterLink class="login-link" :to="estado.user ? '/cuenta' : '/acceso'"
          ><UserRound :size="18" /><span>{{
            estado.user ? "Mi cuenta" : "Iniciar sesión"
          }}</span></RouterLink
        ><RouterLink class="btn oro compact publish-nav" to="/vender"
          ><Plus :size="17" /> Publicar</RouterLink
        >
        <button
          class="mobile-toggle"
          :aria-expanded="menu"
          aria-controls="menu-mobile"
          aria-label="Menú de navegación"
          @click="menu = !menu"
        >
          <component :is="menu ? X : Menu" />
        </button>
      </div>
    </div>
    <nav
      v-if="menu"
      id="menu-mobile"
      class="nav-mobile"
      aria-label="Menú móvil"
    >
      <RouterLink v-for="[url, t] in enlaces" :key="url" :to="url">{{
        t
      }}</RouterLink
      ><RouterLink to="/contacto">Contacto</RouterLink>
    </nav>
  </header>
  <main ref="contenido" id="contenido" tabindex="-1">
    <RouterView v-slot="{ Component, route: r }"
      ><Transition name="vista" mode="out-in"
        ><component :is="Component" :key="r.path" /></Transition
    ></RouterView>
  </main>
  <footer>
    <div class="wrap foot">
      <div>
        <Marca />
        <p>El mercado ganadero, más cerca de ti.</p>
      </div>
      <nav aria-label="Pie de página">
        <RouterLink to="/catalogo">Comprar ganado</RouterLink
        ><RouterLink to="/vender">Vender ganado</RouterLink
        ><RouterLink to="/anuncios">Anuncios</RouterLink
        ><RouterLink to="/contacto">Contacto</RouterLink>
      </nav>
      <small><MapPin :size="15" /> Colombia · Proyecto académico</small>
    </div>
  </footer>
  <Transition name="toast"
    ><div v-if="estado.aviso" class="toast" role="status">
      <CheckCircle2 :size="19" />{{ estado.aviso }}
    </div></Transition
  >
</template>
