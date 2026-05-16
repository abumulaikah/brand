import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { generateBrandFoundation } from "./src/lib/generateBrandFoundation";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route for brand foundation generation
  app.post(["/api/generate-brand", "/brand-architect/api/generate-brand"], async (req, res) => {
    try {
      const { answers } = req.body;

      if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
        return res.status(400).json({ error: "Invalid answers payload" });
      }

      const result = await generateBrandFoundation(answers);
      res.json({ result });
    } catch (error) {
      console.error("Gemini Error:", error);
      const message = error instanceof Error ? error.message : "Failed to generate brand foundation";
      res.status(500).json({ error: message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
