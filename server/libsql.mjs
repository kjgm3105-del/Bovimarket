// Adapta la misma API al protocolo SQL utilizado por Turso en Netlify.
export function baseRemota(cliente) {
  function preparar(sql, args = []) {
    const consulta = { sql, args };
    return {
      consulta,
      bind: (...values) => preparar(sql, values),
      first: async () => (await cliente.execute(consulta)).rows[0] || null,
      all: async () => ({ results: (await cliente.execute(consulta)).rows }),
      run: () => cliente.execute(consulta),
    };
  }
  return {
    prepare: preparar,
    batch: (sentencias) =>
      cliente.batch(
        sentencias.map((s) => s.consulta),
        "write",
      ),
  };
}
