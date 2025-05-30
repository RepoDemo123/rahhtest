async function handler({ ingredients }) {
  if (!ingredients) {
    return { error: "No ingredients provided" };
  }

  const ingredientsList = ingredients
    .split(",")
    .map((i) => i.trim())
    .filter((i) => i.length > 0);

  if (ingredientsList.length === 0) {
    return { error: "No valid ingredients found" };
  }

  const insertedIngredients = await sql.transaction(async (sql) => {
    const values = ingredientsList.map((_, i) => `($${i + 1})`).join(",");
    const query = `INSERT INTO ingredients (name) 
                   VALUES ${values}
                   ON CONFLICT (name) DO NOTHING
                   RETURNING id, name`;

    return sql(query, ingredientsList);
  });

  return {
    success: true,
    ingredients: insertedIngredients,
  };
}
export async function POST(request) {
  return handler(await request.json());
}