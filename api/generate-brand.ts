import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateBrandFoundation } from "../src/lib/generateBrandFoundation";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { answers } = req.body;

    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return res.status(400).json({ error: "Invalid answers payload" });
    }

    const result = await generateBrandFoundation(answers);
    return res.status(200).json({ result });
  } catch (error) {
    console.error("Gemini Error:", error);
    return res.status(500).json({ error: "Failed to generate brand foundation" });
  }
}
