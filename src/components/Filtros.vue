<script setup>
import { Search, MapPin, SlidersHorizontal } from "lucide-vue-next";
import { razas } from "../domain";
const m = defineModel({ required: true });
defineProps({ instantaneo: Boolean });
defineEmits(["buscar"]);
</script>
<template>
  <form class="filtros" role="search" @submit.prevent="$emit('buscar')">
    <label
      ><span><SlidersHorizontal :size="15" /> Raza</span
      ><select v-model="m.raza">
        <option value="">Todas las razas</option>
        <option v-for="r in razas" :key="r">{{ r }}</option>
      </select></label
    >
    <label
      ><span><MapPin :size="15" /> Ubicación</span
      ><input
        v-model="m.lugar"
        placeholder="Municipio o departamento"
        maxlength="100"
        type="search"
    /></label>
    <label
      ><span>Precio publicado</span
      ><select v-model="m.rango">
        <option value="">Cualquier precio</option>
        <option value="bajo">Hasta $3 millones</option>
        <option value="medio">Más de $3 a $6 millones</option>
        <option value="alto">Más de $6 millones</option>
      </select></label
    >
    <button class="btn verde" type="submit">
      <Search :size="18" />{{
        instantaneo ? "Ver resultados" : "Buscar ganado"
      }}
    </button>
  </form>
</template>
