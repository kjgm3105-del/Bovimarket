<script setup>
import { computed, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { api, estado, operacion, avisar } from "../store";
import Campo from "../components/Campo.vue";
const route = useRoute(),
  router = useRouter(),
  registro = ref(false),
  datos = ref({ nombre: "", correo: "", clave: "" }),
  visible = ref(false),
  { ocupado, error, ejecutar } = operacion();
const destino = computed(() => {
  const r = String(route.query.volver || "");
  return /^\/(?!\/)/.test(r) && !r.includes("\\") ? r : "/cuenta";
});
function enviar() {
  ejecutar(async () => {
    const x = await api(registro.value ? "registro" : "login", datos.value);
    estado.user = x.user;
    estado.sesionLista = true;
    datos.value.clave = "";
    avisar(registro.value ? "Cuenta creada." : "Sesión iniciada.");
    await router.replace(destino.value);
  });
}
</script>
<template>
  <section class="wrap pagina">
    <div class="auth-layout">
      <aside class="auth-photo">
        <img src="/img/agus.webp" alt="Ganado Angus en pradera" />
        <div>
          <span class="kicker">Bovimarket</span>
          <h2>El mercado ganadero, más cerca de ti.</h2>
        </div>
      </aside>
      <div class="surface auth-form">
        <span class="kicker">Tu cuenta Bovimarket</span>
        <template v-if="estado.user"
          ><h1>Hola, {{ estado.user.nombre }}</h1>
          <RouterLink class="btn verde" to="/cuenta"
            >Ver mi cuenta</RouterLink
          ></template
        >
        <template v-else
          ><h1>{{ registro ? "Crea tu cuenta" : "Iniciar sesión" }}</h1>
          <p class="muted">
            {{
              registro
                ? "Regístrate para comprar, vender y publicar anuncios."
                : "Accede a tus publicaciones, compras y ventas."
            }}
          </p>
          <form @submit.prevent="enviar" class="form-stack">
            <Campo
              v-if="registro"
              v-model="datos.nombre"
              label="Nombre"
              required
              minlength="2"
              maxlength="64"
              autocomplete="name"
            /><Campo
              v-model="datos.correo"
              label="Correo electrónico"
              type="email"
              required
              autocomplete="email"
              maxlength="254"
            />
            <Campo
              v-model="datos.clave"
              label="Contraseña"
              :type="visible ? 'text' : 'password'"
              minlength="8"
              maxlength="128"
              :autocomplete="registro ? 'new-password' : 'current-password'"
              required
              :hint="registro ? 'Usa al menos 8 caracteres.' : ''"
            /><label class="check"
              ><input type="checkbox" v-model="visible" /> Mostrar
              contraseña</label
            >
            <p v-if="error" class="alert" role="alert">{{ error }}</p>
            <button class="btn verde" :disabled="ocupado">
              {{
                ocupado
                  ? "Procesando…"
                  : registro
                    ? "Crear cuenta"
                    : "Iniciar sesión"
              }}
            </button>
          </form>
          <p class="auth-switch">
            {{
              registro ? "¿Ya tienes cuenta?" : "¿Primera vez en Bovimarket?"
            }}
            <button
              class="text-btn"
              @click="
                registro = !registro;
                error = '';
                datos.clave = '';
              "
            >
              {{ registro ? "Iniciar sesión" : "Crear cuenta" }}
            </button>
          </p></template
        >
      </div>
    </div>
  </section>
</template>
