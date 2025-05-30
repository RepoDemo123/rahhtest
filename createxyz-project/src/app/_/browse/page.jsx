"use client";
import React from "react";

function MainComponent() {
  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState(null);
  const [expandedRecipeId, setExpandedRecipeId] = useState(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const response = await fetch("/api/browse-recipes", { method: "POST" });
        if (!response.ok) {
          throw new Error("Failed to fetch recipes");
        }
        const data = await response.json();
        setRecipes(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load recipes");
      }
    };

    fetchRecipes();
  }, []);

  const difficultyOrder = ["Easy", "Medium", "Hard"];
  const recipesByDifficulty = difficultyOrder.reduce((acc, difficulty) => {
    acc[difficulty] = recipes.filter(
      (recipe) => recipe.difficulty === difficulty
    );
    return acc;
  }, {});

  const toggleRecipe = (recipeId) => {
    setExpandedRecipeId(expandedRecipeId === recipeId ? null : recipeId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto py-6 px-4">
          <h1 className="text-4xl font-bold text-center text-gray-800">
            🍳 Browse Recipes
          </h1>
          <p className="text-center text-gray-600 mt-2">
            Explore our collection of delicious recipes
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-xl">
            ⚠️ {error}
          </div>
        )}

        {difficultyOrder.map((difficulty) => (
          <div
            key={difficulty}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xl">
                  {difficulty === "Easy"
                    ? "👶"
                    : difficulty === "Medium"
                    ? "👨‍🍳"
                    : "🎓"}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">
                {difficulty} Recipes
              </h2>
            </div>

            <div className="space-y-4">
              {recipesByDifficulty[difficulty].map((recipe) => (
                <div
                  key={recipe.id}
                  className="border border-gray-100 rounded-lg hover:border-gray-200 transition-colors"
                >
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => toggleRecipe(recipe.id)}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-800">
                        {recipe.name}
                      </h3>
                      <span className="text-gray-500">
                        {expandedRecipeId === recipe.id ? "▼" : "▶"}
                      </span>
                    </div>

                    <p className="text-gray-600 mt-2">{recipe.description}</p>

                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <span>⏱️</span> {recipe.total_time} mins
                      </span>
                      <span className="flex items-center gap-1">
                        <span>👥</span> Serves {recipe.servings}
                      </span>
                    </div>
                  </div>

                  {expandedRecipeId === recipe.id && (
                    <div className="border-t border-gray-100 p-4">
                      <div className="mb-6">
                        <h4 className="text-lg font-medium text-gray-800 mb-3">
                          Ingredients:
                        </h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {recipe.ingredients_list.map((ingredient, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-2 text-gray-700"
                            >
                              <span>•</span>
                              <span>
                                <strong>
                                  {ingredient.quantity} {ingredient.unit}{" "}
                                  {ingredient.name}
                                </strong>
                                {ingredient.notes && (
                                  <span className="text-gray-500">
                                    {" "}
                                    - {ingredient.notes}
                                  </span>
                                )}
                                {ingredient.preparation && (
                                  <span className="text-gray-500">
                                    {" "}
                                    ({ingredient.preparation})
                                  </span>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-lg font-medium text-gray-800 mb-3">
                          Instructions:
                        </h4>
                        <div className="prose prose-gray max-w-none">
                          <div className="whitespace-pre-wrap text-gray-700">
                            {recipe.instructions}
                          </div>
                        </div>
                      </div>

                      {recipe.nutrition_info && (
                        <div className="mt-6 pt-4 border-t border-gray-100">
                          <h4 className="text-lg font-medium text-gray-800 mb-3">
                            Nutrition Information (per serving):
                          </h4>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <span>
                              Calories: {recipe.nutrition_info.calories}
                            </span>
                            <span>
                              Protein: {recipe.nutrition_info.protein}
                            </span>
                            <span>Carbs: {recipe.nutrition_info.carbs}</span>
                            <span>Fat: {recipe.nutrition_info.fat}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {recipesByDifficulty[difficulty].length === 0 && (
                <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                  No {difficulty.toLowerCase()} recipes available at the moment.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MainComponent;