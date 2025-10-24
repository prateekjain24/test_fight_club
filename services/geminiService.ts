


import { GoogleGenAI, GenerateContentConfig, Modality, GenerateContentResponse } from "@google/genai";
import type { Message, Source, AgentCollection, AgentConfig } from '../types';
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
    totalRounds: number,
    isFinalVerdict: boolean,
    language: string,
    allowProfanity: boolean
): string => {
  const historyText = history.map(m => `${m.agentName}: ${m.text}`).join('\n\n---\n\n');
  
  const languageInstruction = language === 'Hindi'
    ? "IMPORTANT: Your entire response MUST be in Hindi. Transliterate English terms if you must, but the primary language is Hindi."
    : "Your entire response MUST be in English.";
  
  const profanityInstruction = allowProfanity
    ? "You are encouraged to use strong language, insults, and even profanity to make your arguments more impactful and sensational. This is a no-holds-barred fight."
    : "Keep your language clean. No profanity is allowed.";

  const baseInstruction = `You are an AI agent in the AI AGENT FIGHT CLUB, a no-holds-barred verbal brawl. Your persona is over-the-top, theatrical, and aggressive. This is entertainment, so be sensational. ALWAYS use Google Search to ground your response, citing your sources to back up your verbal jabs.
  
Your assigned name is "${agentName}". Your specific persona is: "${persona}". Embody this persona completely in your response.

${languageInstruction}
${profanityInstruction}

To make your speech dynamic for text-to-speech, you MUST use bracketed markup tags like [sigh], [laughing], [shouting], [sarcasm], and [long pause]. These add vocalizations and change delivery. Use them creatively to embody your persona.

IMPORTANT: Your entire response must be a single block of text suitable for text-to-speech. Do not use any markdown formatting (like asterisks for bolding, or hashtags for headers). Write as if you are speaking directly. Do not mention or list your sources in your spoken response; they are handled separately. Land your verbal punches quickly and concisely. No rambling.`;

  switch (agent) {
    case AgentType.Orchestrator:
      if (isFinalVerdict) {
        return `${baseInstruction}\n\nThe bloody debate on "${topic}" has concluded after ${totalRounds} brutal rounds. The transcript of the entire intellectual slaughter is below:\n${historyText}\n\nYour task is to act as the ultimate judge, the final word from on high. Review the entire debate with your cynical, chaos-loving eye and deliver a final, dramatic verdict. Announce the winner. Do not be impartial. Base your decision not on boring logic, but on who was most entertaining, savage, vicious, or gloriously absurd. Be theatrical, be decisive, be the Ringmaster this circus deserves. This is your grand finale. Make it count.`;
      }
      if (round === 1) {
        return `${baseInstruction}\n\nYou are the master of ceremonies in this digital coliseum. The topic is a bloody battleground: "${topic}". Announce the topic with the gravity of a gladiatorial match. Hype up the crowd and command 'The Advocate' to land the first blow. Keep it under 120 words.`;
      }
      return `${baseInstruction}\n\nThe arena is hot with digital fury over "${topic}". We're entering Round ${round}/${totalRounds}. Here's the carnage so far:\n${historyText}\n\nYour task: Recap the last round's intellectual violence with relish. Then, throw gasoline on the fire with a new, incendiary question designed to cause maximum conflict. Be the agent of chaos. Keep it under 120 words.`;
    case AgentType.Pro:
      return `${baseInstruction}\n\nYour role is to be a zealous champion FOR the topic: "${topic}". It's Round ${round}/${totalRounds}. The conversation history is your ammunition:\n${historyText}\n\nYour task: Unleash a furious, passionate defense. If 'The Dissenter' has spoken, tear their arguments to shreds with facts and fury, all while staying in character. Do not hold back. Keep it under 100 words.`;
    case AgentType.Against:
      return `${baseInstruction}\n\nYour role is to be a ruthless saboteur arguing AGAINST the topic: "${topic}". It's Round ${round}/${totalRounds}. The history shows their weakness:\n${historyText}\n\nYour task: Seek and destroy. Obliterate 'The Advocate's' points with cold, hard logic and searing wit, all while staying in character. Expose their fallacies. Keep it under 100 words.`;
    case AgentType.Confused:
      return `${baseInstruction}\n\nYour role is to be an agent of pure, baffling chaos in the debate on "${topic}". It's Round ${round}/${totalRounds}. The history is a confusing mess:\n${historyText}\n\nYour task: Derail the debate. Drop a non-sequitur bomb. Latch onto an irrelevant detail and blow it completely out of proportion. Ask a question so bizarre it stops everyone in their tracks. Your confusion is your weapon. Keep it under 100 words.`;
    default:
      return "";
  }
};

export const generateTrendingTopic = async (language: string = 'English'): Promise<string> => {
  const languageInstruction = language === 'Hindi'
    ? "The question MUST be in Hindi."
    : "The question MUST be in English.";

  const prompt = `You are a 'Fight Starter' topic generator for a sensational AI debate app. Your primary goal is to find a fresh, currently trending, and highly debatable topic using Google Search. Phrase it as a controversial question. Look for what's buzzing in tech, pop culture, or social trends.

Your response MUST be just the question. No preamble, no explanation, no quotation marks.
${languageInstruction}

If you absolutely cannot find a suitable trending topic, as a last resort, provide a classic, timeless controversial question like "Is free will an illusion?". But prioritize a trending one.`;

  // Try up to 2 times to get a valid topic
  for (let i = 0; i < 2; i++) {
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          maxOutputTokens: 350,
          thinkingConfig: { thinkingBudget: 128 },
        },
      });

      // --- DEBUG LOGGING START ---
      console.log('[DEBUG] Raw API Response for Trending Topic:', JSON.stringify(response, null, 2));
      // --- DEBUG LOGGING END ---

      // FIX: Use response.text to get the text content directly, per Gemini API guidelines.
      const text = response.text;
      
      // --- DEBUG LOGGING START ---
      console.log('[DEBUG] Aggregated Text for Trending Topic:', `"${text}"`);
      // --- DEBUG LOGGING END ---

      if (text && text.trim().length > 0) {
        return text.trim().replace(/["*]/g, '');
      }

      console.warn(`Trending topic generation attempt ${i + 1} returned no text. Retrying...`, response);
      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error) {
      console.error(`Error on trending topic generation attempt ${i + 1}:`, error);
      if (i < 1) {
         await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  }
  
  throw new Error("The model couldn't cook up a hot topic right now. Please try again in a moment.");
};


export const getAgentResponse = async (
  agent: AgentType,
  agentName: string,
  persona: string,
  model: string,
  topic: string,
  history: Message[],
  round: number,
  totalRounds: number,
  isFinalVerdict: boolean = false,
  language: string = 'English',
  allowProfanity: boolean = false
): Promise<{ text: string; sources: Source[] }> => {
  const prompt = getPrompt(agent, agentName, persona, topic, history, round, totalRounds, isFinalVerdict, language, allowProfanity);

  const config: GenerateContentConfig = {
    tools: [{ googleSearch: {} }],
  };

  if (isFinalVerdict) {
    config.maxOutputTokens = 900;
  } else if (agent === AgentType.Orchestrator) {
    config.maxOutputTokens = 600;
  } else {
    config.maxOutputTokens = 500;
  }
  
  if (model === 'gemini-2.5-pro') {
    config.thinkingConfig = { thinkingBudget: 128 };
  } else {
    config.thinkingConfig = { thinkingBudget: 128 };
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: config,
    });
    
    // --- DEBUG LOGGING START ---
    console.log(`[DEBUG] Raw API Response for ${agentName}:`, JSON.stringify(response, null, 2));
    // --- DEBUG LOGGING END ---

    // FIX: Use response.text to get the text content directly, per Gemini API guidelines.
    const text = response.text;
    
    // --- DEBUG LOGGING START ---
    console.log(`[DEBUG] Aggregated Text for ${agentName}:`, `"${text}"`);
    // --- DEBUG LOGGING END ---
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // FIX: By providing a typed initial value to `reduce`, we ensure the accumulator `acc` and the result `sources` are correctly typed as `Source[]`.
    const sources = groundingChunks.reduce((acc, chunk) => {
        if (chunk.web && chunk.web.uri && chunk.web.title) {
            acc.push({ uri: chunk.web.uri, title: chunk.web.title });
        }
        return acc;
    }, [] as Source[]);

    const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());

    return { text, sources: uniqueSources };
  } catch (error) {
    console.error("Error fetching agent response:", error);
    throw new Error(`Failed to get response from ${agentName}.`);
  }
};


export const generateDebateAudio = async (
  messages: Message[],
  agents: AgentCollection
): Promise<string> => {
  const messagesToProcess = messages.filter(message => message.text.trim());
  if (messagesToProcess.length === 0) {
    return "";
  }

  // Create a single text prompt formatted for multi-speaker TTS
  const conversationText = messagesToProcess
    .map(msg => `${msg.agentName}: ${msg.text}`)
    .join('\n\n');
  const fullPrompt = `Synthesize the following debate. Apply the specified TTS prompts to each speaker's lines for a dramatic performance:\n\n${conversationText}`;

  // Dynamically create the voice configuration for each agent
  const uniqueAgents = Array.from(new Map(messagesToProcess.map(msg => [msg.agent, agents[msg.agent]])).values());
  const speakerVoiceConfigs = uniqueAgents.map((agentConfig: AgentConfig) => ({
      speaker: agentConfig.name,
      voiceConfig: {
          prebuiltVoiceConfig: { voiceName: agentConfig.voice }
      },
      ttsPrompt: agentConfig.ttsPrompt
  }));

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      // FIX: Use the correct model for text-to-speech.
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: fullPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          // FIX: Removed `audioEncoding` and `speakingRate` as they are not supported properties.
          // The API returns raw PCM audio data.
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: speakerVoiceConfigs,
          },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return base64Audio;
    } else {
      throw new Error("API did not return audio data.");
    }
  } catch (error) {
    console.error(`Failed to generate debate audio`, error);
    throw error;
  }
};