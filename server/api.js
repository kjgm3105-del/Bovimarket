import {
  razas,
  sexos,
  modalidades,
  tiposAnuncio,
  hoy,
  departamentos,
} from "../src/domain.js";
import { prepararEjemplos } from "./seed.js";
import {
  secreto,
  derivar,
  sesion,
  cookie,
  nuevaSesion,
  permitirIntento,
} from "./auth.js";

class Problema extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
function exigir(condicion, status, mensaje) {
  if (!condicion) throw new Problema(status, mensaje);
}
const json = (data, status = 200, headers = {}) =>
  Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
const texto = (v, min, max, etiqueta) => {
  const valor = typeof v === "string" ? v.trim() : "";
  exigir(
    valor.length >= min && valor.length <= max,
    422,
    "Revisa el campo " + etiqueta + ".",
  );
  return valor;
};
function numero(v, min, max, nombre) {
  exigir(
    Number.isSafeInteger(v) && v >= min && v <= max,
    422,
    "Revisa " + nombre + ".",
  );
  return v;
}
function opcion(v, lista) {
  exigir(lista.includes(v), 422, "Selecciona una opción válida.");
  return v;
}
function correo(v) {
  const mail = texto(v, 5, 254, "correo").toLowerCase();
  exigir(
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail),
    422,
    "Escribe un correo electrónico válido.",
  );
  return mail;
}
function telefono(v) {
  exigir(
    /^3\d{9}$/.test(v),
    422,
    "Escribe un celular colombiano de 10 dígitos.",
  );
  return String(v);
}
function fecha(v) {
  const ok =
    typeof v === "string" &&
    /^\d{4}-\d\d-\d\d$/.test(v) &&
    !isNaN(Date.parse(v)) &&
    new Date(v).toISOString().slice(0, 10) === v;
  exigir(ok && v >= hoy(), 422, "Selecciona una fecha válida desde hoy.");
  return v;
}
async function cuerpo(req) {
  exigir(
    (req.headers.get("content-type") || "").startsWith("application/json"),
    415,
    "Se esperaba una solicitud JSON.",
  );
  const reader = req.body?.getReader();
  exigir(reader, 400, "Faltan los datos.");
  const bytes = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    exigir(size <= 700000, 413, "La fotografía es demasiado grande.");
    bytes.push(value);
  }
  try {
    const data = JSON.parse(await new Blob(bytes).text());
    exigir(
      data && typeof data === "object" && !Array.isArray(data),
      400,
      "Datos inválidos.",
    );
    return data;
  } catch {
    throw new Problema(400, "No se pudieron leer los datos.");
  }
}
const libres = `g.cantidad-COALESCE((SELECT SUM(p.cantidad) FROM pedidos p WHERE p.ganado=g.id AND p.estado!='Cancelado'),0)`;
const catalogo = `SELECT g.id,g.vendedor,g.nombre,g.titulo,g.raza,g.sexo,g.edad,g.peso,g.cantidad,g.tipo,g.precio,
  g.ubicacion,g.fecha,g.descripcion,g.imagen,g.visible,g.creado,(${libres}) AS disponibles FROM ganado g`;
const list = async (stmt) => (await stmt.all()).results;
const uuid = () => crypto.randomUUID();
const consulta = (db, sql, params = []) =>
  params.length ? db.prepare(sql).bind(...params) : db.prepare(sql);
const insert = (db, table, data) =>
  consulta(
    db,
    "INSERT INTO " +
      table +
      " (" +
      Object.keys(data).join(",") +
      ") VALUES (" +
      Object.keys(data)
        .map(() => "?")
        .join(",") +
      ")",
    Object.values(data),
  );
async function mercado(req, db) {
  const url = new URL(req.url),
    path = url.pathname.replace(/^\/api\/?/, "").replace(/\/$/, "");
  const [ruta, id, accion] = path.split("/"),
    post = req.method === "POST";
  exigir(req.method === "GET" || post, 405, "Método no permitido.");
  if (post) {
    const origin = req.headers.get("origin");
    exigir(
      !origin || origin === url.origin,
      403,
      "Origen de la solicitud inválido.",
    );
  }
  await prepararEjemplos(db);
  const { user, token } = await sesion(db, req);
  const identificado = () => {
    exigir(user, 401, "Inicia sesión para continuar.");
    return user;
  };
  if (!post && path === "sesion") return json({ user: user || null });
  if (post && ["registro", "login"].includes(path)) {
    const data = await cuerpo(req),
      mail = correo(data.correo),
      clave = data.clave;
    exigir(
      typeof clave === "string" && clave.length >= 8 && clave.length <= 128,
      422,
      "La contraseña debe tener entre 8 y 128 caracteres.",
    );
    const ip = req.headers.get("cf-connecting-ip") || "local";
    exigir(
      await permitirIntento(db, path + "|" + ip + "|" + mail, 18),
      429,
      "Demasiados intentos. Prueba de nuevo en 10 minutos.",
    );
    let cuenta;
    if (path === "registro") {
      const nombre = texto(data.nombre, 2, 64, "nombre"),
        sal = secreto();
      cuenta = { id: uuid(), correo: mail, nombre };
      const row = await db
        .prepare(
          "INSERT INTO usuarios (id,correo,nombre,sal,clave) VALUES (?,?,?,?,?) ON CONFLICT(correo) DO NOTHING RETURNING id",
        )
        .bind(cuenta.id, mail, nombre, sal, await derivar(clave, sal))
        .first();
      exigir(row, 409, "Este correo ya está registrado.");
    } else {
      cuenta = await db
        .prepare("SELECT * FROM usuarios WHERE correo=?")
        .bind(mail)
        .first();
      const hash = await derivar(
        clave,
        cuenta?.sal || "bovimarket-sesion-invalida",
      );
      exigir(
        cuenta && cuenta.clave === hash,
        401,
        "El correo o la contraseña son incorrectos.",
      );
    }
    return json(
      { user: { id: cuenta.id, correo: mail, nombre: cuenta.nombre } },
      path === "registro" ? 201 : 200,
      { "Set-Cookie": await nuevaSesion(db, req, cuenta.id) },
    );
  }
  if (post && path === "salir") {
    await cuerpo(req);
    if (token)
      await db.prepare("DELETE FROM sesiones WHERE token=?").bind(token).run();
    return json({ ok: true }, 200, { "Set-Cookie": cookie(req, "", 0) });
  }
  if (!post && ruta === "foto" && id) {
    const row = await db
      .prepare("SELECT contenido FROM fotos WHERE id=?")
      .bind(id)
      .first();
    exigir(row, 404, "Fotografía no encontrada.");
    const bytes = Uint8Array.from(atob(row.contenido), (c) => c.charCodeAt(0));
    return new Response(bytes, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
  if (!post && path === "ganado")
    return json(
      await list(
        db.prepare(catalogo + " WHERE g.visible=1 ORDER BY g.creado DESC"),
      ),
    );
  if (!post && ruta === "ganado" && id) {
    const row = await db
      .prepare(catalogo + " WHERE g.id=? AND (g.visible=1 OR g.vendedor=?)")
      .bind(id, user?.id || "")
      .first();
    exigir(row, 404, "Esta publicación ya no está disponible.");
    return json(row);
  }
  if (post && path === "ganado") {
    identificado();
    const d = await cuerpo(req),
      animal = uuid(),
      fotoId = uuid();
    const ubicacion =
      texto(d.municipio, 2, 70, "municipio") +
      ", " +
      opcion(d.departamento, departamentos);
    const datos = {
      id: animal,
      vendedor: user.id,
      nombre: user.nombre,
      telefono: telefono(d.telefono),
      titulo: texto(d.titulo, 4, 80, "título"),
      raza: opcion(d.raza, razas),
      sexo: opcion(d.sexo, sexos),
      edad: numero(d.edad, 1, 300, "la edad"),
      peso: numero(d.peso, 30, 1500, "el peso"),
      cantidad: numero(d.cantidad, 1, 500, "la cantidad"),
      tipo: opcion(d.tipo, modalidades),
      precio: numero(
        d.precio,
        1,
        d.tipo === "Por kilo en pie" ? 1000000 : 1000000000,
        "el precio",
      ),
      ubicacion,
      fecha: fecha(d.fecha),
      descripcion: texto(d.descripcion, 10, 1000, "descripción"),
      imagen: "/img/sin-foto.svg",
      creado: Date.now(),
    };
    const batch = [];
    if (d.foto) {
      exigir(
        typeof d.foto === "string" &&
          /^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/=]+$/.test(d.foto) &&
          d.foto.length <= 650000,
        422,
        "Selecciona una foto JPG, PNG o WebP válida.",
      );
      datos.imagen = "/api/foto/" + fotoId;
      batch.push(
        insert(db, "fotos", { id: fotoId, contenido: d.foto.split(",")[1] }),
      );
    }
    batch.push(insert(db, "ganado", datos));
    await db.batch(batch);
    return json({ id: animal }, 201);
  }
  if (post && ruta === "ganado" && accion === "retirar") {
    identificado();
    await cuerpo(req);
    const row = await db
      .prepare(
        "UPDATE ganado SET visible=0 WHERE vendedor=? AND id=? AND visible=1 RETURNING id",
      )
      .bind(user.id, id)
      .first();
    exigir(row, 404, "La publicación no está activa.");
    return json(row);
  }
  if (post && path === "pedidos") {
    identificado();
    const d = await cuerpo(req),
      key = texto(d.id, 36, 36, "identificador");
    exigir(
      /^[a-f0-9-]{36}$/i.test(key),
      422,
      "Identificador de pedido inválido.",
    );
    const n = numero(d.cantidad, 1, 500, "la cantidad"),
      tel = telefono(d.telefono),
      dia = fecha(d.recogida),
      item = texto(d.ganado, 1, 80, "publicación");
    // Un único INSERT condicional decide el precio y la disponibilidad dentro de la misma escritura.
    const row = await db
      .prepare(
        `INSERT INTO pedidos (id,comprador,ganado,cantidad,total,telefono,recogida,estado,creado)
      SELECT ?,?,g.id,?,g.precio * CASE g.tipo WHEN 'Por lote' THEN 1 WHEN 'Por kilo en pie' THEN ?*g.peso ELSE ? END,
      ?,?,'Confirmado',? FROM ganado g WHERE g.id=? AND g.visible=1 AND g.vendedor!=? AND g.fecha<=?
      AND (${libres})>=? AND (g.tipo!='Por lote' OR g.cantidad=?) ON CONFLICT(id) DO NOTHING RETURNING *`,
      )
      .bind(
        key,
        user.id,
        n,
        n,
        n,
        tel,
        dia,
        Date.now(),
        item,
        user.id,
        dia,
        n,
        n,
      )
      .first();
    if (row) return json(row, 201);
    const anterior = await db
      .prepare(
        "SELECT * FROM pedidos WHERE id=? AND comprador=? AND ganado=? AND cantidad=? AND telefono=? AND recogida=?",
      )
      .bind(key, user.id, item, n, tel, dia)
      .first();
    exigir(
      anterior,
      409,
      "No se pudo reservar esa cantidad. Revisa las existencias, la fecha y el vendedor.",
    );
    return json(anterior);
  }
  if (post && ruta === "pedidos" && id && accion === "estado") {
    identificado();
    const d = await cuerpo(req),
      estado = opcion(d.estado, ["Cancelado", "Entregado", "Recibido"]);
    const rule = {
      Cancelado:
        "estado='Confirmado' AND (comprador=? OR ganado IN (SELECT id FROM ganado WHERE vendedor=?))",
      Entregado:
        "estado='Confirmado' AND ganado IN (SELECT id FROM ganado WHERE vendedor=?)",
      Recibido: "estado='Entregado' AND comprador=?",
    }[estado];
    const args = estado === "Cancelado" ? [user.id, user.id] : [user.id];
    const row = await db
      .prepare(
        "UPDATE pedidos SET estado=? WHERE id=? AND " + rule + " RETURNING id",
      )
      .bind(estado, id, ...args)
      .first();
    exigir(row, 409, "La operación no está disponible para este pedido.");
    return json(row);
  }
  if (!post && path === "anuncios") {
    const avisos = await list(
      db.prepare("SELECT * FROM anuncios ORDER BY creado DESC"),
    );
    const ofertas = await list(
      db.prepare(
        `SELECT g.id, g.vendedor AS autor,g.nombre,'Ganado en venta' AS tipo,g.titulo,g.ubicacion,g.descripcion AS mensaje,g.creado FROM ganado g WHERE g.visible=1 AND (${libres})>0 ORDER BY g.creado DESC LIMIT 12`,
      ),
    );
    return json([...avisos, ...ofertas].sort((a, b) => b.creado - a.creado));
  }
  if (post && path === "anuncios") {
    identificado();
    const d = await cuerpo(req);
    const aviso = {
      id: uuid(),
      autor: user.id,
      nombre: user.nombre,
      tipo: opcion(d.tipo, tiposAnuncio),
      titulo: texto(d.titulo, 4, 80, "título"),
      ubicacion: texto(d.ubicacion, 3, 100, "ubicación"),
      mensaje: texto(d.mensaje, 10, 600, "mensaje"),
      creado: Date.now(),
    };
    await insert(db, "anuncios", aviso).run();
    return json(aviso, 201);
  }
  if (post && ruta === "anuncios" && accion === "retirar") {
    identificado();
    await cuerpo(req);
    const row = await db
      .prepare("DELETE FROM anuncios WHERE id=? AND autor=? RETURNING id")
      .bind(id, user.id)
      .first();
    exigir(row, 404, "Anuncio no encontrado.");
    return json(row);
  }
  if (post && path === "mensajes") {
    const d = await cuerpo(req);
    let receptor = "soporte",
      asunto = texto(d.asunto, 2, 120, "asunto");
    if (d.anuncio) {
      identificado();
      const aviso = await db
        .prepare("SELECT autor,titulo FROM anuncios WHERE id=?")
        .bind(d.anuncio)
        .first();
      exigir(
        aviso && aviso.autor !== user.id,
        422,
        "No se puede contactar este anuncio.",
      );
      receptor = aviso.autor;
      asunto = aviso.titulo;
    }
    const mail = user?.correo || correo(d.correo),
      nombre = user?.nombre || texto(d.nombre, 2, 64, "nombre");
    exigir(
      await permitirIntento(db, "mensaje|" + mail, 20),
      429,
      "Espera unos minutos antes de enviar más mensajes.",
    );
    const registro = {
      id: uuid(),
      receptor,
      emisor: user?.id || "",
      correo: mail,
      nombre,
      asunto,
      mensaje: texto(d.mensaje, 10, 1000, "mensaje"),
      creado: Date.now(),
    };
    await insert(db, "mensajes", registro).run();
    return json({ id: registro.id }, 201);
  }
  if (!post && path === "cuenta") {
    identificado();
    const [ganados, pedidos, mensajes, anuncios] = await Promise.all([
      list(
        db
          .prepare(catalogo + " WHERE g.vendedor=? ORDER BY g.creado DESC")
          .bind(user.id),
      ),
      list(
        db
          .prepare(
            `SELECT p.*,g.titulo,g.ubicacion,g.nombre AS nombreVendedor,g.telefono AS telVendedor,g.vendedor,
        u.nombre AS nombreComprador FROM pedidos p JOIN ganado g ON p.ganado=g.id JOIN usuarios u ON p.comprador=u.id
        WHERE p.comprador=? OR g.vendedor=? ORDER BY p.creado DESC`,
          )
          .bind(user.id, user.id),
      ),
      list(
        db
          .prepare(
            "SELECT * FROM mensajes WHERE receptor=? OR emisor=? ORDER BY creado DESC",
          )
          .bind(user.id, user.id),
      ),
      list(
        db
          .prepare("SELECT * FROM anuncios WHERE autor=? ORDER BY creado DESC")
          .bind(user.id),
      ),
    ]);
    return json({ ganados, pedidos, mensajes, anuncios });
  }
  throw new Problema(404, "No se encontró esta sección de la API.");
}
export async function api(req, db) {
  try {
    return await mercado(req, db);
  } catch (e) {
    if (!e.status) console.error("Error de Bovimarket:", e.message);
    return json(
      {
        error: e.status
          ? e.message
          : "No se pudo completar la operación. Vuelve a intentarlo.",
      },
      e.status || 500,
    );
  }
}
