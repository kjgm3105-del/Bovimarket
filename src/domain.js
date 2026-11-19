export const razas = [
  "Brahman",
  "Nelore",
  "Gyr",
  "Angus",
  "Simmental",
  "Cruce comercial",
];
export const fotosRaza = ["novilla", "nerole", "gyr", "agus", "sime", "cebu"];
export const sexos = ["Hembra", "Macho", "Mixto"];
export const modalidades = ["Por animal", "Por lote", "Por kilo en pie"];
export const tiposAnuncio = ["Busco ganado", "Transporte", "Servicios"];
export const departamentos = [
  "Amazonas",
  "Antioquia",
  "Arauca",
  "Atlántico",
  "Bogotá D. C.",
  "Bolívar",
  "Boyacá",
  "Caldas",
  "Caquetá",
  "Casanare",
  "Cauca",
  "Cesar",
  "Chocó",
  "Córdoba",
  "Cundinamarca",
  "Guainía",
  "Guaviare",
  "Huila",
  "La Guajira",
  "Magdalena",
  "Meta",
  "Nariño",
  "Norte de Santander",
  "Putumayo",
  "Quindío",
  "Risaralda",
  "San Andrés y Providencia",
  "Santander",
  "Sucre",
  "Tolima",
  "Valle del Cauca",
  "Vaupés",
  "Vichada",
];
export const dinero = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
}).format;
export const unidad = (tipo) =>
  ({ "Por lote": "lote", "Por kilo en pie": "kg", "Por animal": "animal" })[
    tipo
  ] || "animal";
export function hoy() {
  const partes = new Intl.DateTimeFormat("en", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const p = Object.fromEntries(partes.map((x) => [x.type, x.value]));
  return [p.year, p.month, p.day].join("-");
}
export function importe(g, n) {
  if (g.tipo === "Por lote") return g.precio;
  return g.precio * n * (g.tipo === "Por kilo en pie" ? g.peso : 1);
}
export function normalizar(v) {
  return String(v || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
