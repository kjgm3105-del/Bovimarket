<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Heart, RotateCcw } from "lucide-vue-next";
import { normalizar } from "../domain";
import { estado, cargar, favorito } from "../store";
import Filtros from "../components/Filtros.vue";
import Ficha from "../components/Ficha.vue";
import EstadoLista from "../components/EstadoLista.vue";
const route = useRoute(),
  router = useRouter(),
  f = ref({}),
  orden = ref("nuevos"),
  soloFav = ref(false),
  soloDisponibles = ref(true);
watch(
  () => route.query,
  (q) => {
    f.value = {
      raza: String(q.raza || ""),
      lugar: String(q.lugar || ""),
      rango: String(q.rango || ""),
    };
    soloFav.value = q.favoritos === "1";
  },
  { immediate: true },
);
const lista = computed(() => {
  const { raza, lugar, rango } = f.value;
  const items = estado.ganado.filter(
    (g) =>
      (!raza || g.raza === raza) &&
      normalizar(g.ubicacion).includes(normalizar(lugar)) &&
      (!rango ||
        (rango === "bajo" && g.precio <= 3000000) ||
        (rango === "medio" && g.precio > 3000000 && g.precio <= 6000000) ||
        (rango === "alto" && g.precio > 6000000)) &&
      (!soloFav.value || estado.favoritos.includes(g.id)) &&
      (!soloDisponibles.value || g.disponibles > 0),
  );
  if (orden.value === "asc") items.sort((a, b) => a.precio - b.precio);
  if (orden.value === "desc") items.sort((a, b) => b.precio - a.precio);
  return items;
});
function aplicar() {
  router.replace({
    query: Object.fromEntries(
      Object.entries({
        ...f.value,
        favoritos: soloFav.value ? "1" : "",
      }).filter(([, v]) => v),
    ),
  });
}
function limpiar() {
  f.value = { raza: "", lugar: "", rango: "" };
  soloFav.value = false;
  soloDisponibles.value = true;
  orden.value = "nuevos";
  aplicar();
}
</script>
<template>
  <section class="wrap pagina">
    <p class="kicker"><span class="linea"></span> Mercado ganadero</p>
    <h1>Comprar ganado</h1>
    <p class="intro">
      Compara los animales disponibles y encuentra el que buscas.
    </p>
    <Filtros v-model="f" instantaneo @buscar="aplicar" />
    <div class="toolbar">
      <strong aria-live="polite"
        >{{ lista.length }}
        {{ lista.length === 1 ? "publicación" : "publicaciones" }}</strong
      ><label class="check"
        ><input type="checkbox" v-model="soloDisponibles" /> Disponibles</label
      ><button
        class="pill"
        :aria-pressed="soloFav"
        @click="
          soloFav = !soloFav;
          aplicar();
        "
      >
        <Heart :size="16" /> Favoritos</button
      ><select v-model="orden" aria-label="Ordenar catálogo">
        <option value="nuevos">Más recientes</option>
        <option value="asc">Menor precio</option>
        <option value="desc">Mayor precio</option></select
      ><button class="text-btn" @click="limpiar">
        <RotateCcw :size="15" /> Limpiar
      </button>
    </div>
    <EstadoLista
      :cargando="estado.cargando"
      :error="estado.error"
      @reintentar="cargar"
      ><div v-if="lista.length" class="cards">
        <Ficha
          v-for="g in lista"
          :key="g.id"
          :item="g"
          :guardado="estado.favoritos.includes(g.id)"
          @favorito="favorito"
        />
      </div>
      <div class="empty" v-else>
        <h3>No encontramos publicaciones.</h3>
        <p>Prueba otra ubicación o cambia los filtros.</p>
        <button class="btn borde" @click="limpiar">Ver todo el ganado</button>
      </div></EstadoLista
    >
  </section>
</template>
