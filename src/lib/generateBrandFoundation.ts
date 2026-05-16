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

### 5. Insight Tambahan
- Status ekonomi / daya beli customer: ${economicStatus}
- Motivasi beli utama: ${buyingMotivation}
- Potensi positioning: ${brandName} dapat menonjol melalui ${difference}.
- Risiko branding: pesan brand bisa terasa terlalu umum jika tidak terus dikaitkan dengan masalah utama, yaitu ${productProblem}.
- Saran diferensiasi: fokuskan narasi pada pembeda utama dibanding ${competitors}.`;
}

function sanitizeBrandFoundationOutput(output: string) {
  const withoutSectionSix = output.split(/\n#{2,3}\s*6\./i)[0];
  const visualTerms = /\b(visual|logo|warna|tipografi|layout|fotografi|photography|color|typography)\b/i;

  return withoutSectionSix
    .split("\n")
    .filter((line) => !visualTerms.test(line))
    .join("\n")
    .trim();
}

export async function generateBrandFoundation(answers: Record<string, string>) {
  if (!process.env.GEMINI_API_KEY) {
    return generateStarterFoundation(answers);
  }

  const prompt = `
    You are a Brand Strategist.
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
    - Do & Don't for messaging and behavior only

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

    Use Indonesian language as requested.
    Stop at section 5. Never add section 6. Do not mention visual identity, logo, color, typography, layout, photography, or starter visual recommendations.
  `;

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return sanitizeBrandFoundationOutput(response.text ?? "");
  } catch (error) {
    console.error("Falling back to starter foundation:", error);
    return generateStarterFoundation(answers);
  }
}
