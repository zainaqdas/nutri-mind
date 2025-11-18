export enum LogType {
  FOOD = 'FOOD',
  EXERCISE = 'EXERCISE'
}

export interface Macros {
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
}

export interface Micros {
  // General
  fiber: number; // grams
  sodium: number; // mg

  // Vitamins
  vitaminA: number; // mcg
  vitaminC: number; // mg
  vitaminD: number; // mcg
  vitaminE: number; // mg
  vitaminK: number; // mcg

  // B-Complex
  vitaminB1: number; // mg (Thiamin)
  vitaminB2: number; // mg (Riboflavin)
  vitaminB3: number; // mg (Niacin)
  vitaminB5: number; // mg (Pantothenic Acid)
  vitaminB6: number; // mg (Pyridoxine)
  vitaminB7: number; // mcg (Biotin)
  vitaminB9: number; // mcg (Folate)
  vitaminB12: number; // mcg (Cobalamin)

  // Minerals
  calcium: number; // mg
  iron: number; // mg
  magnesium: number; // mg
  potassium: number; // mg
  zinc: number; // mg
  phosphorus: number; // mg
  selenium: number; // mcg
  copper: number; // mg
  manganese: number; // mg
}

export interface DailyLog {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  timestamp: number;
  type: LogType;
  description: string;
  calories: number;
  macros: Macros;
  micros: Micros;
  sourceUrls?: string[]; // From Google Search grounding
}

export interface WeightLog {
  id: string;
  date: string; // YYYY-MM-DD
  weight: number; // kg
}

export interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  micros: Micros;
}

export interface UserProfile {
  name: string;
  email?: string;
  height: number; // cm
  weight: number; // kg
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active';
}

export type ViewState = 'dashboard' | 'weight' | 'profile' | 'monthly';