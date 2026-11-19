<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { Heart, MapPin, UserRound, ShoppingBag } from "lucide-vue-next";
import { fotoGanado, api, estado, favorito, operacion } from "../store";
import { dinero, unidad } from "../domain";
import EstadoLista from "../components/EstadoLista.vue";
const route = useRoute(),
  g = ref(null),
  { ocupado, error, ejecutar } = operacion();
const cargar = () =>
  ejecutar(async () => {
    g.value = await api("ganado/" + route.params.id);
  });
onMounted(cargar);
</script>
<template>
  <section class="wrap pagina">
    <RouterLink to="/catalogo" class="breadcrumb">Catálogo de ganado</RouterLink
    ><EstadoLista :cargando="ocupado" :error="error" @reintentar="cargar"
      ><div v-if="g" class="detalle">
        <div>
          <img class="detail-photo" :src="fotoGanado(g.imagen)" :alt="g.titulo" />
          <div class="surface descripcion">
            <h2>Descripción</h2>
            <p>{{ g.descripcion }}</p>
          </div>
        </div>
        <article class="surface detail-info">
          <span class="kicker">{{ g.raza }} · {{ g.sexo }}</span>
          <h1>{{ g.titulo }}</h1>
          <p class="meta"><MapPin :size="16" />{{ g.ubicacion }}</p>
          <p class="detail-price">
            {{ dinero(g.precio) }} <small>/ {{ unidad(g.tipo) }}</small>
          </p>
          <dl class="datos">
            <div
              v-for="[k, v] in [
                ['Peso por animal', g.peso + ' kg'],
                ['Edad', g.edad + ' meses'],
                ['Disponibles', g.disponibles + ' de ' + g.cantidad],
                ['Tipo de venta', g.tipo],
                ['Disponible desde', g.fecha],
              ]"
              :key="k"
            >
              <dt>{{ k }}</dt>
              <dd>{{ v }}</dd>
            </div>
          </dl>
          <p class="meta"><UserRound :size="17" /> {{ g.nombre }}</p>
          <p v-if="g.vendedor === 'muestra'" class="nota">
            Ganado de muestra para practicar una compra académica.
          </p>
          <RouterLink
            v-if="
              g.visible && g.disponibles > 0 && g.vendedor !== estado.user?.id
            "
            :to="'/ganado/' + g.id + '/comprar'"
            class="btn oro"
            ><ShoppingBag :size="18" /> Comprar ganado</RouterLink
          >
          <p v-else class="nota">
            {{
              g.vendedor === estado.user?.id
                ? "Esta es una de tus publicaciones."
                : "Esta publicación no tiene existencias disponibles."
            }}
          </p>
          <button
            class="btn borde"
            :aria-pressed="estado.favoritos.includes(g.id)"
            @click="favorito(g.id)"
          >
            <Heart :size="17" />
            {{
              estado.favoritos.includes(g.id)
                ? "Quitar de favoritos"
                : "Guardar en favoritos"
            }}
          </button>
        </article>
      </div></EstadoLista
    >
  </section>
</template>
