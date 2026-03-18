import { GoogleGenAI } from "@google/genai";

type EnhanceResult = { buffer: Buffer; mimeType: string };

function toBase64(buffer: Buffer) {
  return buffer.toString("base64");
}

function normalizeMimeType(mimeType: string | undefined): string {
  const m = (mimeType || "").toLowerCase().trim();
  if (m === "image/jpg") return "image/jpeg";
  if (m.startsWith("image/")) return m;
  return "image/png";
}

/**
 * Enhances a product main image using Gemini image editing (image-to-image).
 * Output is expected to be a clean, centered product image suitable for listing.
 */
export async function enhanceProductMainImageWithGemini(opts: {
  inputBuffer: Buffer;
  inputMimeType?: string;
}): Promise<EnhanceResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server");
  }

  const ai = new GoogleGenAI({ apiKey });

  const inputMimeType = normalizeMimeType(opts.inputMimeType);
  const base64Image = toBase64(opts.inputBuffer);

  // Use an image-capable model that supports image output.
  // (Preview model names can change; keep this centralized for easy updates.)
  const model = "gemini-3-pro-image-preview";

  const instruction = [
    "Enhance this product photo for an e-commerce listing:",
    "- Remove noise and improve clarity",
    "- Improve lighting and colors naturally (no over-saturation)",
    "- Keep the product shape accurate (do not invent details)",
    "- Center the product and make background clean white",
    "- Output a square image suitable for listing (around 800x800)",
  ].join("\n");

  // NOTE: @google/genai's TS types around `interactions` are stricter than the
  // documented examples and change frequently. We keep runtime payload aligned
  // with the docs and cast to any for compatibility.
  const interaction = (await (ai as any).interactions.create({
    model,
    input: [
      { type: "text", text: instruction },
      { type: "image", data: base64Image, mime_type: inputMimeType },
    ],
    response_modalities: ["image"],
  })) as any;

  const outputs: any[] = interaction?.outputs || [];
  const imageOut = outputs.find((o: any) => o?.type === "image" && o?.data);
  if (!imageOut) {
    throw new Error("Gemini did not return an enhanced image");
  }

  const outMime = normalizeMimeType(imageOut.mime_type);
  const outBuffer = Buffer.from(String(imageOut.data), "base64");

  return { buffer: outBuffer, mimeType: outMime };
}

