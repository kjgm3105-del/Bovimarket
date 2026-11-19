<script setup>
import { Heart, MapPin, Scale, Clock3 } from "lucide-vue-next";
import { dinero, unidad } from "../domain";
defineProps({ item: { type: Object, required: true }, guardado: Boolean });
defineEmits(["favorito"]);
</script>
<template>
  <article class="ficha">
    <div class="ficha-foto">
      <RouterLink :to="'/ganado/' + item.id" :aria-label="'Ver ' + item.titulo"
        ><img
          :src="item.imagen"
          :alt="item.titulo"
          loading="lazy"
          width="500"
          height="340" /></RouterLink
      ><span class="breed-tag">{{ item.raza }}</span
      ><button
        class="heart"
        :class="{ liked: guardado }"
        :aria-label="
          (guardado ? 'Quitar de' : 'Guardar en') + ' favoritos: ' + item.titulo
        "
        :aria-pressed="guardado"
        @click="$emit('favorito', item.id)"
      >
        <Heart :size="18" :fill="guardado ? 'currentColor' : 'none'" />
      </button>
    </div>
    <div class="ficha-body">
      <span class="meta"><MapPin :size="14" />{{ item.ubicacion }}</span>
      <h3>
        <RouterLink :to="'/ganado/' + item.id">{{ item.titulo }}</RouterLink>
      </h3>
      <div class="ficha-spec">
        <span><Scale :size="15" />{{ item.peso }} kg</span
        ><span><Clock3 :size="15" />{{ item.edad }} meses</span
        ><span>{{ item.sexo }}</span>
      </div>
      <div class="ficha-bottom">
        <strong>{{ dinero(item.precio) }}</strong
        ><small>/ {{ unidad(item.tipo) }}</small
        ><span v-if="!item.disponibles" class="agotado">Agotado</span>
      </div>
    </div>
  </article>
</template>
