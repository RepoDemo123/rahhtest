"use client";
import React from "react";

function MainComponent() {
  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState(null);
  const [expandedRecipeId, setExpandedRecipeId] = useState(null);
  const [filterType, setFilterType] = useState("difficulty"); // 'difficulty' or 'protein'
  const [visibleItems, setVisibleItems] = useState({}); // Track visible items per category

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const response = await fetch("/api/get-fitness-recipes", {
          method: "POST",
        });
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

  // Reset visible items when changing filter type
  useEffect(() => {
    // Initialize visible items for each category
    const categories =
      filterType === "difficulty"
        ? [
            "Easy Recipes (Beginner-Friendly)",
            "Medium Recipes (Some Experience Needed)",
            "Hard Recipes (Advanced Cooking)",
          ]
        : [
            "High Protein (35g+ per serving)",
            "Medium Protein (25-34g per serving)",
            "Moderate Protein (15-24g per serving)",
          ];

    const initialVisibleItems = {};
    categories.forEach((category) => {
      initialVisibleItems[category] = 3;
    });

    setVisibleItems(initialVisibleItems);
  }, [filterType]);

  const difficultyCategories = {
    "Easy Recipes (Beginner-Friendly)": recipes.filter(
      (recipe) => recipe.difficulty === "Easy"
    ),
    "Medium Recipes (Some Experience Needed)": recipes.filter(
      (recipe) => recipe.difficulty === "Medium"
    ),
    "Hard Recipes (Advanced Cooking)": recipes.filter(
      (recipe) => recipe.difficulty === "Hard"
    ),
  };

  const getProteinContent = (protein) => {
    // Remove 'g' and convert to number
    return parseInt(protein?.replace("g", "")) || 0;
  };

  const proteinCategories = {
    "High Protein (35g+ per serving)": recipes.filter(
      (recipe) => getProteinContent(recipe.nutrition_info?.protein) >= 35
    ),
    "Medium Protein (25-34g per serving)": recipes.filter((recipe) => {
      const protein = getProteinContent(recipe.nutrition_info?.protein);
      return protein >= 25 && protein < 35;
    }),
    "Moderate Protein (15-24g per serving)": recipes.filter((recipe) => {
      const protein = getProteinContent(recipe.nutrition_info?.protein);
      return protein >= 15 && protein < 25;
    }),
  };

  const toggleRecipe = (recipeId) => {
    setExpandedRecipeId(expandedRecipeId === recipeId ? null : recipeId);
  };

  const loadMore = (category) => {
    setVisibleItems((prev) => ({
      ...prev,
      [category]: (prev[category] || 3) + 3,
    }));
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty) {
      case "Easy":
        return "👶";
      case "Medium":
        return "👨‍🍳";
      case "Hard":
        return "🎓";
      default:
        return "📋";
    }
  };

  const getProteinIcon = (category) => {
    if (category.startsWith("High")) return "💪";
    if (category.startsWith("Medium")) return "🏃";
    return "🥗";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto py-6 px-4">
          <h1 className="text-4xl font-bold text-center text-gray-800">
            💪 Fitness Recipes
          </h1>
          <p className="text-center text-gray-600 mt-2">
            From quick post-workout meals to gourmet protein-packed dishes
          </p>

          {/* Filter Toggle Buttons */}
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => setFilterType("difficulty")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterType === "difficulty"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Sort by Difficulty
            </button>
            <button
              onClick={() => setFilterType("protein")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterType === "protein"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Sort by Protein Content
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-xl">
            ⚠️ {error}
          </div>
        )}

        {Object.entries(
          filterType === "difficulty" ? difficultyCategories : proteinCategories
        ).map(([category, categoryRecipes]) => (
          <div
            key={category}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xl">
                  {filterType === "difficulty"
                    ? getDifficultyIcon(category.split(" ")[0])
                    : getProteinIcon(category)}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">
                {category}
              </h2>
            </div>

            <div className="space-y-4">
              {categoryRecipes
                .slice(0, visibleItems[category] || 3)
                .map((recipe) => (
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
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            ⏱️ {recipe.total_time}min
                          </span>
                          <span className="text-gray-500">
                            {expandedRecipeId === recipe.id ? "▼" : "▶"}
                          </span>
                        </div>
                      </div>

                      <p className="text-gray-600 mt-2">{recipe.description}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 bg-gray-50 p-3 rounded-lg">
                        <div className="text-center">
                          <div className="text-sm text-gray-500">Protein</div>
                          <div className="font-semibold text-blue-600">
                            {recipe.nutrition_info?.protein}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">Carbs</div>
                          <div className="font-semibold text-green-600">
                            {recipe.nutrition_info?.carbs}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">Fat</div>
                          <div className="font-semibold text-yellow-600">
                            {recipe.nutrition_info?.fat}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">Calories</div>
                          <div className="font-semibold text-red-600">
                            {recipe.nutrition_info?.calories}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <span>👥</span> Serves {recipe.servings}
                        </span>
                        <span className="flex items-center gap-1">
                          <span>⚡</span> Prep: {recipe.prep_time}min
                        </span>
                        <span className="flex items-center gap-1">
                          <span>🔥</span> Cook: {recipe.cooking_time}min
                        </span>
                        {filterType === "protein" && (
                          <span className="flex items-center gap-1">
                            <span>📝</span> Difficulty: {recipe.difficulty}
                          </span>
                        )}
                      </div>
                    </div>

                    {expandedRecipeId === recipe.id && (
                      <div className="border-t border-gray-100 p-4">
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-gray-800 mb-3">
                            Ingredients:
                          </h4>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {recipe.ingredients_list.map(
                              (ingredient, index) => (
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
                              )
                            )}
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

                        <div className="mt-6 pt-4 border-t border-gray-100">
                          <h4 className="text-lg font-medium text-gray-800 mb-3">
                            Nutrition Information (per serving):
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
                            <div className="text-center">
                              <div className="text-sm text-gray-500">
                                Protein
                              </div>
                              <div className="font-semibold text-blue-600">
                                {recipe.nutrition_info?.protein}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm text-gray-500">Carbs</div>
                              <div className="font-semibold text-green-600">
                                {recipe.nutrition_info?.carbs}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm text-gray-500">Fat</div>
                              <div className="font-semibold text-yellow-600">
                                {recipe.nutrition_info?.fat}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm text-gray-500">
                                Calories
                              </div>
                              <div className="font-semibold text-red-600">
                                {recipe.nutrition_info?.calories}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

              {categoryRecipes.length === 0 ? (
                <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                  No recipes available in this category.
                </p>
              ) : (
                categoryRecipes.length > (visibleItems[category] || 3) && (
                  <div className="text-center mt-6">
                    <button
                      onClick={() => loadMore(category)}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Load More Recipes
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MainComponent;