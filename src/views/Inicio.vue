<script setup>
import { computed, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  Search,
  Tag,
  Camera,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Handshake,
  Plus,
  BookOpen,
} from "lucide-vue-next";
import { estado, favorito, cargar, api } from "../store";
import { razas, fotosRaza } from "../domain";
import Ficha from "../components/Ficha.vue";
import Filtros from "../components/Filtros.vue";
import EstadoLista from "../components/EstadoLista.vue";
const base = import.meta.env.BASE_URL;
const router = useRouter(),
  filtros = ref({ raza: "", lugar: "", rango: "" });
const fotos = [
  ["image", "Bovinos en pastoreo"],
  ["agus", "Ganado Angus en pradera"],
  ["nerole", "Ejemplar de raza Nelore"],
];
const indice = ref(0);
const destacados = computed(() =>
  estado.ganado.filter((g) => g.disponibles > 0).slice(0, 3),
);
const aviso = ref(null);
onMounted(async () => {
  try {
    aviso.value = (await api("anuncios"))[0];
  } catch {}
});
function buscar() {
  router.push({
    path: "/catalogo",
    query: Object.fromEntries(
      Object.entries(filtros.value).filter(([, v]) => v),
    ),
  });
}
function mover(n) {
  indice.value = (indice.value + n + fotos.length) % fotos.length;
}
</script>
<template>
  <div>
    <section class="portada">
      <div class="wrap">
        <div class="hero">
          <div class="hero-copy">
            <p class="kicker">
              <span class="linea"></span> Mercado ganadero de Colombia
            </p>
            <h1>El mercado<br /><em>ganadero,</em><br />más cerca de ti.</h1>
            <p class="bajada">
              Compra y vende ganado directamente con productores de todo el
              país.
            </p>
            <div class="acciones">
              <RouterLink class="btn verde" to="/catalogo"
                ><Search :size="18" /> Explorar ganado</RouterLink
              ><RouterLink class="btn borde" to="/vender"
                ><Plus :size="18" /> Vender ganado</RouterLink
              >
            </div>
          </div>
          <figure class="hero-img">
            <Transition name="foto"
              ><img
                :key="indice"
                :src="base + 'img/' + fotos[indice][0] + '.webp'"
                :alt="fotos[indice][1]"
                width="675"
                height="453"
                fetchpriority="high"
            /></Transition>
            <figcaption>
              <span><Camera :size="16" /> {{ fotos[indice][1] }}</span
              ><span class="galeria"
                ><button aria-label="Fotografía anterior" @click="mover(-1)">
                  <ChevronLeft :size="19" /></button
                ><button aria-label="Fotografía siguiente" @click="mover(1)">
                  <ChevronRight :size="19" /></button
              ></span>
            </figcaption>
          </figure>
        </div>
        <Filtros v-model="filtros" @buscar="buscar" />
      </div>
    </section>
    <section id="categorias" class="wrap bloque razas">
      <div class="section-head">
        <h2>Explora por raza</h2>
        <RouterLink class="text-link" to="/catalogo"
          >Ver todas las razas</RouterLink
        >
      </div>
      <div class="breed-grid">
        <RouterLink
          v-for="(r, i) in razas"
          :key="r"
          :to="{ path: '/catalogo', query: { raza: r } }"
          class="breed-card"
          ><img
            :src="base + 'img/' + fotosRaza[i] + '.webp'"
            alt=""
            width="90"
            height="90"
            loading="lazy"
          /><span>{{ r }}</span></RouterLink
        >
      </div>
    </section>
    <section id="catalogo" class="catalogo-banda">
      <div class="wrap bloque">
        <div class="section-head">
          <div>
            <p class="kicker"><span class="linea"></span> Compra de ganado</p>
            <h2>Catálogo destacado</h2>
          </div>
          <RouterLink class="text-link" to="/catalogo"
            >Ver catálogo completo</RouterLink
          >
        </div>
        <EstadoLista
          :cargando="estado.cargando"
          :error="estado.error"
          @reintentar="cargar"
          ><div v-if="destacados.length" class="cards">
            <Ficha
              v-for="g in destacados"
              :key="g.id"
              :item="g"
              :guardado="estado.favoritos.includes(g.id)"
              @favorito="favorito"
            />
          </div>
          <p v-else class="empty">Aún no hay ganado disponible.</p></EstadoLista
        >
      </div>
    </section>
    <section class="wrap bloque">
      <div class="section-head">
        <h2>Tablón ganadero</h2>
        <RouterLink class="text-link" to="/anuncios">Ver anuncios</RouterLink>
      </div>
      <div class="tablon-inicio">
        <Megaphone :size="30" />
        <div>
          <span class="kicker">{{
            aviso?.tipo || "Anuncios de la comunidad"
          }}</span>
          <h3>{{ aviso?.titulo || "Compra, transporte y servicios" }}</h3>
          <p>
            {{
              aviso?.ubicacion ||
              "Consulta y publica avisos para otros ganaderos."
            }}
          </p>
        </div>
        <RouterLink
          class="btn borde"
          :to="
            aviso?.tipo === 'Ganado en venta'
              ? '/ganado/' + aviso.id
              : '/anuncios'
          "
          >Leer anuncio</RouterLink
        >
      </div>
    </section>
    <section class="wrap">
      <div class="vender-banner">
        <div>
          <p class="kicker">Para productores</p>
          <h2>Muestra tu ganado a nuevos compradores.</h2>
          <p>Publica tus animales con foto, precio y ubicación.</p>
        </div>
        <RouterLink class="btn oro" to="/vender"
          ><Tag :size="18" /> Publicar mi ganado</RouterLink
        >
      </div>
    </section>
    <section class="wrap bloque" id="como-funciona">
      <div class="section-head"><h2>Cómo funciona</h2></div>
      <div class="pasos">
        <article
          v-for="p in [
            [
              Search,
              'Encuentra tu ganado',
              'Filtra por raza, ubicación y precio.',
            ],
            [
              BookOpen,
              'Revisa la ficha',
              'Consulta el peso, la edad y las condiciones de venta.',
            ],
            [
              Handshake,
              'Confirma tu pedido',
              'Elige una fecha de recogida y paga al recibir.',
            ],
          ]"
          :key="p[1]"
        >
          <component :is="p[0]" :size="25" />
          <h3>{{ p[1] }}</h3>
          <p>{{ p[2] }}</p>
        </article>
      </div>
    </section>
    <section class="wrap faq">
      <h2>Preguntas frecuentes</h2>
      <details>
        <summary>¿Cómo pago mi pedido?</summary>
        <p>
          El pago se acuerda contra entrega. Al confirmar se reserva la cantidad
          y se muestran los datos para coordinar la recogida.
        </p>
      </details>
      <details>
        <summary>¿Cómo sé si vendí un animal?</summary>
        <p>
          Abre Mi cuenta y entra en Ventas. Allí aparecen los pedidos de tus
          publicaciones y el contacto del comprador.
        </p>
      </details>
      <RouterLink class="text-link" to="/contacto"
        >Contactar con Bovimarket</RouterLink
      >
    </section>
  </div>
</template>
