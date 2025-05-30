async function handler() {
  const query = `
    WITH available_ingredients AS (
      SELECT id, name FROM ingredients
    ),
    matching_recipes AS (
      SELECT 
        r.*,
        COUNT(DISTINCT ai.id) as matching_ingredients,
        (
          SELECT COUNT(DISTINCT ingredient_id) 
          FROM recipe_ingredients 
          WHERE recipe_id = r.id
        ) as total_ingredients,
        ARRAY_AGG(
          json_build_object(
            'id', ri.ingredient_id,
            'name', i.name,
            'quantity', ri.quantity,
            'unit', ri.unit,
            'notes', ri.notes,
            'preparation', ri.preparation,
            'available', ai.id IS NOT NULL
          )
        ) as ingredients_list
      FROM recipes r
      JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      JOIN ingredients i ON ri.ingredient_id = i.id
      LEFT JOIN available_ingredients ai ON ri.ingredient_id = ai.id
      GROUP BY r.id
    )
    SELECT 
      id,
      name,
      description,
      instructions,
      cooking_time,
      prep_time,
      total_time,
      servings,
      difficulty,
      category,
      nutrition_info,
      ingredients_list,
      matching_ingredients,
      total_ingredients,
      ROUND((matching_ingredients::float / total_ingredients::float) * 100) as match_percentage
    FROM matching_recipes
    WHERE matching_ingredients > 0
    ORDER BY match_percentage DESC, name ASC`;

  const recipes = await sql(query);
  return recipes;
}
export async function POST(request) {
  return handler(await request.json());
}