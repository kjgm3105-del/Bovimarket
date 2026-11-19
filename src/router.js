import { createRouter, createWebHashHistory } from "vue-router";
import { cargarSesion, estado } from "./store";
import Inicio from "./views/Inicio.vue";
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "Inicio", component: Inicio },
    {
      path: "/catalogo",
      name: "Comprar ganado",
      component: () => import("./views/Catalogo.vue"),
    },
    {
      path: "/ganado/:id",
      name: "Ficha de ganado",
      component: () => import("./views/Detalle.vue"),
    },
    {
      path: "/ganado/:id/comprar",
      name: "Comprar",
      meta: { privado: true },
      component: () => import("./views/Comprar.vue"),
    },
    {
      path: "/vender",
      name: "Vender ganado",
      meta: { privado: true },
      component: () => import("./views/Vender.vue"),
    },
    {
      path: "/acceso",
      name: "Acceso",
      component: () => import("./views/Acceso.vue"),
    },
    {
      path: "/cuenta",
      name: "Mi cuenta",
      meta: { privado: true },
      component: () => import("./views/Cuenta.vue"),
    },
    {
      path: "/anuncios",
      name: "Anuncios",
      component: () => import("./views/Anuncios.vue"),
    },
    {
      path: "/contacto",
      name: "Contacto",
      component: () => import("./views/Contacto.vue"),
    },
    {
      path: "/:pathMatch(.*)*",
      name: "Página no encontrada",
      component: () => import("./views/NoExiste.vue"),
    },
  ],
  scrollBehavior(to, from, saved) {
    if (to.hash)
      return new Promise((r) =>
        setTimeout(() => r({ el: to.hash, top: 24 }), 60),
      );
    if (saved) return saved;
    if (to.path !== from.path) return { top: 0 };
  },
});
router.beforeEach(async (to) => {
  await cargarSesion();
  if (to.meta.privado) {
    if (!estado.user)
      return { path: "/acceso", query: { volver: to.fullPath } };
  }
});
router.afterEach((to) => (document.title = to.name + " · Bovimarket"));
