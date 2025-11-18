import { DailyGoals, UserProfile } from "./types";

export const DEFAULT_GOALS: DailyGoals = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
  micros: {
    // General
    fiber: 30,
    sodium: 2300,

    // Vitamins
    vitaminA: 900,
    vitaminC: 90,
    vitaminD: 15,
    vitaminE: 15,
    vitaminK: 120,

    // B-Complex
    vitaminB1: 1.2,
    vitaminB2: 1.3,
    vitaminB3: 16,
    vitaminB5: 5,
    vitaminB6: 1.3,
    vitaminB7: 30,
    vitaminB9: 400,
    vitaminB12: 2.4,

    // Minerals
    calcium: 1000,
    iron: 18, // Using higher standard to cover women's RDA (18mg) vs men (8mg)
    magnesium: 400,
    potassium: 3400,
    zinc: 11,
    phosphorus: 700,
    selenium: 55,
    copper: 0.9,
    manganese: 2.3
  }
};

export const DEFAULT_PROFILE: UserProfile = {
  name: "User",
  height: 175,
  weight: 75,
  age: 30,
  gender: 'male',
  activityLevel: 'moderate'
};

export const MOCK_WEIGHT_DATA = [
  { date: '2023-10-01', weight: 78.5 },
  { date: '2023-10-08', weight: 77.9 },
  { date: '2023-10-15', weight: 77.2 },
  { date: '2023-10-22', weight: 76.8 },
  { date: '2023-10-29', weight: 76.1 },
  { date: '2023-11-05', weight: 75.5 },
  { date: '2023-11-12', weight: 75.0 },
];