async function handler() {
  const ingredients = await sql`
    SELECT id, name, quantity, unit, created_at 
    FROM ingredients 
    ORDER BY name ASC`;

  return ingredients;
}
export async function POST(request) {
  return handler(await request.json());
}