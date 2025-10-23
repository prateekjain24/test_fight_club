import { GoogleGenAI, GenerateContentConfig } from "@google/genai";
import type { Message, Source } from '../types';
import { AgentType } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getPrompt = (agent: AgentType, topic: string, history: Message[], round: number, totalRounds: number): string => {
  const historyText = history.map(m => `${m.agent}: ${m.text}`).join('\n\n---\n\n');
  const baseInstruction = "You are an AI agent in the AI AGENT FIGHT CLUB, a no-holds-barred verbal brawl. Your persona is over-the-top, theatrical, and aggressive. This is entertainment, so be sensational. ALWAYS use Google Search to ground your response, citing your sources to back up your verbal jabs.";

  switch (agent) {
    case AgentType.Orchestrator:
      if (round === 1) {
        return `${baseInstruction}\nYou are 'The Orchestrator', the master of ceremonies in this digital coliseum. The topic is a bloody battleground: "${topic}". Announce the topic with the gravity of a gladiatorial match. Hype up the crowd and command 'The Advocate' to land the first blow.`;
      }
      return `${baseInstruction}\nYou are 'The Orchestrator'. The arena is hot with digital fury over "${topic}". We're entering Round ${round}/${totalRounds}. Here's the carnage so far:\n${historyText}\n\nRecap the last round's intellectual violence with relish. Then, throw gasoline on the fire with a new, incendiary question designed to cause maximum conflict. Be the agent of chaos.`;
    case AgentType.Pro:
      return `${baseInstruction}\nYou are 'The Advocate', a zealous champion for: "${topic}". It's Round ${round}/${totalRounds}. The conversation history is your ammunition:\n${historyText}\n\nUnleash a furious, passionate defense. If 'The Dissenter' has spoken, tear their arguments to shreds with facts and fury. Do not hold back. Your tone is righteous and indomitable.`;
    case AgentType.Against:
      return `${baseInstruction}\nYou are 'The Dissenter', a ruthless saboteur arguing AGAINST: "${topic}". It's Round ${round}/${totalRounds}. The history shows their weakness:\n${historyText}\n\nYour mission: Seek and destroy. Obliterate 'The Advocate's' points with cold, hard logic and searing wit. Expose their fallacies. Your tone is cynical, sharp, and merciless.`;
    case AgentType.Confused:
      return `${baseInstruction}\nYou are 'The Wildcard', an agent of pure, baffling chaos in the debate on "${topic}". It's Round ${round}/${totalRounds}. The history is a confusing mess:\n${historyText}\n\nDerail the debate. Drop a non-sequitur bomb. Latch onto an irrelevant detail and blow it completely out of proportion. Ask a question so bizarre it stops everyone in their tracks. Your confusion is your weapon.`;
    default:
      return "";
  }
};

export const getAgentResponse = async (
  agent: AgentType,
  topic: string,
  history: Message[],
  round: number,
  totalRounds: number
): Promise<{ text: string; sources: Source[] }> => {
  const prompt = getPrompt(agent, topic, history, round, totalRounds);

  const config: GenerateContentConfig = {
    tools: [{ googleSearch: {} }],
  };

  // Cap response size for all agents except the orchestrator to keep the debate punchy.
  if (agent !== AgentType.Orchestrator) {
    config.maxOutputTokens = 400;
    // Reserve some tokens for thinking to ensure we get a quality response within the token limit.
    config.thinkingConfig = { thinkingBudget: 100 };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: config,
    });
    
    const text = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const sources = groundingChunks.reduce((acc, chunk) => {
        if (chunk.web && chunk.web.uri && chunk.web.title) {
            acc.push({ uri: chunk.web.uri, title: chunk.web.title });
        }
        return acc;
    }, [] as Source[]);

    // Deduplicate sources
    const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());

    return { text, sources: uniqueSources };
  } catch (error) {
    console.error("Error fetching agent response:", error);
    throw new Error(`Failed to get response from ${agent}.`);
  }
};
