import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const usuarios = sqliteTable("usuarios", {
  id: text().primaryKey(),
  nombre: text().notNull(),
  correo: text().notNull().unique(),
  clave: text().notNull(),
  sal: text().notNull(),
});
export const sesiones = sqliteTable("sesiones", {
  token: text().primaryKey(),
  usuario: text()
    .notNull()
    .references(() => usuarios.id),
  vence: integer().notNull(),
});
export const intentos = sqliteTable("intentos", {
  id: text().primaryKey(),
  contador: integer().notNull(),
  vence: integer().notNull(),
});
export const fotos = sqliteTable("fotos", {
  id: text().primaryKey(),
  contenido: text().notNull(),
});
export const ganado = sqliteTable("ganado", {
  id: text().primaryKey(),
  vendedor: text().notNull(),
  nombre: text().notNull(),
  telefono: text().notNull(),
  titulo: text().notNull(),
  raza: text().notNull(),
  sexo: text().notNull(),
  edad: integer().notNull(),
  peso: integer().notNull(),
  cantidad: integer().notNull(),
  tipo: text().notNull(),
  precio: integer().notNull(),
  ubicacion: text().notNull(),
  fecha: text().notNull(),
  descripcion: text().notNull(),
  imagen: text().notNull(),
  visible: integer().notNull().default(1),
  creado: integer().notNull(),
});
export const pedidos = sqliteTable(
  "pedidos",
  {
    id: text().primaryKey(),
    comprador: text()
      .notNull()
      .references(() => usuarios.id),
    ganado: text()
      .notNull()
      .references(() => ganado.id),
    cantidad: integer().notNull(),
    total: integer().notNull(),
    telefono: text().notNull(),
    recogida: text().notNull(),
    estado: text().notNull(),
    creado: integer().notNull(),
  },
  (t) => [
    index("pedidos_ganado").on(t.ganado),
    index("pedidos_comprador").on(t.comprador),
  ],
);
export const anuncios = sqliteTable("anuncios", {
  id: text().primaryKey(),
  autor: text().notNull(),
  nombre: text().notNull(),
  tipo: text().notNull(),
  titulo: text().notNull(),
  ubicacion: text().notNull(),
  mensaje: text().notNull(),
  creado: integer().notNull(),
});
export const mensajes = sqliteTable("mensajes", {
  id: text().primaryKey(),
  receptor: text().notNull(),
  emisor: text().notNull(),
  correo: text().notNull(),
  nombre: text().notNull(),
  asunto: text().notNull(),
  mensaje: text().notNull(),
  creado: integer().notNull(),
});
