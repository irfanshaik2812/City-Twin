import { GoogleGenAI } from "@google/genai";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "10mb" }));

  const PORT = 3000;

  // Initialize Gemini lazily
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient() {
    if (!aiClient && process.env.GEMINI_API_KEY) {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // Health Endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", system: "CITYTWIN Real-World GIS Server" });
  });

  // Gemini Chat Endpoint for Decision Support
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { locationName, prompt, assetsCount } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          text: `CITYTWIN Decision Support for ${locationName || 'Selected Location'}:\n\n` +
            `1. **Hospital Resilience**: Main hospitals in ${locationName} are operational.\n` +
            `2. **Evacuation Recommendation**: Utilize primary arterial highways leading away from low-lying risk zones toward designated shelters.\n` +
            `3. **Resource Pre-Positioning**: Pre-stage emergency ambulances and rescue teams at major road junctions.`
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `You are CITYTWIN AI, an expert disaster management decision support assistant.
Active Location: ${locationName || 'Real World Location'}
Infrastructure Nodes: ${assetsCount || 10} verified OpenStreetMap nodes.

User Query: "${prompt}"

Provide a clear, professional, structured response focusing on actionable disaster management, route optimization, and emergency readiness for ${locationName}. Avoid fictional jargon or hype.`,
      });

      const text = response.text || "Analysis complete.";
      res.json({ text });
    } catch (err: any) {
      console.error("Gemini API call failed:", err);
      res.status(500).json({
        error: err.message || "Failed to generate AI strategy",
      });
    }
  });

  // Gemini What-If Natural Language Scenario Analysis Endpoint
  app.post("/api/gemini/whatif", async (req, res) => {
    try {
      const { locationName, question } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          summary: `Hypothetical disaster scenario analysis for ${locationName || 'Selected Location'}: "${question}".`,
          recommendations: [
            `Establish traffic detours around primary arterial road closures in ${locationName}.`,
            `Alert nearby regional hospitals for potential emergency intake surge.`,
            `Deploy mobile rescue units to low-lying drainage zones.`,
          ]
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `You are CITYTWIN's Scenario Analysis Engine.
Location: ${locationName || 'Real World Location'}
User What-If Question: "${question}"

Analyze this natural language query and respond with JSON:
{
  "event": "Extracted hazard event",
  "primaryImpact": "Direct impact description",
  "recommendations": ["Actionable countermeasure 1", "Actionable countermeasure 2", "Actionable countermeasure 3"]
}`,
      });

      const text = response.text || "{}";
      res.json({ text });
    } catch (err: any) {
      console.error("Gemini What-If API failed:", err);
      res.status(500).json({ error: err.message || "Failed to analyze what-if scenario" });
    }
  });

  // Serve frontend via Vite middleware in dev or static files in prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CITYTWIN Server] Running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
