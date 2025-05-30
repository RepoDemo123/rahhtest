async function handler({ id }) {
  if (!id) {
    return { error: "No ingredient ID provided" };
  }

  const result = await sql`
    DELETE FROM ingredients 
    WHERE id = ${id} 
    RETURNING id
  `;

  if (result.length === 0) {
    return { error: "Ingredient not found" };
  }

  return { success: true, id: result[0].id };
}
export async function POST(request) {
  return handler(await request.json());
}