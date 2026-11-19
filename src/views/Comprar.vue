<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { MapPin, Handshake, ShoppingBag } from "lucide-vue-next";
import { api, cargar, estado, operacion } from "../store";
import { dinero, hoy, importe, unidad } from "../domain";
import Campo from "../components/Campo.vue";
import EstadoLista from "../components/EstadoLista.vue";
const route = useRoute(),
  router = useRouter(),
  g = ref(null),
  n = ref(1),
  dia = ref(""),
  tel = ref(""),
  acepta = ref(false),
  clave = ref(crypto.randomUUID());
const carga = operacion(),
  { ocupado, error, ejecutar } = operacion();
const minimo = computed(() => [hoy(), g.value?.fecha || ""].sort().at(-1)),
  total = computed(() => (g.value ? importe(g.value, n.value) : 0));
async function cargarFicha() {
  await carga.ejecutar(async () => {
    g.value = await api("ganado/" + route.params.id);
    if (g.value.tipo === "Por lote") n.value = g.value.cantidad;
    dia.value = minimo.value;
  });
}
watch([n, dia, tel], () => (clave.value = crypto.randomUUID()));
function comprar() {
  ejecutar(async () => {
    try {
      const pedido = await api("pedidos", {
        id: clave.value,
        ganado: g.value.id,
        cantidad: n.value,
        telefono: tel.value,
        recogida: dia.value,
      });
      await cargar();
      await router.replace({
        path: "/cuenta",
        query: { tab: "Compras", pedido: pedido.id },
      });
    } catch (e) {
      if (e.status === 409) g.value = await api("ganado/" + route.params.id);
      throw e;
    }
  });
}
onMounted(cargarFicha);
</script>
<template>
  <section class="wrap pagina">
    <RouterLink class="breadcrumb" :to="'/ganado/' + route.params.id"
      >Volver a la ficha</RouterLink
    >
    <h1>Confirmar compra</h1>
    <EstadoLista
      :cargando="carga.ocupado.value"
      :error="carga.error.value"
      @reintentar="cargarFicha"
      ><div class="checkout" v-if="g">
        <form class="surface form-stack" @submit.prevent="comprar">
          <h2>Datos para la recogida</h2>
          <p class="muted">
            El vendedor recibirá estos datos junto con tu pedido.
          </p>
          <template v-if="g.disponibles > 0 && g.vendedor !== estado.user?.id"
            ><Campo
              v-model="n"
              label="Cantidad de animales"
              type="number"
              :min="1"
              :max="g.disponibles"
              required
              :readonly="g.tipo === 'Por lote'"
              :hint="
                g.tipo === 'Por lote'
                  ? 'El lote se vende completo.'
                  : g.disponibles + ' animales disponibles.'
              "
            /><Campo
              v-model="dia"
              label="Fecha para la recogida"
              type="date"
              :min="minimo"
              required
            /><Campo
              v-model="tel"
              label="Tu celular de contacto"
              type="tel"
              pattern="3[0-9]{9}"
              title="Celular colombiano de 10 dígitos que empieza por 3"
              placeholder="3001234567"
              required
            />
            <div class="pago">
              <Handshake :size="24" />
              <div>
                <strong>Pago contra entrega</strong>
                <p>
                  Coordina el punto de recogida con el vendedor. El pago se
                  realiza al recibir el ganado.
                </p>
              </div>
            </div>
            <label class="check"
              ><input type="checkbox" required v-model="acepta" /> Confirmo la
              cantidad, el total y la fecha de recogida.</label
            >
            <p v-if="error" class="alert" role="alert">{{ error }}</p>
            <button class="btn oro" :disabled="ocupado">
              <ShoppingBag :size="18" />{{
                ocupado ? "Registrando…" : "Confirmar mi compra"
              }}
            </button></template
          >
          <p v-else class="nota">
            Esta publicación ya no está disponible para tu compra.
          </p>
        </form>
        <aside class="surface resumen">
          <img :src="g.imagen" :alt="g.titulo" /><span class="kicker"
            >Resumen del pedido</span
          >
          <h2>{{ g.titulo }}</h2>
          <p class="meta"><MapPin :size="15" />{{ g.ubicacion }}</p>
          <dl class="datos">
            <div>
              <dt>Precio por {{ unidad(g.tipo) }}</dt>
              <dd>{{ dinero(g.precio) }}</dd>
            </div>
            <div>
              <dt>Animales</dt>
              <dd>{{ n }}</dd>
            </div>
            <div v-if="g.tipo === 'Por kilo en pie'">
              <dt>Peso por animal</dt>
              <dd>{{ g.peso }} kg</dd>
            </div>
          </dl>
          <p class="total">
            <span>Total COP</span><strong>{{ dinero(total) }}</strong>
          </p>
          <p v-if="g.vendedor === 'muestra'" class="nota">
            Pedido de demostración. Este ejemplar pertenece al catálogo
            académico.
          </p>
        </aside>
      </div></EstadoLista
    >
  </section>
</template>
