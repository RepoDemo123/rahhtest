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
      r.category,
      r.nutrition_info,
      COALESCE(
        json_agg(
          json_build_object(
            'name', i.name,
            'quantity', ri.quantity,
            'unit', ri.unit,
            'notes', ri.notes,
            'preparation', ri.preparation
          )
        ) FILTER (WHERE i.name IS NOT NULL),
        '[]'
      ) as ingredients_list
    FROM recipes r
    LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
    LEFT JOIN ingredients i ON ri.ingredient_id = i.id
    WHERE r.category = 'Fitness'
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
      r.category,
      r.nutrition_info
    ORDER BY 
      CASE 
        WHEN nutrition_info->>'protein' ~ '^[0-9]+g$' 
        THEN CAST(REPLACE(nutrition_info->>'protein', 'g', '') AS INTEGER)
        ELSE 0
      END DESC,
      name ASC`;

  const recipes = await sql(query);
  return recipes;
}
export async function POST(request) {
  return handler(await request.json());
}