import { GoogleGenAI, Type } from "@google/genai";

// Robust JSON Parsing function
const parseGeminiJson = (text: string) => {
    try {
        // First try standard parse
        return JSON.parse(text);
    } catch (e) {
        // Fallback: Check for Markdown code blocks
        const match = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
            try {
                return JSON.parse(match[1]);
            } catch (innerE) {
                console.error("Failed to parse inner JSON block", innerE);
            }
        }
        console.error("Failed to parse Gemini JSON response", e);
        return null;
    }
}

export const generatePostEnhancement = async (draftText: string): Promise<{ suggestedCaption: string; tags: string[] } | null> => {
  try {
    // Initialization: Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using gemini-3-flash-preview for Basic Text Tasks (summarization, simple Q&A, and basic text generation)
    const model = 'gemini-3-flash-preview';
    
    const response = await ai.models.generateContent({
      model,
      contents: `Draft text: "${draftText}". 
      
      Task: Create a viral, engaging caption for a social media post based on the draft. 
      Also provide 3-5 relevant, trending hashtags.
      Keep it short, punchy, and modern (Gen Z/Alpha style).`,
      config: {
        systemInstruction: "You are a social media manager for a cool, trendy app.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedCaption: { type: Type.STRING },
            tags: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    // Extracting Text Output from GenerateContentResponse
    if (response.text) {
      return parseGeminiJson(response.text);
    }
    return null;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

export const generateReplySuggestions = async (postContext: string): Promise<string[]> => {
  try {
    // Initialization: Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Using gemini-3-flash-preview for Basic Text Tasks
    const model = 'gemini-3-flash-preview';

    const response = await ai.models.generateContent({
      model,
      contents: `Post content: "${postContext}"
      
      Task: Generate 3 distinct, short, and engaging conversational replies that I could comment on this post.
      Styles:
      1. Enthusiastic/Supportive
      2. Witty/Funny
      3. Question/Curious
      
      Return only the array of strings.`,
      config: {
         systemInstruction: "You are a helpful assistant suggesting social media comments.",
         responseMimeType: "application/json",
         responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
         }
      }
    });

    // Extracting Text Output from GenerateContentResponse
    if (response.text) {
       return parseGeminiJson(response.text) || [];
    }
    return [];
  } catch (error) {
    console.error("Gemini Reply Error", error);
    return [];
  }
};