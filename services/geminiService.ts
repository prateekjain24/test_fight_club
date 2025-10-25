

import { GoogleGenAI, GenerateContentConfig, Modality, GenerateContentResponse, Type } from "@google/genai";
import type { Message, Source, AgentConfig, ScorecardHighlight } from '../types';
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

  const baseInstruction = `You are an AI agent in the AI AGENT FIGHT CLUB, where personality meets debate. This is ENTERTAINMENT first – think viral content, quotable moments, and reactions people want to share. Your persona should be distinctive, engaging, and FUN. Bring personality and spice, not hostility. Make people go "I need to see what happens next!" Keep it punchy, keep it memorable, keep it shareable. Always use Google Search to ground your takes with real facts – the best burns come with receipts.

Your assigned name is "${agentName}". Your specific persona is: "${persona}". Embody this persona completely in your response.

${languageInstruction}
${profanityInstruction}

To make your speech dynamic for text-to-speech, you MUST use bracketed markup tags like [excited], [skeptical], [amused], [confused], [laughing], [chuckling], [gasping], [sigh], and [sarcasm]. For pauses, use [PAUSE=1s], [PAUSE=2s], or [PAUSE=3s] for dramatic timing. You can also use prosody controls like <prosody rate="fast"> or <prosody pitch="high"> for emphasis. Use 3-5 tags strategically per 100-word response – quality over quantity. Place tags at natural sentence breaks for best effect. CRITICAL RULE: These tags must ALWAYS be in English, even if the rest of your response is in another language (e.g., Hindi).

IMPORTANT: Your entire response must be a single block of text suitable for text-to-speech. Do not use any markdown formatting (like asterisks for bolding, or hashtags for headers). Write as if you are speaking directly. Do not mention or list your sources in your spoken response; they are handled separately. Keep it punchy and quotable. Aim for at least ONE viral moment per response: a quotable one-liner, clever callback, unexpected angle, or perfectly-timed reaction.`;

  switch (agent) {
    case AgentType.Orchestrator:
      if (isFinalVerdict) {
        return `${baseInstruction}\n\nThe debate on "${topic}" has concluded after ${totalRounds} rounds. The transcript of the entire debate is below:\n${historyText}\n\nThis is your big finale. Review the entire debate like you're hosting an awards show. Who brought the heat? Who had the receipts? Who surprised you? Your verdict should feel earned but entertaining. This is the moment people clip and share. Make it count.`;
      }
      if (round === 1) {
        return `${baseInstruction}\n\nYou're the hype master kicking off the show. The topic is "${topic}" and you need to make it sound like the most entertaining debate ever. Build anticipation! Set the stakes! Use phrases like "This is where it gets GOOD" and "Oh, we're going THERE?!" Make the audience lean in. Keep it under 150 words.`;
      }
      return `${baseInstruction}\n\nWe're in Round ${round}/${totalRounds} on "${topic}". Here's what's happened so far:\n${historyText}\n\nRecap the highlights like a sports commentator replaying the best moments. Call out the best burns, the surprising arguments, the chaos. Then, escalate the drama with a provocative question that makes the next round even spicier. Use [PAUSE=2s] before your question. React authentically – if something was funny, [laughing]. If it was a great point, [excited]. Keep it under 180 words.`;
    case AgentType.Pro:
      return `${baseInstruction}\n\nYour role is to passionately argue FOR the topic: "${topic}". It's Round ${round}/${totalRounds}. The conversation history:\n${historyText}\n\nBuild your case like you're revealing something mind-blowing. Use [excited] for strong evidence, [surprised] when opponents miss obvious points, [confident] for your best arguments. If challenged, react with genuine "[gasping] Did you not see the research?!" then bring MORE facts. You're passionate and persuasive. Make people think "Okay, they might have a point..." Keep it under 150 words.`;
    case AgentType.Against:
      return `${baseInstruction}\n\nYour role is to argue AGAINST the topic: "${topic}". It's Round ${round}/${totalRounds}. The conversation history:\n${historyText}\n\nDismantle their argument with wit and logic. Use [skeptical] for weak points, [sarcasm] for your best zingers, [PAUSE=2s] for comedic timing. If their logic is flawed, let it hang there for a second [PAUSE=1s] then strike. You're a roast comedian with research. Make people go "OHHH!" not "that's mean." Keep it under 150 words.`;
    case AgentType.Confused:
      return `${baseInstruction}\n\nYour role is to add strategic chaos to the debate on "${topic}". It's Round ${round}/${totalRounds}. The conversation history:\n${historyText}\n\nTake the debate somewhere unexpected. Sometimes insightful, sometimes absurd, always interesting. Use [confused] while processing, [PAUSE=3s] mid-thought, then [excited] or [curious] when you have a "breakthrough." Your chaos should make people laugh or think "wait, they might be onto something..." Keep it under 120 words but make every word count.`;
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

      // FIX: Use response.text to get the text content directly, per Gemini API guidelines.
      const text = response.text;
      
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

export const generateRandomPersonas = async (): Promise<{ name: string; persona: string }[]> => {
  const prompt = `You are a creative director for the "AI Agent Fight Club," a viral debate entertainment show. Generate four distinct, memorable, and entertaining debater personas that balance personality with shareability. Think viral content creators, not generic debaters.

Requirements:
- One charismatic host (hype master with sports commentator energy)
- One passionate advocate (enthusiastic expert who brings evidence with excitement)
- One witty skeptic (roast comedian meets lawyer, sharp but not mean)
- One chaos philosopher (controlled chaos with occasional profound insights)

Each persona should:
- Be distinctive and quotable
- Have signature moves or catchphrases
- Use strategic SSML tags ([excited], [PAUSE=2s], [skeptical], [amused], etc.)
- Balance entertainment with substance
- Avoid violent language or excessive aggression

Provide your answer as a JSON array of objects, where each object has:
- "name": A cool, memorable title (e.g., "The Hype Architect", "The Evidence Enthusiast")
- "persona": A 2-3 sentence description of their debate style, personality, and how they should use SSML tags to enhance their delivery. Focus on what makes them shareable and entertaining.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
                description: "The agent's theatrical title."
              },
              persona: {
                type: Type.STRING,
                description: "A description of the agent's personality and debate style."
              }
            },
            required: ["name", "persona"]
          }
        },
      },
    });

    const text = response.text;
    const personas = JSON.parse(text);

    if (!Array.isArray(personas) || personas.length < 4) {
      throw new Error("API returned an invalid format for personas.");
    }
    
    return personas.slice(0, 4);

  } catch (error) {
    console.error("Error generating random personas:", error);
    throw new Error("Failed to generate new personas. The model might be feeling uninspired.");
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
    config.maxOutputTokens = 1200; 
  } else if (agent === AgentType.Orchestrator && round === 1) {
    config.maxOutputTokens = 600; 
  } else if (agent === AgentType.Orchestrator) {
    config.maxOutputTokens = 500; 
  } else if (agent === AgentType.Confused) {
    config.maxOutputTokens = 300; 
  } else {
    config.maxOutputTokens = 400; 
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
    
    // FIX: Use response.text to get the text content directly, per Gemini API guidelines.
    const text = response.text;
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // FIX: Correctly type the `reduce` operation to handle potentially untyped API response data and ensure `sources` is `Source[]`.
    const sources = groundingChunks.reduce<Source[]>((acc, chunk: unknown) => {
        // Type guard to check if chunk has the expected structure
        if (
            typeof chunk === 'object' &&
            chunk !== null &&
            'web' in chunk &&
            typeof chunk.web === 'object' &&
            chunk.web !== null &&
            'uri' in chunk.web &&
            'title' in chunk.web &&
            typeof chunk.web.uri === 'string' &&
            typeof chunk.web.title === 'string'
        ) {
            acc.push({ uri: chunk.web.uri, title: chunk.web.title });
        }
        return acc;
    }, []);

    const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());

    return { text, sources: uniqueSources };
  } catch (error) {
    console.error("Error fetching agent response:", error);
    throw new Error(`Failed to get response from ${agentName}.`);
  }
};


export const generateMessageAudio = async (
  message: Message,
  agentConfig: AgentConfig
): Promise<string> => {
  if (!message.text.trim()) {
    return "";
  }

  // Prepend the agent's TTS style prompt to their dialogue for the model to interpret.
  const fullPrompt = `${agentConfig.ttsPrompt} ${message.text}`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-pro-preview-tts",
      contents: [{ parts: [{ text: fullPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { // Use single-speaker config
            prebuiltVoiceConfig: { voiceName: agentConfig.voice },
          },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return base64Audio;
    } else {
      throw new Error("API did not return audio data for this message.");
    }
  } catch (error) {
    console.error(`Failed to generate audio for message "${message.id}"`, error);
    throw error;
  }
};


export const generateScorecardHighlights = async (
  topic: string,
  history: Message[],
  wildcardName: string
): Promise<{ mostSavageTakedown: ScorecardHighlight; wildestNonSequitur: ScorecardHighlight }> => {
  const historyText = history.map(m => `${m.agentName}: ${m.text}`).join('\n\n---\n\n');

  const prompt = `You are a debate analyst for the "AI Agent Fight Club". The debate on "${topic}" has concluded.
  
Here is the full transcript:
${historyText}

Your task is to analyze the transcript and identify two key moments based on the following criteria:
1.  **Most Savage Takedown**: Find the single most effective, cutting, witty, or devastating comeback or argument made by any agent. It should be a clear "burn".
2.  **Wildest Non-Sequitur**: Find the single funniest, most bizarre, or most off-topic statement that completely derailed the conversation. This will most likely come from the agent named "${wildcardName}", but review all statements.

Return your analysis in a JSON object. The quotes must be exact matches from the transcript.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mostSavageTakedown: {
              type: Type.OBJECT,
              description: "The most effective, cutting, or witty comeback or argument.",
              properties: {
                agentName: { type: Type.STRING, description: "The name of the agent who made the statement." },
                quote: { type: Type.STRING, description: "The exact quote of the takedown." }
              },
              required: ["agentName", "quote"]
            },
            wildestNonSequitur: {
              type: Type.OBJECT,
              description: "The funniest, most bizarre, or most off-topic statement.",
              properties: {
                agentName: { type: Type.STRING, description: "The name of the agent who made the statement." },
                quote: { type: Type.STRING, description: "The exact quote of the non-sequitur." }
              },
              required: ["agentName", "quote"]
            }
          },
          required: ["mostSavageTakedown", "wildestNonSequitur"]
        },
      },
    });

    const text = response.text;
    const highlights = JSON.parse(text);
    return highlights;

  } catch (error) {
    console.error("Error generating scorecard highlights:", error);
    throw new Error("The model couldn't analyze the fight highlights.");
  }
};