import { GoogleGenAI } from "@google/genai";

export async function generateBrandFoundation(answers: Record<string, string>) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "brand-architect",
      },
    },
  });

  const prompt = `
    You are a Brand Strategist & Creative Director.
    Based on the followings answers for a brand questionnaire, generate a structured brand foundation.

    Questionnaire Answers:
    ${JSON.stringify(answers, null, 2)}

    Please provide the output in the following format (Markdown):

    ### 1. Brand Summary
    [Brand Name] adalah brand yang berfokus pada [problem] untuk [target audience], dengan pendekatan [unique value].

    ### 2. Positioning Statement
    Untuk [target audience],
    yang membutuhkan [problem],
    [brand] adalah [category]
    yang memberikan [benefit],
    tidak seperti [competitor],
    kami [differentiation].

    ### 3. Brand Personality
    - 3 karakter utama
    - Tone komunikasi
    - Do & Don't

    ### 4. Brand Voice
    - Gaya komunikasi
    - Contoh kalimat
    - Kata yang direkomendasikan
    - Kata yang harus dihindari

    ### 5. Insight Tambahan
    - Potensi positioning
    - Risiko branding
    - Saran diferensiasi

    Use Indonesian language as requested.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text;
}
