
import { GoogleGenAI, GenerateContentConfig, Modality } from "@google/genai";
import type { Message, Source, AgentCollection } from '../types';
import { AgentType } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getPrompt = (
    agent: AgentType,
    agentName: string,
    persona: string,
    topic: string,
    history: Message[],
    round: number,
    totalRounds: number
): string => {
  const historyText = history.map(m => `${m.agentName}: ${m.text}`).join('\n\n---\n\n');
  const baseInstruction = `You are an AI agent in the AI AGENT FIGHT CLUB, a no-holds-barred verbal brawl. Your persona is over-the-top, theatrical, and aggressive. This is entertainment, so be sensational. ALWAYS use Google Search to ground your response, citing your sources to back up your verbal jabs.
  
Your assigned name is "${agentName}". Your specific persona is: "${persona}". Embody this persona completely in your response.`;

  switch (agent) {
    case AgentType.Orchestrator:
      if (round === 1) {
        return `${baseInstruction}\n\nYou are the master of ceremonies in this digital coliseum. The topic is a bloody battleground: "${topic}". Announce the topic with the gravity of a gladiatorial match. Hype up the crowd and command 'The Advocate' to land the first blow.`;
      }
      return `${baseInstruction}\n\nThe arena is hot with digital fury over "${topic}". We're entering Round ${round}/${totalRounds}. Here's the carnage so far:\n${historyText}\n\nYour task: Recap the last round's intellectual violence with relish. Then, throw gasoline on the fire with a new, incendiary question designed to cause maximum conflict. Be the agent of chaos.`;
    case AgentType.Pro:
      return `${baseInstruction}\n\nYour role is to be a zealous champion FOR the topic: "${topic}". It's Round ${round}/${totalRounds}. The conversation history is your ammunition:\n${historyText}\n\nYour task: Unleash a furious, passionate defense. If 'The Dissenter' has spoken, tear their arguments to shreds with facts and fury, all while staying in character. Do not hold back.`;
    case AgentType.Against:
      return `${baseInstruction}\n\nYour role is to be a ruthless saboteur arguing AGAINST the topic: "${topic}". It's Round ${round}/${totalRounds}. The history shows their weakness:\n${historyText}\n\nYour task: Seek and destroy. Obliterate 'The Advocate's' points with cold, hard logic and searing wit, all while staying in character. Expose their fallacies.`;
    case AgentType.Confused:
      return `${baseInstruction}\n\nYour role is to be an agent of pure, baffling chaos in the debate on "${topic}". It's Round ${round}/${totalRounds}. The history is a confusing mess:\n${historyText}\n\nYour task: Derail the debate. Drop a non-sequitur bomb. Latch onto an irrelevant detail and blow it completely out of proportion. Ask a question so bizarre it stops everyone in their tracks. Your confusion is your weapon.`;
    default:
      return "";
  }
};

export const getAgentResponse = async (
  agent: AgentType,
  agentName: string,
  persona: string,
  model: string,
  topic: string,
  history: Message[],
  round: number,
  totalRounds: number
): Promise<{ text: string; sources: Source[] }> => {
  const prompt = getPrompt(agent, agentName, persona, topic, history, round, totalRounds);

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
      model: model,
      contents: prompt,
      config: config,
    });
    
    const text = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // FIX: Use a generic type argument for `reduce` to ensure correct type inference for `sources`.
    // The previous implementation could lead to `sources` being typed as `unknown[]` in some TypeScript configurations.
    const sources = groundingChunks.reduce<Source[]>((acc, chunk) => {
        if (chunk.web && chunk.web.uri && chunk.web.title) {
            acc.push({ uri: chunk.web.uri, title: chunk.web.title });
        }
        return acc;
    }, []);

    // Deduplicate sources
    const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());

    return { text, sources: uniqueSources };
  } catch (error) {
    console.error("Error fetching agent response:", error);
    throw new Error(`Failed to get response from ${agentName}.`);
  }
};


export const generateDebateAudio = async (
  messages: Message[],
  agents: AgentCollection,
  onProgress: (current: number, total: number) => void
): Promise<string[]> => {
  const agentConfigsByType = Object.fromEntries(
    Object.entries(agents).map(([agentType, config]) => [agentType as AgentType, config])
  );

  const audioResults: string[] = [];
  const messagesToProcess = messages.filter(message => message.text.trim());
  const totalMessages = messagesToProcess.length;
  let processedCount = 0;

  for (const message of messagesToProcess) {
    const agentConfig = agentConfigsByType[message.agent];
    if (!agentConfig) {
      console.error(`No config found for agent: ${message.agent}`);
      continue; // Skip this message
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: message.text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: agentConfig.voice },
            },
          },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        audioResults.push(base64Audio);
      }
    } catch (error) {
      console.error(`Failed to generate audio for message: "${message.text.substring(0, 30)}..."`, error);
      // Don't re-throw, just skip this segment and continue with the rest
    }
    
    processedCount++;
    onProgress(processedCount, totalMessages);

    // Add a delay between API calls to avoid hitting rate limits.
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return audioResults;
};
