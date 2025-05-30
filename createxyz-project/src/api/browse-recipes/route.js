async function handler() {
  const query = `
    SELECT 
      r.id,
      r.name,
      r.description,
      r.instructions,
      r.cooking_time,
      r.prep_time,
      r.total_time,
      r.servings,
      r.difficulty,
      r.nutrition_info,
      json_agg(
        json_build_object(
          'name', i.name,
          'quantity', ri.quantity,
          'unit', ri.unit,
          'notes', ri.notes,
          'preparation', ri.preparation
        )
      ) as ingredients_list
    FROM recipes r
    LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
    LEFT JOIN ingredients i ON ri.ingredient_id = i.id
    GROUP BY 
      r.id,
      r.name,
      r.description,
      r.instructions,
      r.cooking_time,
      r.prep_time,
      r.total_time,
      r.servings,
      r.difficulty,
      r.nutrition_info
    ORDER BY 
      CASE 
        WHEN r.difficulty = 'Easy' THEN 1
        WHEN r.difficulty = 'Medium' THEN 2
        WHEN r.difficulty = 'Hard' THEN 3
      END,
      r.name ASC`;

  const recipes = await sql(query);
  return recipes;
}
export async function POST(request) {
  return handler(await request.json());
}