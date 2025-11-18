import { GoogleGenAI } from "@google/genai";
import { LogType, Macros, Micros } from "../types";

const apiKey = process.env.API_KEY;

interface AnalysisResult {
  type: LogType;
  item_name: string;
  calories: number;
  macros: Macros;
  micros: Micros;
  confidence_score: number;
}

export const analyzeTextEntry = async (text: string): Promise<{ results: AnalysisResult[], sources: string[] }> => {
  if (!apiKey) {
    throw new Error("API Key not found in environment");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Prompt Engineering: Updated to request full micronutrient profile
  const systemPrompt = `
    You are an expert nutritionist and fitness tracker AI.
    Your goal is to analyze the user's natural language input (which could be about food or exercise) and return structured nutritional data.
    
    1. Decide if the input is FOOD or EXERCISE.
    2. If the user enters multiple items (e.g. "eggs and toast"), separate them into individual objects.
    3. If FOOD: Estimate calories, macros, and a COMPREHENSIVE list of micronutrients including Vitamins A,C,D,E,K, full B-Complex, and essential minerals.
    4. If EXERCISE: Estimate calories burned (negative value in your logic, but return positive number here). Macros/Micros should be 0.
    5. If the user mentions specific brands or foods you aren't sure about, use the Google Search tool to find accurate data.
    6. Return the data strictly in the following JSON ARRAY format inside a markdown code block.
    
    JSON Structure:
    [
      {
        "type": "FOOD" or "EXERCISE",
        "item_name": "Specific item name (e.g. '1 large egg')",
        "calories": number,
        "macros": { "protein": number, "carbs": number, "fat": number },
        "micros": {
          "fiber": number, "sodium": number,
          "vitaminA": number, "vitaminC": number, "vitaminD": number, "vitaminE": number, "vitaminK": number,
          "vitaminB1": number, "vitaminB2": number, "vitaminB3": number, "vitaminB5": number, "vitaminB6": number, "vitaminB7": number, "vitaminB9": number, "vitaminB12": number,
          "calcium": number, "iron": number, "magnesium": number, "potassium": number, "zinc": number, "phosphorus": number, "selenium": number, "copper": number, "manganese": number
        },
        "confidence_score": number (0-1)
      }
    ]

    All micronutrients units:
    - Grams: fiber
    - Milligrams (mg): sodium, vitaminC, vitaminE, vitaminB1, vitaminB2, vitaminB3, vitaminB5, vitaminB6, calcium, iron, magnesium, potassium, zinc, phosphorus, copper, manganese
    - Micrograms (mcg): vitaminA, vitaminD, vitaminK, vitaminB7, vitaminB9, vitaminB12, selenium

    Important: Return valid JSON Array only inside the code block. Use 0 for any value you strictly cannot estimate, but try to estimate based on standard nutritional data.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: text,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ googleSearch: {} }],
      },
    });

    const responseText = response.text;
    
    // Extract URLs from grounding metadata if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: string[] = groundingChunks
      .map(chunk => chunk.web?.uri)
      .filter((uri): uri is string => !!uri);

    // Parse JSON from Markdown code block
    const jsonMatch = responseText?.match(/```json\n([\s\S]*?)\n```/) || responseText?.match(/```([\s\S]*?)```/);
    let jsonData: AnalysisResult[];

    if (jsonMatch && jsonMatch[1]) {
      const parsed = JSON.parse(jsonMatch[1]);
      // Ensure it's an array, even if model returns single object by mistake
      jsonData = Array.isArray(parsed) ? parsed : [parsed];
    } else {
      try {
        const parsed = JSON.parse(responseText || "[]");
        jsonData = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        console.error("Failed to parse Gemini response", responseText);
        throw new Error("Could not understand the food entry. Please try again.");
      }
    }

    return { results: jsonData, sources };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};