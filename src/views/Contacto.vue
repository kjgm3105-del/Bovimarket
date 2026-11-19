<script setup>
import { ref, watch } from "vue";
import { MessageCircle } from "lucide-vue-next";
import Campo from "../components/Campo.vue";
import { api, estado, leerLocal, guardarLocal, operacion } from "../store";
const key = "bovimarket_contacto_borrador_" + (estado.user?.id || "visitante"),
  base = {
    nombre: estado.user?.nombre || "",
    correo: estado.user?.correo || "",
    asunto: "",
    mensaje: "",
  };
const d = ref({ ...base, ...leerLocal(key, {}) }),
  enviado = ref(""),
  { error, ocupado, ejecutar } = operacion();
watch(d, (v) => guardarLocal(key, v), { deep: true });
function enviar() {
  ejecutar(async () => {
    const r = await api("mensajes", d.value);
    enviado.value = r.id.slice(0, 8).toUpperCase();
    d.value = { ...base };
  });
}
</script>
<template>
  <section class="wrap pagina">
    <p class="kicker"><span class="linea"></span> Contacto</p>
    <h1>Escríbenos</h1>
    <p class="intro">
      Envía una consulta a Bovimarket sobre compras, ventas o la plataforma.
    </p>
    <div class="form-layout">
      <form class="surface form-stack" @submit.prevent="enviar">
        <div class="form-grid">
          <Campo
            v-model="d.nombre"
            label="Nombre"
            required
            minlength="2"
            maxlength="64"
            :readonly="!!estado.user"
            autocomplete="name"
          /><Campo
            v-model="d.correo"
            label="Correo electrónico"
            required
            type="email"
            maxlength="254"
            :readonly="!!estado.user"
            autocomplete="email"
          />
        </div>
        <Campo
          v-model="d.asunto"
          label="Asunto"
          :options="[
            'Quiero comprar ganado',
            'Quiero vender ganado',
            'Soporte',
          ]"
          required
        /><Campo
          v-model="d.mensaje"
          label="Mensaje"
          type="textarea"
          rows="5"
          minlength="10"
          maxlength="1000"
          required
        />
        <p v-if="enviado" class="success" role="status">
          Consulta registrada con el código {{ enviado }}.
        </p>
        <p v-if="error" class="alert" role="alert">{{ error }}</p>
        <button class="btn verde" :disabled="ocupado">
          {{ ocupado ? "Enviando…" : "Enviar consulta" }}
        </button>
      </form>
      <aside class="surface side-tip">
        <MessageCircle />
        <h2>¿Ya hiciste un pedido?</h2>
        <p>
          En Mi cuenta encontrarás el contacto de la otra parte y los datos para
          coordinar la entrega.
        </p>
        <RouterLink class="text-link" to="/cuenta">Ir a mi cuenta</RouterLink>
      </aside>
    </div>
  </section>
</template>
