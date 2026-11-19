import { fotosRaza } from "../src/domain.js";
const ejemplos = [
  [
    "Lote de novillas Brahman",
    "Brahman",
    "Hembra",
    18,
    320,
    4,
    "Montería, Córdoba",
    4800000,
    "Hacienda La Pradera",
  ],
  [
    "Toro reproductor Nelore",
    "Nelore",
    "Macho",
    30,
    620,
    1,
    "Villavicencio, Meta",
    9500000,
    "Ganadería El Retiro",
  ],
  [
    "Vaca lechera Gyr",
    "Gyr",
    "Hembra",
    40,
    450,
    2,
    "Sincelejo, Sucre",
    6200000,
    "Finca La Esperanza",
  ],
  [
    "Novillos Angus para ceba",
    "Angus",
    "Macho",
    14,
    380,
    6,
    "Yopal, Casanare",
    5100000,
    "Hacienda El Porvenir",
  ],
  [
    "Terneras Simmental",
    "Simmental",
    "Hembra",
    8,
    210,
    3,
    "Pasto, Nariño",
    3400000,
    "Finca Las Palmas",
  ],
  [
    "Lote comercial cruce Cebú",
    "Cruce comercial",
    "Mixto",
    24,
    400,
    5,
    "Valledupar, Cesar",
    4300000,
    "Ganadería El Roble",
  ],
];
const iniciado = new WeakMap();
export function prepararEjemplos(db) {
  if (!iniciado.has(db))
    iniciado.set(
      db,
      cargar(db).catch((e) => {
        iniciado.delete(db);
        throw e;
      }),
    );
  return iniciado.get(db);
}
async function cargar(db) {
  if (await db.prepare("SELECT id FROM ganado WHERE id='demo-1'").first())
    return;
  const campos =
    "id,vendedor,nombre,telefono,titulo,raza,sexo,edad,peso,cantidad,tipo,precio,ubicacion,fecha,descripcion,imagen,creado";
  const sentencias = ejemplos.map(
    (
      [titulo, raza, sexo, edad, peso, cantidad, ubicacion, precio, nombre],
      i,
    ) => {
      const datos = [
        "demo-" + (i + 1),
        "muestra",
        nombre,
        "",
        titulo,
        raza,
        sexo,
        edad,
        peso,
        cantidad,
        "Por animal",
        precio,
        ubicacion,
        "2026-01-01",
        "Publicación de muestra para practicar la compra y la gestión de pedidos.",
        "/img/" + fotosRaza[i] + ".webp",
        1700000000000 - i,
      ];
      return db
        .prepare(
          "INSERT OR IGNORE INTO ganado (" +
            campos +
            ") VALUES (" +
            datos.map(() => "?").join(",") +
            ")",
        )
        .bind(...datos);
    },
  );
  await db.batch(sentencias);
}
