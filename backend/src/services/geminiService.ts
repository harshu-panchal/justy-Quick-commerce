import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  // eslint-disable-next-line no-console
  console.warn("GEMINI_API_KEY is not set. Gemini service will be disabled.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateProductDescription(input: {
  name: string;
  category?: string;
  tags?: string[];
  existingDescription?: string;
}): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured on the server");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
You are helping a seller on an Indian quick‑commerce marketplace to write a clear, attractive product description.

Product name: ${input.name}
Category: ${input.category || "N/A"}
Tags/keywords: ${(input.tags || []).join(", ") || "N/A"}
Existing short description (if any): ${
    input.existingDescription || "N/A"
  }

Write a concise product description in simple, friendly English that:
- Focuses on real benefits for the buyer
- Stays within 3–5 short sentences
- Does NOT invent fake specifications, claims, or certifications
- Avoids any medical, health cure, or misleading claims
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  if (!text) {
    throw new Error("Gemini did not return any content");
  }

  return text;
}

