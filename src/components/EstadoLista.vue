<script setup>
import { LoaderCircle, CircleAlert } from "lucide-vue-next";
defineProps({ cargando: Boolean, error: String });
defineEmits(["reintentar"]);
</script>
<template>
  <p v-if="cargando" class="panel-feedback" role="status">
    <LoaderCircle class="girar" :size="18" /> Cargando publicaciones…
  </p>
  <div v-else-if="error" class="panel-feedback danger" role="alert">
    <CircleAlert :size="20" />{{ error }}
    <button class="text-btn" @click="$emit('reintentar')">Reintentar</button>
  </div>
  <slot v-else />
</template>
