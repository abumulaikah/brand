import { GoogleGenAI } from "@google/genai";

function valueOrPlaceholder(value: string | undefined, placeholder = "belum didefinisikan") {
  return value?.trim() || placeholder;
}

function generateStarterFoundation(answers: Record<string, string>) {
  const brandName = valueOrPlaceholder(answers.brandName, "Brand ini");
  const productProblem = valueOrPlaceholder(answers.productProblem);
  const difference = valueOrPlaceholder(answers.difference);
  const targetPain = valueOrPlaceholder(answers.targetPain);
  const economicStatus = valueOrPlaceholder(answers.economicStatus);
  const buyingMotivation = valueOrPlaceholder(answers.buyingMotivation);
  const competitors = valueOrPlaceholder(answers.competitors);
  const elevatorPitch = valueOrPlaceholder(answers.elevatorPitch);
  const personaTraits = valueOrPlaceholder(answers.personaTraits);
  const toneVoice = valueOrPlaceholder(answers.toneVoice);

  return `### 1. Brand Summary
${brandName} adalah brand yang berangkat dari masalah: ${productProblem}. Brand ini ditujukan untuk ${targetPain}, dengan daya beli atau status ekonomi ${economicStatus}. Diferensiasi awalnya adalah ${difference}.

### 2. Positioning Starter
Untuk customer yang ${targetPain}, ${brandName} hadir sebagai pilihan yang membantu mereka menyelesaikan ${productProblem}. Tidak seperti ${competitors}, brand ini dapat menonjol melalui ${difference}.

### 3. Audience & Buying Context
- Status ekonomi / daya beli: ${economicStatus}
- Motivasi beli utama: ${buyingMotivation}
- Alternatif atau kompetitor: ${competitors}

### 4. Brand Personality Starter
- Kalimat pengenal: ${elevatorPitch}
- Karakter utama: ${personaTraits}
- Tone komunikasi: ${toneVoice}

### 5. Starter Point untuk Visual Identity
- Visual identity sebaiknya mengikuti daya beli customer, bukan sekadar selera visual.
- Jika customer membeli karena aspirasi atau lifestyle, desain perlu terasa lebih editorial, premium, dan punya detail khas.
- Jika customer membeli karena kebutuhan praktis, desain perlu lebih jelas, mudah dipahami, dan langsung menunjukkan manfaat.
- Diferensiasi visual utama sebaiknya berangkat dari: ${difference}.`;
}

export async function generateBrandFoundation(answers: Record<string, string>) {
  if (!process.env.GEMINI_API_KEY) {
    return generateStarterFoundation(answers);
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
    - Status ekonomi / daya beli customer
    - Motivasi beli utama: kebutuhan, aspirasi, atau lifestyle
    - Potensi positioning
    - Risiko branding
    - Saran diferensiasi

    ### 6. Starter Point untuk Visual Identity
    - Direction visual berdasarkan positioning, status ekonomi, motivasi beli, dan personality
    - Hindari meminta ulang gaya visual dari user; simpulkan sendiri dari strategi

    Use Indonesian language as requested.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Falling back to starter foundation:", error);
    return generateStarterFoundation(answers);
  }
}
