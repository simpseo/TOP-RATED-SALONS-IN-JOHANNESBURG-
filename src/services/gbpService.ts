/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";

// Always use process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export interface SyncResult {
  rating: number;
  reviewCount: number;
  success: boolean;
  message?: string;
}

/**
 * Syncs Google Business Profile data using Gemini with Google Search tool.
 */
export async function syncGBPData(businessName: string, gbpLink?: string): Promise<SyncResult> {
  const prompt = `
    Task: Extract current Google Business Profile data for "${businessName}".
    ${gbpLink ? `Reference Link: ${gbpLink}` : ""}
    
    Instructions: Use Google Search to find the official Google Maps/GBP entry for this business.
    Return ONLY a JSON object with:
    - rating: number (e.g. 4.8)
    - reviewCount: number (e.g. 150)
    - lastSyncedAt: string (ISO date)
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rating: { type: Type.NUMBER },
            reviewCount: { type: Type.NUMBER },
            lastSyncedAt: { type: Type.STRING }
          },
          required: ["rating", "reviewCount"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    
    if (result.rating !== undefined && result.reviewCount !== undefined) {
      return {
        rating: result.rating,
        reviewCount: result.reviewCount,
        success: true
      };
    }
    
    return { rating: 0, reviewCount: 0, success: false, message: "Could not find reliable data." };
  } catch (error) {
    console.error("GBP Sync Error:", error);
    return { rating: 0, reviewCount: 0, success: false, message: "Sync failed. Please check the GBP link." };
  }
}
