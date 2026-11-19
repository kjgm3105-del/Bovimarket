import { createClient } from "@libsql/client/web";
import { baseRemota } from "../../server/libsql.mjs";
import { api } from "../../server/api.js";
let db;
export default async function mercado(request) {
  db ||= baseRemota(
    createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    }),
  );
  return api(request, db);
}
export const config = { path: "/api/*" };
