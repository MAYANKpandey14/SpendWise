import { GoogleGenAI, Type } from "@google/genai";
import { ExpenseFormData } from "../types";

export const analyzeReceipt = async (base64Image: string): Promise<Partial<ExpenseFormData> | null> => {
  // Helper to safely access env vars in Vite or Node environments
  const getEnv = (key: string, viteKey: string) => {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      return (import.meta as any).env[viteKey] || (import.meta as any).env[key] || '';
    }
    if (typeof process !== 'undefined' && process.env) {
      return process.env[viteKey] || process.env[key] || '';
    }
    return '';
  };

  const apiKey = getEnv('API_KEY', 'VITE_GEMINI_API_KEY');

  if (!apiKey) {
    console.warn("Gemini API Key missing");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    const prompt = "Extract the merchant name, total amount, currency code (e.g. INR, USD, EUR), date, and suggest a category ID (food, transport, housing, utilities, health, shopping, work, entertainment) from this receipt. Return JSON.";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                merchant: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                currency: { type: Type.STRING, description: "Currency code e.g. INR, USD, EUR" },
                date: { type: Type.STRING, description: "YYYY-MM-DD format" },
                categoryId: { type: Type.STRING, enum: ["food", "transport", "housing", "utilities", "health", "shopping", "work", "entertainment"] }
            },
            required: ["merchant", "amount", "date", "currency"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;

    const data = JSON.parse(text);
    return {
      merchant: data.merchant,
      amount: data.amount,
      date: data.date,
      categoryId: data.categoryId,
      currency: data.currency || 'INR' // Use extracted currency or default to INR
    };

  } catch (error) {
    console.error("Error analyzing receipt with Gemini:", error);
    return null;
  }
};