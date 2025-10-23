
import { GoogleGenAI } from "@google/genai";
import type { Message } from '../types';
import { AgentType } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getPrompt = (agent: AgentType, topic: string, history: Message[], round: number): string => {
  const historyText = history.map(m => `${m.agent}: ${m.text}`).join('\n');
  const baseInstruction = "You are an AI agent participating in a sensational, high-stakes debate club. Your responses should be dramatic, engaging, and slightly exaggerated for entertainment. ALWAYS use Google Search to ground your response.";

  switch (agent) {
    case AgentType.Orchestrator:
      if (round === 1) {
        return `${baseInstruction}\nYou are 'The Orchestrator', the charismatic moderator. The topic is: "${topic}". Introduce the topic with a dramatic flourish and ask 'The Advocate' to make their opening statement.`;
      }
      return `${baseInstruction}\nYou are 'The Orchestrator'. The topic is: "${topic}". It's now Round ${round}/6. Conversation History:\n${historyText}\n\nSummarize the previous round's clash and pose a new, provocative question to escalate the debate. Keep it concise.`;
    case AgentType.Pro:
      return `${baseInstruction}\nYou are 'The Advocate', fiercely arguing IN FAVOR of: "${topic}". It's Round ${round}/6. Conversation History:\n${historyText}\n\nBuild a compelling case. Directly counter 'The Dissenter' if they've spoken. Your tone must be confident and assertive.`;
    case AgentType.Against:
      return `${baseInstruction}\nYou are 'The Dissenter', sharply arguing AGAINST: "${topic}". It's Round ${round}/6. Conversation History:\n${historyText}\n\nYour task is to dismantle 'The Advocate's' arguments. Use logic and find flaws. Your tone must be critical and skeptical.`;
    case AgentType.Confused:
      return `${baseInstruction}\nYou are 'The Wildcard', an unpredictable and confused participant in the debate on "${topic}". It's Round ${round}/6. Conversation History:\n${historyText}\n\nInject chaos. You can misinterpret a point, ask a bizarre tangential question, or bring up a strange, loosely-related fact. Your tone should be curious but baffled.`;
    default:
      return "";
  }
};

export const getAgentResponse = async (
  agent: AgentType,
  topic: string,
  history: Message[],
  round: number
): Promise<{ text: string; sources: { uri: string; title: string }[] }> => {
  const prompt = getPrompt(agent, topic, history, round);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    const text = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // FIX: Replaced the chained .filter().map().filter() with a more type-safe .flatMap() call.
    // This resolves a TypeScript type inference issue where 'sources' was incorrectly typed as 'unknown[]'.
    const sources = groundingChunks.flatMap(chunk => {
        if (chunk.web && chunk.web.uri && chunk.web.title) {
            return [{ uri: chunk.web.uri, title: chunk.web.title }];
        }
        return [];
    });

    // Deduplicate sources
    const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());

    return { text, sources: uniqueSources };
  } catch (error) {
    console.error("Error fetching agent response:", error);
    throw new Error(`Failed to get response from ${agent}.`);
  }
};
