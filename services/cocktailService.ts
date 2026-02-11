
import { Cocktail } from '../types';

const BASE_URL = 'https://www.thecocktaildb.com/api/json/v1/1';

export const cocktailService = {
  async searchCocktails(query: string): Promise<Cocktail[]> {
    try {
      const response = await fetch(`${BASE_URL}/search.php?s=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (!data.drinks) return [];
      
      return data.drinks.map((drink: any) => {
        const ingredients = [];
        for (let i = 1; i <= 15; i++) {
          const name = drink[`strIngredient${i}`];
          const measure = drink[`strMeasure${i}`];
          if (name) {
            ingredients.push({ name, measure: measure || '' });
          }
        }
        return {
          idDrink: drink.idDrink,
          strDrink: drink.strDrink,
          strDrinkThumb: drink.strDrinkThumb,
          strInstructions: drink.strInstructions,
          strGlass: drink.strGlass,
          ingredients
        };
      });
    } catch (error) {
      console.error('Error fetching cocktail data:', error);
      return [];
    }
  },

  async getRandomCocktail(): Promise<Cocktail | null> {
    try {
      const response = await fetch(`${BASE_URL}/random.php`);
      const data = await response.json();
      if (!data.drinks) return null;
      const drink = data.drinks[0];
      const ingredients = [];
      for (let i = 1; i <= 15; i++) {
        const name = drink[`strIngredient${i}`];
        const measure = drink[`strMeasure${i}`];
        if (name) {
          ingredients.push({ name, measure: measure || '' });
        }
      }
      return {
        idDrink: drink.idDrink,
        strDrink: drink.strDrink,
        strDrinkThumb: drink.strDrinkThumb,
        strInstructions: drink.strInstructions,
        strGlass: drink.strGlass,
        ingredients
      };
    } catch (error) {
      console.error('Error fetching random cocktail:', error);
      return null;
    }
  }
};
