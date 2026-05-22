
import { Cocktail } from '../lib/types';

const BASE_URL = 'https://www.thecocktaildb.com/api/json/v1/1';

interface CocktailDBDrink {
  idDrink: string;
  strDrink: string;
  strDrinkThumb: string;
  strInstructions: string;
  strGlass: string;
  [key: string]: string | null;
}

export const cocktailService = {
  async searchCocktails(query: string): Promise<Cocktail[]> {
    try {
      const response = await fetch(`${BASE_URL}/search.php?s=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (!data.drinks) return [];
      
      return (data.drinks as CocktailDBDrink[]).map((drink) => this.mapDrink(drink));
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
      return this.mapDrink(drink);
    } catch (error) {
      console.error('Error fetching random cocktail:', error);
      return null;
    }
  },

  async getCategories(): Promise<string[]> {
    try {
      const response = await fetch(`${BASE_URL}/list.php?c=list`);
      const data = await response.json();
      return data.drinks ? data.drinks.map((d: { strCategory: string }) => d.strCategory) : [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  async getGlasses(): Promise<string[]> {
    try {
      const response = await fetch(`${BASE_URL}/list.php?g=list`);
      const data = await response.json();
      return data.drinks ? data.drinks.map((d: { strGlass: string }) => d.strGlass) : [];
    } catch (error) {
      console.error('Error fetching glasses:', error);
      return [];
    }
  },

  async filterByCategory(category: string): Promise<Cocktail[]> {
    try {
      const response = await fetch(`${BASE_URL}/filter.php?c=${encodeURIComponent(category)}`);
      const data = await response.json();
      if (!data.drinks) return [];
      // Filter results only return basic info, we need to fetch full details for each or just return what we have
      // For now, let's just return mapped basic info (instructions will be missing)
      return data.drinks.map((d: { idDrink: string; strDrink: string; strDrinkThumb: string }) => ({
        idDrink: d.idDrink,
        strDrink: d.strDrink,
        strDrinkThumb: d.strDrinkThumb,
        strInstructions: '',
        strGlass: '',
        ingredients: []
      }));
    } catch (error) {
      console.error('Error filtering by category:', error);
      return [];
    }
  },

  async getCocktailById(id: string): Promise<Cocktail | null> {
    try {
      const response = await fetch(`${BASE_URL}/lookup.php?i=${id}`);
      const data = await response.json();
      if (!data.drinks) return null;
      return this.mapDrink(data.drinks[0]);
    } catch (error) {
      console.error('Error fetching cocktail by id:', error);
      return null;
    }
  },

  mapDrink(drink: CocktailDBDrink): Cocktail {
    const ingredients = [];
    for (let i = 1; i <= 15; i++) {
      const name = drink[`strIngredient${i}`];
      const measure = drink[`strMeasure${i}`];
      if (name) {
        ingredients.push({ name: name as string, measure: (measure as string) || '' });
      }
    }
    return {
      idDrink: drink.idDrink,
      strDrink: drink.strDrink,
      strDrinkThumb: drink.strDrinkThumb,
      strInstructions: drink.strInstructions,
      strGlass: drink.strGlass,
      ingredients,
      category: drink.strCategory as string
    };
  }
};
