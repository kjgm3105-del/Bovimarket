const encoder = new TextEncoder();
const hex = (bytes) =>
  Array.from(new Uint8Array(bytes), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
export const secreto = () => hex(crypto.getRandomValues(new Uint8Array(32)));
const digest = async (value) =>
  hex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
export async function derivar(password, salt) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return hex(
    await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: encoder.encode(salt),
        iterations: 100000,
        hash: "SHA-256",
      },
      key,
      256,
    ),
  );
}
export async function sesion(db, request) {
  const token = (request.headers.get("cookie") || "").match(
    /(?:^|;\s*)bovi_sesion=([a-f0-9]{64})(?:;|$)/,
  )?.[1];
  if (!token) return { user: null, token: null };
  const hash = await digest(token);
  const user = await db
    .prepare(
      "SELECT u.id,u.nombre,u.correo FROM usuarios u JOIN sesiones s ON s.usuario=u.id WHERE s.token=? AND s.vence>?",
    )
    .bind(hash, Date.now())
    .first();
  return { user, token: hash };
}
export const cookie = (req, token, age) =>
  "bovi_sesion=" +
  token +
  "; Path=/; HttpOnly; SameSite=Lax; Max-Age=" +
  age +
  (new URL(req.url).protocol === "https:" ? "; Secure" : "");
export async function nuevaSesion(db, req, id) {
  const token = secreto();
  await db
    .prepare("INSERT INTO sesiones (token,usuario,vence) VALUES (?,?,?)")
    .bind(await digest(token), id, Date.now() + 604800000)
    .run();
  return cookie(req, token, 604800);
}
export async function permitirIntento(db, key, max) {
  const id = await digest(key),
    ahora = Date.now();
  const fila = await db
    .prepare(
      `INSERT INTO intentos (id,contador,vence) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET
    contador=CASE WHEN vence<=? THEN 1 ELSE contador+1 END,
    vence=CASE WHEN vence<=? THEN excluded.vence ELSE vence END RETURNING contador`,
    )
    .bind(id, ahora + 600000, ahora, ahora)
    .first();
  return fila.contador <= max;
}
