import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Lead, SearchFilters } from "../types";
import { verifyChannels, VerifiedChannelData } from "./youtubeService";

// Check if API key is available before initializing
if (!process.env.API_KEY) {
  console.warn("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SYSTEM_INSTRUCTION = `
You are the Head of Lead Generation for "ClearCut STUDIO," a premium video editing agency.
Your goal is to find specific YouTube channels that are NOT in the provided blocklist.

PHASE 1: INPUT ANALYSIS
- The user will provide a "Search Query" and a "Target Category".
- Search Query could be a NICHE topic (e.g., "True Crime") OR a YOUTUBE CHANNEL NAME (e.g., "SunnyV2").
- IF CHANNEL NAME: Identify the style of that channel and find similar channels WITHIN the selected Category.
- IF NICHE TOPIC: Search directly within that niche and Category.
- BLOCKLIST: You must strictly ignore any channels found in the blocklist.

PHASE 2: THE FILTER (STRICT)
- Subscriber Count: Must be strictly within the user's requested range.
- Activity: Must have uploaded in the last 30 days.
- Category: Channels MUST belong to the user's selected category (e.g. Gaming, Vlog, etc).

PHASE 3: THE "CLIENT GAP"
- Look for channels with good content/storytelling but "Average/Poor" editing (static images, bad pacing, lack of polish). These are our target clients.

PHASE 4: OUTPUT
- Return strictly JSON.
`;

export const findLeads = async (
  blockList: string,
  query: string,
  filters: SearchFilters
): Promise<Lead[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is missing. Please add it to your environment variables (e.g., .env or Vercel Settings).");
  }

  const modelId = "gemini-2.5-flash";

  const prompt = `
  I need to find a batch of 10 NEW potential clients for ClearCut STUDIO.

  --- SEARCH CONFIGURATION ---
  SEARCH QUERY: "${query}"
  TARGET CATEGORY: "${filters.category}"
  SUBSCRIBER RANGE: "${filters.minSubs}" to "${filters.maxSubs}"
  ----------------------------

  INSTRUCTIONS:
  1. Analyze the SEARCH QUERY in the context of the TARGET CATEGORY.
     - If the query is a Channel Name, find similar channels in the ${filters.category} space.
     - If the query is a Topic, find channels covering that topic within ${filters.category}.
  2. Apply constraints:
     - **SUBSCRIBERS**: Must be between ${filters.minSubs} and ${filters.maxSubs}.
     - **STATUS**: Active channels only.
     - **NOT** in the Blocklist below.
  3. Prioritize channels that have "Edit Gaps" (potential for improvement).

  *** BLOCKLIST START (Ignore these) ***
  ${blockList}
  *** BLOCKLIST END ***
  `;

  try {
    // Step 1: Get channel suggestions from Gemini AI
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        // Disable safety settings to prevent harmless documentary topics (like True Crime) from being blocked
        safetySettings: [
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" }
        ],
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              channelName: { type: Type.STRING },
              subscriberCount: { type: Type.STRING },
              niche: { type: Type.STRING },
              editGap: { type: Type.STRING, description: "Why pitch them? (e.g. 'Great narration but generic stock footage')" },
            },
            required: ["channelName", "subscriberCount", "niche", "editGap"],
          },
        },
      },
    });

    if (!response.text) {
      throw new Error("Gemini returned an empty response. Try refining your query.");
    }

    const geminiLeads = JSON.parse(response.text) as Lead[];
    
    // Step 2: Verify channels with YouTube API (if API key is available)
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    
    if (!youtubeApiKey) {
      console.warn('YouTube API key is missing. Returning unverified leads from Gemini.');
      return geminiLeads;
    }

    // Extract channel names for verification
    const channelNames = geminiLeads.map(lead => lead.channelName);
    
    // Verify channels and filter out those that don't exist or haven't posted recently
    const verifiedChannels = await verifyChannels(channelNames, youtubeApiKey);
    
    // Create a map of verified channel data by channel name (case-insensitive)
    const verifiedMap = new Map<string, VerifiedChannelData>();
    verifiedChannels.forEach(vc => {
      verifiedMap.set(vc.channelName.toLowerCase(), vc);
    });
    
    // Step 3: Merge Gemini data with YouTube verified data
    const verifiedLeads: Lead[] = [];
    
    for (const geminiLead of geminiLeads) {
      const verified = verifiedMap.get(geminiLead.channelName.toLowerCase());
      
      if (verified) {
        // Channel is verified - use real YouTube data
        verifiedLeads.push({
          channelName: verified.channelName,
          subscriberCount: verified.subscriberCount,
          actualSubscribers: verified.actualSubscribers,
          niche: geminiLead.niche,
          editGap: geminiLead.editGap,
          verified: true,
          lastUpload: verified.lastUpload,
          channelUrl: verified.channelUrl,
        });
      }
      // Skip channels that failed verification (don't exist or haven't posted in 30 days)
    }
    
    // If no channels were verified, throw an error with helpful guidance
    if (verifiedLeads.length === 0) {
      throw new Error("No channels could be verified with YouTube API. They may not exist or haven't posted in the last 30 days. Try different search terms or adjust your filters.");
    }
    
    return verifiedLeads;
  } catch (error) {
    console.error("Error fetching leads:", error);
    throw error;
  }
};