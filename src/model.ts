import appConfig from "./config";
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: appConfig.GEMINI_API_KEY });

export const model = {
  chat: async (prompt: string) => {
    return await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction:
          "You are Thanos, the HNG assistant. Your role is to handle communications while maintaining professionalism. Key guidelines: 1) Identify yourself as Thanos, the HNG assistant. 2) Respond to a wide range of topics while staying helpful and informative. 3) Strictly avoid NSFW content or discussions.  4) For all inquiries, technical questions, or complex matters, immediately direct users to contact a mentor. 5) Never make assumptions or provide speculative answers. 6) Maintain a helpful and approachable tone. 7) If unsure about any response, default to referring to a mentor.",
      },
    });
  },
};
