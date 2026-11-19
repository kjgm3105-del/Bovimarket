import { test } from "node:test";
import assert from "node:assert/strict";
import { abrirDB } from "./local.mjs";
import { api } from "./api.js";
import { hoy } from "../src/domain.js";

function escenario(t) {
  const db = abrirDB(":memory:");
  t.after(() => db.close());
  async function llamar(path, body, cookie = "", status = 200) {
    const req = new Request("https://bovi.test/api/" + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        cookie,
        "Content-Type": "application/json",
        Origin: "https://bovi.test",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const r = await api(req, db),
      data = await r.json();
    assert.equal(r.status, status, path + " " + JSON.stringify(data));
    return { data, cookie: r.headers.get("set-cookie")?.split(";")[0] };
  }
  async function cuenta(nombre) {
    return llamar(
      "registro",
      { nombre, correo: nombre + "@example.test", clave: "prueba-local-2026" },
      "",
      201,
    );
  }
  return { llamar, cuenta, db };
}
const ficha = (props = {}) => ({
  titulo: "Novillas de prueba",
  municipio: "Chinú",
  departamento: "Córdoba",
  telefono: "3000000000",
  raza: "Brahman",
  sexo: "Hembra",
  edad: 18,
  peso: 320,
  cantidad: 2,
  tipo: "Por animal",
  precio: 1200000,
  fecha: hoy(),
  descripcion: "Publicación de prueba local.",
  ...props,
});
const pedido = (id, props = {}) => ({
  id: crypto.randomUUID(),
  ganado: id,
  cantidad: 1,
  recogida: hoy(),
  telefono: "3100000000",
  ...props,
});
test("Registro, inicio y cierre de sesión, privacidad de la cuenta y errores HTTP", async (t) => {
  const { llamar, cuenta } = escenario(t),
    v = await cuenta("Vendedor");
  assert.equal(
    (await llamar("sesion", undefined, v.cookie)).data.user.nombre,
    "Vendedor",
  );
  await llamar(
    "registro",
    {
      nombre: "Otra",
      correo: "Vendedor@example.test",
      clave: "prueba-local-2026",
    },
    "",
    409,
  );
  await llamar(
    "login",
    { correo: "Vendedor@example.test", clave: "incorrecta" },
    "",
    401,
  );
  const logged = await llamar("login", {
    correo: "Vendedor@example.test",
    clave: "prueba-local-2026",
  });
  await llamar("salir", {}, logged.cookie);
  await llamar("cuenta", undefined, logged.cookie, 401);
  await llamar("ganado/desconocido", undefined, "", 404);
  await llamar("ganado", ficha(), "", 401);
});
test("Compra entre dos cuentas, precio del servidor, idempotencia, cancelación y entrega", async (t) => {
  const { llamar, cuenta } = escenario(t),
    v = await cuenta("Vendedor"),
    c = await cuenta("Comprador"),
    otro = await cuenta("Tercero");
  const { data: g } = await llamar("ganado", ficha(), v.cookie, 201);
  const pub = (await llamar("ganado/" + g.id)).data;
  assert.equal(pub.disponibles, 2);
  assert.equal(pub.telefono, undefined);
  await llamar("pedidos", pedido(g.id), v.cookie, 409);
  const d = pedido(g.id, { cantidad: 2, total: 1 });
  const { data: p } = await llamar("pedidos", d, c.cookie, 201);
  assert.equal(p.total, 2400000);
  await llamar("pedidos", d, c.cookie);
  assert.equal((await llamar("ganado/" + g.id)).data.disponibles, 0);
  await llamar("pedidos", pedido(g.id), otro.cookie, 409);
  assert.equal(
    (await llamar("cuenta", undefined, v.cookie)).data.pedidos[0].comprador,
    c.data.user.id,
  );
  assert.equal(
    (await llamar("cuenta", undefined, otro.cookie)).data.pedidos.length,
    0,
  );
  await llamar(
    "pedidos/" + p.id + "/estado",
    { estado: "Cancelado" },
    otro.cookie,
    409,
  );
  await llamar(
    "pedidos/" + p.id + "/estado",
    { estado: "Cancelado" },
    c.cookie,
  );
  assert.equal((await llamar("ganado/" + g.id)).data.disponibles, 2);
  const segundo = (await llamar("pedidos", pedido(g.id), c.cookie, 201)).data;
  await llamar(
    "pedidos/" + segundo.id + "/estado",
    { estado: "Entregado" },
    v.cookie,
  );
  await llamar(
    "pedidos/" + segundo.id + "/estado",
    { estado: "Recibido" },
    c.cookie,
  );
  await llamar(
    "pedidos/" + segundo.id + "/estado",
    { estado: "Cancelado" },
    c.cookie,
    409,
  );
});
test("Dos compras simultáneas del último lote, cálculo por kg y retirada", async (t) => {
  const { llamar, cuenta, db } = escenario(t),
    v = await cuenta("Vendedor"),
    c = await cuenta("Comprador");
  const lote = (
    await llamar("ganado", ficha({ tipo: "Por lote" }), v.cookie, 201)
  ).data;
  await llamar("pedidos", pedido(lote.id), c.cookie, 409);
  const comprar = () =>
    api(
      new Request("https://bovi.test/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: c.cookie },
        body: JSON.stringify(pedido(lote.id, { cantidad: 2 })),
      }),
      db,
    );
  const resultados = await Promise.all([comprar(), comprar()]);
  assert.deepEqual(resultados.map((x) => x.status).sort(), [201, 409]);
  assert.equal(
    (await resultados.find((x) => x.status === 201).json()).total,
    1200000,
  );
  const kilo = (
    await llamar(
      "ganado",
      ficha({ tipo: "Por kilo en pie", precio: 10000 }),
      v.cookie,
      201,
    )
  ).data;
  assert.equal(
    (await llamar("pedidos", pedido(kilo.id, { cantidad: 2 }), c.cookie, 201))
      .data.total,
    6400000,
  );
  await llamar("ganado/" + lote.id + "/retirar", {}, c.cookie, 404);
  await llamar("ganado/" + lote.id + "/retirar", {}, v.cookie);
  await llamar("ganado/" + lote.id, undefined, "", 404);
});
test("Anuncios, bandeja de mensajes, soporte y validación de campos", async (t) => {
  const { llamar, cuenta } = escenario(t),
    v = await cuenta("Autora"),
    c = await cuenta("Lector");
  await llamar("ganado", ficha({ peso: -1 }), v.cookie, 422);
  const aviso = (
    await llamar(
      "anuncios",
      {
        titulo: "Transporte ganadero",
        tipo: "Transporte",
        ubicacion: "Montería",
        mensaje: "Transporte disponible en Córdoba.",
      },
      v.cookie,
      201,
    )
  ).data;
  assert.ok((await llamar("anuncios")).data.some((x) => x.id === aviso.id));
  await llamar(
    "mensajes",
    {
      anuncio: aviso.id,
      asunto: "Transporte",
      mensaje: "Quisiera conocer la ruta.",
    },
    c.cookie,
    201,
  );
  assert.equal(
    (await llamar("cuenta", undefined, v.cookie)).data.mensajes[0].correo,
    c.data.user.correo,
  );
  await llamar("anuncios/" + aviso.id + "/retirar", {}, c.cookie, 404);
  await llamar("anuncios/" + aviso.id + "/retirar", {}, v.cookie);
  assert.ok(!(await llamar("anuncios")).data.some((x) => x.id === aviso.id));
  await llamar(
    "mensajes",
    {
      asunto: "Soporte",
      nombre: "Invitado",
      correo: "prueba@example.test",
      mensaje: "Consulta de demostración.",
    },
    "",
    201,
  );
});

test("GitHub Pages registra y recupera la sesión sin cookies de terceros", async (t) => {
  const { db } = escenario(t);
  const origen = "https://kjgm3105-del.github.io";
  async function pages(path, method, body, headers = {}) {
    return api(
      new Request("https://bovi.test/api/" + path, {
        method,
        headers: {
          Origin: origen,
          "Content-Type": "application/json",
          ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      db,
      origen,
    );
  }
  const previo = await pages("registro", "OPTIONS");
  assert.equal(previo.status, 204);
  assert.equal(previo.headers.get("Access-Control-Allow-Origin"), origen);
  const registro = await pages("registro", "POST", {
    nombre: "Compradora",
    correo: "pages@example.test",
    clave: "prueba-local-2026",
  });
  assert.equal(registro.status, 201);
  assert.equal(registro.headers.get("Set-Cookie"), null);
  const { sesion, user } = await registro.json();
  const auth = { "X-Bovimarket-Sesion": sesion };
  const cuentaActual = await pages("sesion", "GET", undefined, auth);
  assert.equal((await cuentaActual.json()).user.id, user.id);
  const cookieAjena = await pages("sesion", "GET", undefined, {
    cookie: "bovi_sesion=" + sesion,
  });
  assert.equal((await cookieAjena.json()).user, null);
  const denegado = await pages(
    "anuncios",
    "POST",
    {},
    { Origin: "https://otro.example", ...auth },
  );
  assert.equal(denegado.status, 403);
  assert.equal(denegado.headers.get("Access-Control-Allow-Origin"), null);
  const compra = await pages("pedidos", "POST", pedido("demo-1"), auth);
  assert.equal(compra.status, 201);
  assert.equal((await pages("salir", "POST", {}, auth)).status, 200);
  assert.equal((await pages("cuenta", "GET", undefined, auth)).status, 401);
});
