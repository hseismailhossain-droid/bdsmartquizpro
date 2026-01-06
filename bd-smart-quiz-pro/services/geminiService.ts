
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Language } from "./translations";

/**
 * Generates MCQs for a specific subject using Gemini AI.
 */
export async function generateQuestions(subject: string, count: number = 10, lang: Language = 'bn', retryCount: number = 1) {
  // Always use a named parameter and direct process.env.API_KEY access as per @google/genai guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const attemptGeneration = async (currentCount: number): Promise<any> => {
    try {
      const languageName = lang === 'bn' ? 'Bengali' : 'English';
      
      const fetchPromise = ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Topic: ${subject}. Generate ${currentCount} multiple choice questions in ${languageName} language. 
        Each question must include: 'question' text, 'options' (an array of 4 unique strings), 'correctAnswer' (0-3 index), and a very brief 'explanation' (max 20 words).
        Return valid JSON in the specified schema. Ensure educational accuracy and consistency.`,
        config: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
          maxOutputTokens: 8000, // Increased to support 50-100 questions without timeout
          temperature: 0.7,
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
              },
              required: ["question", "options", "correctAnswer"]
            }
          }
        }
      });

      // Increased timeout to allow generation of large counts (120s is reasonable for 50-100 items)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("AI_TIMEOUT")), 150000)
      );

      const response: GenerateContentResponse = await Promise.race([fetchPromise, timeoutPromise]) as GenerateContentResponse;
      // Use the .text property to extract text output as per @google/genai guidelines.
      const text = response.text;
      if (!text) throw new Error("EMPTY_RESPONSE");

      return JSON.parse(text);
    } catch (error: any) {
      console.error("Generation error:", error.message);
      throw error;
    }
  };

  for (let i = 0; i <= retryCount; i++) {
    try {
      // First attempt with full count, second with smaller count if fails
      const adjustedCount = i === 0 ? count : Math.min(count, 15);
      return await attemptGeneration(adjustedCount);
    } catch (error: any) {
      if (i === retryCount) return { error: "FAILED", details: error.message };
      // Wait before retry
      await new Promise(res => setTimeout(res, 2000));
    }
  }
}
