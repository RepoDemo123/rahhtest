"use client";
import React from "react";

import { useUpload } from "../utilities/runtime-helpers";

function MainComponent() {
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [file, setFile] = useState(null);
  const [detectedIngredients, setDetectedIngredients] = useState(null);
  const [newIngredient, setNewIngredient] = useState("");
  const [upload, { loading: uploading }] = useUpload();
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const handleImageUpload = async () => {
    try {
      setAnalyzing(true);
      setError(null);
      setDetectedIngredients(null);

      const { url, error: uploadError } = await upload({ file });
      if (uploadError) {
        throw new Error(uploadError);
      }

      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64data = reader.result;

        const visionResponse = await fetch("/integrations/gpt-vision/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: 'Look at this image and identify all food ingredients you can see. List them in a simple comma-separated format. Only include the ingredient names, no quantities or descriptions. For example: "tomatoes, onions, garlic" not "2 red tomatoes, 1 large onion". If you do not see any food ingredients, say "No food ingredients detected".',
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: base64data,
                    },
                  },
                ],
              },
            ],
          }),
        });

        if (!visionResponse.ok) {
          throw new Error("Failed to analyze image");
        }

        const visionData = await visionResponse.json();
        const ingredientsList = visionData.choices[0]?.message?.content;

        if (
          !ingredientsList ||
          ingredientsList === "No food ingredients detected"
        ) {
          throw new Error("No ingredients detected in the image");
        }

        // Show detected ingredients before adding them
        setDetectedIngredients(ingredientsList);
      };

      reader.readAsDataURL(blob);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to process image. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const addManualIngredient = async (e) => {
    e.preventDefault();
    if (!newIngredient.trim()) return;

    try {
      setError(null);
      const response = await fetch("/api/add-ingredients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ingredients: newIngredient }),
      });

      if (!response.ok) {
        throw new Error("Failed to add ingredient");
      }

      await fetchIngredientsAndRecipes();
      setNewIngredient("");
    } catch (err) {
      console.error(err);
      setError("Failed to add ingredient");
    }
  };

  const deleteIngredient = async (ingredientId) => {
    try {
      setError(null);
      const response = await fetch("/api/delete-ingredient", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: ingredientId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete ingredient");
      }

      await fetchIngredientsAndRecipes();
    } catch (err) {
      console.error(err);
      setError("Failed to delete ingredient");
    }
  };

  const confirmIngredients = async () => {
    try {
      setError(null);

      // Split the comma-separated string into an array and trim each ingredient
      const ingredientsList = detectedIngredients
        .split(",")
        .map((ingredient) => ingredient.trim())
        .filter((ingredient) => ingredient.length > 0);

      const saveResponse = await fetch("/api/add-ingredients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ingredients: ingredientsList.join(",") }),
      });

      if (!saveResponse.ok) {
        throw new Error("Failed to save ingredients");
      }

      await fetchIngredientsAndRecipes();
      setFile(null);
      setDetectedIngredients(null);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save ingredients. Please try again.");
    }
  };

  const fetchIngredientsAndRecipes = async () => {
    try {
      const [ingredientsResponse, recipesResponse] = await Promise.all([
        fetch("/api/list-ingredients", { method: "POST" }),
        fetch("/api/find-recipes", { method: "POST" }),
      ]);

      if (!ingredientsResponse.ok || !recipesResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      const [ingredientsData, recipesData] = await Promise.all([
        ingredientsResponse.json(),
        recipesResponse.json(),
      ]);

      setIngredients(ingredientsData || []);
      setRecipes(recipesData || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load data");
    }
  };

  const clearAllIngredients = async () => {
    try {
      setError(null);
      const response = await fetch("/api/clear-ingredients", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to clear ingredients");
      }

      await fetchIngredientsAndRecipes();
    } catch (err) {
      console.error(err);
      setError("Failed to clear ingredients");
    }
  };

  useEffect(() => {
    fetchIngredientsAndRecipes();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto py-6 px-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold text-gray-800">
              🥗 Recipe Finder
            </h1>
            <div className="flex gap-3">
              <a
                href="/browse"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse All Recipes
              </a>
              <a
                href="/gym"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Gym Recipes
              </a>
            </div>
          </div>
          <p className="text-center text-gray-600">
            Find delicious recipes with ingredients you have
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Add Ingredients Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-xl">+</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              Add Ingredients
            </h2>
          </div>

          {/* Manual Input */}
          <form onSubmit={addManualIngredient} className="mb-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                placeholder="Enter an ingredient (e.g. tomatoes)"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!newIngredient.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300"
              >
                Add
              </button>
            </div>
          </form>

          {/* Photo Upload */}
          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xl">📷</span>
              </div>
              <h3 className="text-lg font-medium text-gray-800">
                Or Upload a Photo
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0])}
                  className="flex-1 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 text-gray-600"
                />
                <button
                  onClick={handleImageUpload}
                  disabled={!file || uploading || analyzing}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300"
                >
                  {uploading || analyzing ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span> Analyzing...
                    </span>
                  ) : (
                    "Analyze Image"
                  )}
                </button>
              </div>

              {detectedIngredients && (
                <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">
                    ✨ Detected Ingredients:
                  </h4>
                  <p className="text-green-700 mb-4">{detectedIngredients}</p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setDetectedIngredients(null)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmIngredients}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Add These Ingredients
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-xl">
            ⚠️ {error}
          </div>
        )}

        {/* Current Ingredients */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-xl">🧂</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">
                Your Ingredients
              </h2>
            </div>
            {ingredients.length > 0 && (
              <button
                onClick={clearAllIngredients}
                className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {ingredients.length === 0 ? (
            <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
              No ingredients added yet. Add some ingredients above! 👆
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {ingredients.map((ingredient) => (
                <span
                  key={ingredient.id}
                  className="bg-gray-100 px-4 py-2 rounded-lg text-gray-700 flex items-center gap-2 hover:bg-gray-200 transition-colors"
                >
                  {ingredient.name}
                  <button
                    onClick={() => deleteIngredient(ingredient.id)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                    title="Remove ingredient"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Recipes */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 text-xl">👩‍🍳</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              Recipes You Can Make
            </h2>
          </div>

          {recipes.length === 0 ? (
            <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
              No recipes found with your current ingredients. Try adding more
              ingredients! ✨
            </p>
          ) : (
            <div className="space-y-8">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="border border-gray-100 rounded-lg p-6 hover:border-gray-200 transition-colors"
                >
                  {/* Recipe Header */}
                  <div className="border-b border-gray-100 pb-4 mb-4">
                    <h3 className="text-2xl font-medium text-gray-800 mb-2">
                      {recipe.name}
                    </h3>
                    <p className="text-gray-600 mb-4">{recipe.description}</p>

                    {/* Recipe Meta Info */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <span>⏱️</span> Prep: {recipe.prep_time} mins
                      </span>
                      <span className="flex items-center gap-1">
                        <span>🍳</span> Cook: {recipe.cooking_time} mins
                      </span>
                      <span className="flex items-center gap-1">
                        <span>⌛</span> Total: {recipe.total_time} mins
                      </span>
                      <span className="flex items-center gap-1">
                        <span>👥</span> Serves {recipe.servings}
                      </span>
                      <span className="flex items-center gap-1">
                        <span>📊</span> {recipe.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Ingredients Section */}
                  <div className="mb-6">
                    <h4 className="text-lg font-medium text-gray-800 mb-3">
                      Ingredients Needed:
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

                  {/* Instructions */}
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

                  {/* Nutrition Info */}
                  {recipe.nutrition_info && (
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <h4 className="text-lg font-medium text-gray-800 mb-3">
                        Nutrition Information (per serving):
                      </h4>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span>Calories: {recipe.nutrition_info.calories}</span>
                        <span>Protein: {recipe.nutrition_info.protein}</span>
                        <span>Carbs: {recipe.nutrition_info.carbs}</span>
                        <span>Fat: {recipe.nutrition_info.fat}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MainComponent;