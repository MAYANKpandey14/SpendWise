import { GoogleGenAI, Type } from "@google/genai";
import { ExpenseFormData } from "../types";

// NOTE: Ideally this is handled on a backend edge function to protect the key.
// For this client-side demo, we use the env var directly.
const API_KEY = process.env.API_KEY || '';

export const analyzeReceipt = async (base64Image: string): Promise<Partial<ExpenseFormData> | null> => {
  if (!API_KEY) {
    console.warn("Gemini API Key missing");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const prompt = "Extract the merchant name, total amount, date, and suggest a category ID (food, transport, housing, utilities, health, shopping, work, entertainment) from this receipt. Return JSON.";

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
                date: { type: Type.STRING, description: "YYYY-MM-DD format" },
                categoryId: { type: Type.STRING, enum: ["food", "transport", "housing", "utilities", "health", "shopping", "work", "entertainment"] }
            },
            required: ["merchant", "amount", "date"]
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
      currency: 'USD' // Default
    };

  } catch (error) {
    console.error("Error analyzing receipt with Gemini:", error);
    return null;
  }
};
