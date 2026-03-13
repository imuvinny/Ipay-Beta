import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function parsePaymentIntent(scannedData: string): Promise<{ recipient?: string; amount?: number; error?: string }> {
    try {
        const prompt = `
        Analyze the following text scanned from a QR code or NFC tag for a payment app.
        Extract the recipient (username, phone, or ID) and amount if present.
        Return a JSON object with keys: "recipient" (string, optional), "amount" (number, optional).
        If the text is just a username/phone, return that as recipient.
        If the text is a payment URI (e.g. payment:user?amount=10), extract both.
        
        Text: "${scannedData}"
        `;

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite-latest",
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });
        
        const text = result.text;
        if (!text) return { error: "No response from AI" };
        
        return JSON.parse(text);
    } catch (error) {
        console.error("AI Parsing Error:", error);
        return { error: "Failed to parse data" };
    }
}
