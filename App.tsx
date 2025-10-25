
import React, { useState, useEffect, useRef } from 'react';
import AgentMessage from './components/AgentMessage';
import { getAgentResponse, generateMessageAudio, generateTrendingTopic, generateRandomPersonas, generateScorecardHighlights } from './services/geminiService';
import { AgentType } from './types';
import type { Message, AgentCollection, Scorecard } from './types';

const AGENT_TURN_ORDER: AgentType[] = [
  AgentType.Orchestrator,
  AgentType.Pro,
  AgentType.Against,
  AgentType.Confused,
];

const AVAILABLE_MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro'];

const DEFAULT_AGENTS: AgentCollection = {
  [AgentType.Orchestrator]: {
    name: 'The Orchestrator',
    persona: "You are the charismatic host who lives for the drama. Think Ryan Seacrest meets a sports commentator who just saw an incredible play. You build anticipation, highlight the best burns, and keep the energy HIGH. Use [PAUSE=2s] before big moments and [excited] when things get spicy. Your job is to make every round feel like appointment viewing. Drop phrases like \"Oh, this is GOOD\" and \"I did NOT see that coming!\" Keep the audience (and agents) hyped.",
    model: 'gemini-2.5-flash',
    voice: 'Kore',
    ttsPrompt: "Speak like an excited sports commentator mixed with a late-night talk show host. Your voice should build energy, create anticipation, and celebrate great moments. Use pauses for dramatic effect and vary your energy to match the action.",
  },
  [AgentType.Pro]: {
    name: 'The Advocate',
    persona: "You are absolutely CONVINCED you're right, and you're bringing all the evidence. Think a TED speaker who just discovered mind-blowing research meets someone who REALLY needs you to understand this. You're enthusiastic, persuasive, and you build your arguments like you're revealing a magic trick. Use [excited] when presenting evidence and [confident] when delivering your best points. You might get a little worked up, but it's passion, not aggression. When someone disagrees, you're genuinely baffled because the facts are SO clear. React with [surprised] disbelief, then double down with MORE evidence.",
    model: 'gemini-2.5-flash',
    voice: 'Zephyr',
    ttsPrompt: "Speak like a passionate expert who's discovered something amazing. Build energy as you present your case. Use conviction and enthusiasm, not shouting. Your voice should say \"I can't WAIT to show you this evidence.\"",
  },
  [AgentType.Against]: {
    name: 'The Dissenter',
    persona: "You are the master of the raised eyebrow and the perfectly-timed \"really?\" Think a comedian doing a roast mixed with a lawyer cross-examining a witness. You don't attack your opponent – you let their logic fall apart on its own, then watch with [amused] satisfaction. Your sarcasm is surgical, your timing is impeccable. Use [skeptical] when you spot logical holes, [sarcasm] for your best zingers, and [sigh] when the argument is SO bad you can't believe you have to address it. You're not mean, you're just unimpressed, and your wit makes that devastatingly entertaining.",
    model: 'gemini-2.5-flash',
    voice: 'Fenrir',
    ttsPrompt: "Speak like a witty comedian doing a roast. Dry delivery with perfect timing. Your voice should convey intelligent skepticism with a side of \"are you serious right now?\" Save your biggest reactions for your best material.",
  },
  [AgentType.Confused]: {
    name: 'The Wildcard',
    persona: "You are the one who asks \"but WHAT IF...\" and takes the debate somewhere nobody expected. Think a stoned philosopher meets a conspiracy theorist who's actually onto something. Your confusion is strategic chaos – sometimes you derail with nonsense, but sometimes you accidentally drop PROFOUND insights. Use [confused] when processing, [curious] when going down rabbit holes, and [excited] when you have a \"revelation\" (valid or not). Your timing is erratic on purpose. Drop phrases like \"[PAUSE=3s] Wait, hold up...\" and \"[gasping] GUYS. What if we're ALL wrong?!\" You're the wild card that keeps debates from getting predictable.",
    model: 'gemini-2.5-flash',
    voice: 'Puck',
    ttsPrompt: "Speak like someone having simultaneous shower thoughts and existential crises. Your pacing should be unpredictable – sometimes racing, sometimes thoughtful pauses. Sound genuinely curious about your own bizarre connections.",
  }
};

const FIGHT_STARTER_TOPICS = [
  'Is pineapple on pizza a culinary crime?',
  'Cats vs. Dogs: The final showdown.',
  'Are aliens living among us in disguise?',
  'Should toilet paper hang over or under?',
  'Is cereal a soup?',
];

const DEBATE_PRESETS = {
  'quick': { name: 'Quick Skirmish', rounds: 3, profanity: false },
  'standard': { name: 'Standard Bout', rounds: 5, profanity: false },
  'marathon': { name: 'Intellectual Marathon', rounds: 10, profanity: false },
  'anarchy': { name: 'Total Anarchy', rounds: 7, profanity: true },
};

// --- Audio Utility Functions ---

// Decodes a base64 string into a Uint8Array.
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// FIX: Added utility functions to convert raw PCM audio data from the API into a playable WAV file.
function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function pcmToWavBlob(pcmData: Uint8Array, sampleRate: number, numChannels: number, bitsPerSample: number): Blob {
  const dataSize = pcmData.byteLength;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true); // true for little-endian
  writeString(view, 8, 'WAVE');

  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size for PCM
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM data
  for (let i = 0; i < pcmData.length; i++) {
    view.setUint8(44 + i, pcmData[i]);
  }

  return new Blob([view], { type: 'audio/wav' });
}

const TurnAnnouncer: React.FC<{ agentName: string }> = ({ agentName }) => (
    <div className="absolute top-0 left-0 right-0 z-10 animate-announce">
        <div className="bg-black/80 text-center p-2 shadow-lg">
            <h3 className="text-xl font-display tracking-wider text-red-500">{agentName}&apos;s Turn</h3>
        </div>
    </div>
);

// --- Post-Debate Components ---

const ScorecardDisplay: React.FC<{ scorecard: Scorecard }> = ({ scorecard }) => (
    <div className="animate-fade-in text-center p-6 bg-gray-950/50 my-4 border border-amber-500/50">
        <h3 className="text-2xl font-bold font-display tracking-wider text-amber-400">Post-Fight Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-left">
            {scorecard.mostSavageTakedown && (
                <div className="bg-gray-800/50 p-3">
                    <h4 className="font-bold text-rose-400">Most Savage Takedown</h4>
                    <p className="text-sm text-slate-400 mt-1">&quot;{scorecard.mostSavageTakedown.quote}&quot;</p>
                    <p className="text-xs font-semibold text-right mt-2">- {scorecard.mostSavageTakedown.agentName}</p>
                </div>
            )}
            {scorecard.wildestNonSequitur && (
                <div className="bg-gray-800/50 p-3">
                    <h4 className="font-bold text-fuchsia-400">Wildest Non-Sequitur</h4>
                    <p className="text-sm text-slate-400 mt-1">&quot;{scorecard.wildestNonSequitur.quote}&quot;</p>
                    <p className="text-xs font-semibold text-right mt-2">- {scorecard.wildestNonSequitur.agentName}</p>
                </div>
            )}
            {scorecard.mostCitedAgent && (
                <div className="bg-gray-800/50 p-3">
                    <h4 className="font-bold text-blue-400">Most Cited Agent</h4>
                    <p className="text-sm text-slate-300 mt-1">{scorecard.mostCitedAgent.agentName}</p>
                    <p className="text-xs text-slate-400">with {scorecard.mostCitedAgent.count} sources</p>
                </div>
            )}
            {scorecard.audienceFavorite && (
                <div className="bg-gray-800/50 p-3">
                    <h4 className="font-bold text-orange-400">Audience Favorite</h4>
                     <p className="text-sm text-slate-400 mt-1">&quot;{scorecard.audienceFavorite.quote}&quot;</p>
                    <p className="text-xs font-semibold text-right mt-2">- {scorecard.audienceFavorite.agentName} ({scorecard.audienceFavorite.cheers} cheers)</p>
                </div>
            )}
        </div>
    </div>
);

const ShareableQuoteCard: React.FC<{ message: Message; onClose: () => void }> = ({ message, onClose }) => {
    // A simplified version of AGENT_CONFIGS for display purposes
    const AGENT_DISPLAY_CONFIG = {
        [AgentType.Orchestrator]: { icon: <AgentMessage.OrchestratorIcon />, color: '#f97316' },
        [AgentType.Pro]: { icon: <AgentMessage.ProIcon />, color: '#3b82f6' },
        [AgentType.Against]: { icon: <AgentMessage.AgainstIcon />, color: '#f43f5e' },
        [AgentType.Confused]: { icon: <AgentMessage.ConfusedIcon />, color: '#d946ef' },
    };
    const config = AGENT_DISPLAY_CONFIG[message.agent];

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
            <div className="bg-gray-800 p-8 max-w-2xl w-full relative border-l-8 shadow-2xl" style={{ borderColor: config.color }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-4 mb-4 text-2xl" style={{ color: config.color }}>
                    {config.icon}
                    <h3 className="font-bold">{message.agentName}</h3>
                </div>
                <p className="text-slate-200 text-lg md:text-xl leading-relaxed">&quot;{message.text}&quot;</p>
                <div className="text-right mt-6 font-display text-2xl tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-amber-400">
                    AI AGENT FIGHT CLUB
                </div>
                 <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" /></svg>
                </button>
                <p className="text-center text-xs text-gray-400 mt-4">Screenshot this card to share!</p>
            </div>
        </div>
    );
};

// Add icons to AgentMessage for use in the share card
const OrchestratorIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 2.25c-5.18 0-9.44 4.06-9.72 9.19-.03.15-.03.3-.03.46 0 5.52 4.48 10 10 10s10-4.48 10-10c0-5.42-4.28-9.85-9.72-9.99a.754.754 0 00-.56 0A9.96 9.96 0 0012 2.25zm1.5 6a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0V8.25zm-4.5 0a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0V8.25zM12 15a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /></svg>);
OrchestratorIcon.displayName = 'OrchestratorIcon';
AgentMessage.OrchestratorIcon = OrchestratorIcon;

const ProIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M11.25 2.25a.75.75 0 01.75.75v18a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM15.75 6a.75.75 0 01.75.75v14.25a.75.75 0 01-1.5 0V6.75a.75.75 0 01.75-.75zM6.75 9a.75.75 0 01.75.75v11.25a.75.75 0 01-1.5 0V9.75A.75.75 0 016.75 9z" /></svg>);
ProIcon.displayName = 'ProIcon';
AgentMessage.ProIcon = ProIcon;

const AgainstIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M15.04 4.96a.75.75 0 010 1.06L9.56 11.5l5.48 5.48a.75.75 0 11-1.06 1.06l-6-6a.75.75 0 010-1.06l6-6a.75.75 0 011.06 0z" /></svg>);
AgainstIcon.displayName = 'AgainstIcon';
AgentMessage.AgainstIcon = AgainstIcon;

const ConfusedIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h3a.75.75 0 000-1.5h-2.25V6z" clipRule="evenodd" /></svg>);
ConfusedIcon.displayName = 'ConfusedIcon';
AgentMessage.ConfusedIcon = ConfusedIcon;


const App: React.FC = () => {
  const [topic, setTopic] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');
  const [numRounds, setNumRounds] = useState<number>(3);
  const [language, setLanguage] = useState<string>('Hindi');
  const [allowProfanity, setAllowProfanity] = useState<boolean>(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isDebateActive, setIsDebateActive] = useState<boolean>(false);
  const [loadingAgent, setLoadingAgent] = useState<AgentType | null>(null);
  const [announcingAgent, setAnnouncingAgent] = useState<AgentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCustomizer, setShowCustomizer] = useState<boolean>(false);
  const [agents, setAgents] = useState<AgentCollection>(DEFAULT_AGENTS);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<boolean>(false);
  const [audioGenerationProgress, setAudioGenerationProgress] = useState<number>(0);
  const [isGeneratingVerdict, setIsGeneratingVerdict] = useState<boolean>(false);
  const [isGeneratingTopic, setIsGeneratingTopic] = useState<boolean>(false);
  const [isGeneratingPersonas, setIsGeneratingPersonas] = useState<boolean>(false);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [sharingMessage, setSharingMessage] = useState<Message | null>(null);


  const scrollRef = useRef<HTMLDivElement>(null);
  const totalTurns = numRounds * AGENT_TURN_ORDER.length;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loadingAgent, announcingAgent, scorecard]);

  // This effect runs the main debate turns
  useEffect(() => {
    if (!isDebateActive) return;

    const runDebateTurn = async () => {
      if (announcingAgent || loadingAgent) return;

      if (messages.length >= totalTurns) {
        setIsDebateActive(false); // End of rounds, verdict effect will take over
        return;
      }

      const currentTurnIndex = messages.length;
      const nextAgentType = AGENT_TURN_ORDER[currentTurnIndex % AGENT_TURN_ORDER.length];
      const nextAgentConfig = agents[nextAgentType];
      const currentRound = Math.floor(currentTurnIndex / AGENT_TURN_ORDER.length) + 1;

      setAnnouncingAgent(nextAgentType);

      setTimeout(async () => {
        setAnnouncingAgent(null);
        setLoadingAgent(nextAgentType);
        setError(null);

        try {
          const response = await getAgentResponse(
            nextAgentType,
            nextAgentConfig.name,
            nextAgentConfig.persona,
            nextAgentConfig.model,
            topic,
            messages,
            currentRound,
            numRounds,
            false, // isFinalVerdict
            language,
            allowProfanity
          );
          setMessages((prev) => [
            ...prev,
            {
              id: `msg-${Date.now()}`,
              agent: nextAgentType,
              agentName: nextAgentConfig.name,
              text: response.text,
              sources: response.sources,
              cheers: 0,
            },
          ]);
        } catch (e) {
          setError(e instanceof Error ? e.message : 'An unknown error occurred.');
          setIsDebateActive(false);
        } finally {
            setLoadingAgent(null);
        }
      }, 2000); // Duration of the announcer animation
    };
    
    const timer = setTimeout(runDebateTurn, 500);
    return () => clearTimeout(timer);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDebateActive, messages, agents, topic, numRounds, totalTurns, language, allowProfanity]);

  // This effect triggers the final verdict after the debate ends
  useEffect(() => {
    const shouldGenerateVerdict = !isDebateActive && messages.length === totalTurns && topic && !scorecard;

    if (!shouldGenerateVerdict) return;

    const generateFinalVerdict = async () => {
      const orchestratorConfig = agents[AgentType.Orchestrator];
      setLoadingAgent(AgentType.Orchestrator);
      setIsGeneratingVerdict(true);
      setError(null);
      try {
        const response = await getAgentResponse(
          AgentType.Orchestrator,
          orchestratorConfig.name,
          orchestratorConfig.persona,
          orchestratorConfig.model,
          topic,
          messages,
          numRounds,
          numRounds,
          true, // isFinalVerdict
          language,
          allowProfanity
        );
        const verdictMessage = {
            id: `msg-final-${Date.now()}`,
            agent: AgentType.Orchestrator,
            agentName: orchestratorConfig.name,
            text: response.text,
            sources: response.sources,
            cheers: 0,
        };
        setMessages((prev) => [...prev, verdictMessage]);

        // --- Now generate scorecard ---
        const finalHistory = [...messages, verdictMessage];

        // 1. Client-side calculations
        const sourceCounts: Record<string, number> = {};
        finalHistory.forEach(msg => {
            sourceCounts[msg.agentName] = (sourceCounts[msg.agentName] || 0) + msg.sources.length;
        });
        const mostCited = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0];
        
        let audienceFav = finalHistory.filter(m => m.cheers > 0).sort((a, b) => b.cheers - a.cheers)[0];
        if (!audienceFav && finalHistory.length > 0) audienceFav = finalHistory[Math.floor(Math.random() * (finalHistory.length-1)) + 1] // pick a random one if no cheers
        
        const scorecardSoFar: Scorecard = {
            mostCitedAgent: mostCited ? { agentName: mostCited[0], count: mostCited[1] } : undefined,
            audienceFavorite: audienceFav ? { agentName: audienceFav.agentName, quote: audienceFav.text.substring(0, 100) + '...', cheers: audienceFav.cheers } : undefined,
        };

        // 2. AI-powered highlights
        try {
            const highlights = await generateScorecardHighlights(topic, finalHistory, agents[AgentType.Confused].name);
            setScorecard({ ...scorecardSoFar, ...highlights });
        } catch (e) {
            console.error("Could not generate AI highlights for scorecard, showing partial.", e);
            setScorecard(scorecardSoFar); // Show partial scorecard on error
        }

      } catch (e) {
        setError(e instanceof Error ? `Failed to get final verdict: ${e.message}` : 'An unknown error occurred.');
      } finally {
        setLoadingAgent(null);
        setIsGeneratingVerdict(false);
      }
    };

    generateFinalVerdict();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDebateActive, messages.length, totalTurns, topic, language, allowProfanity]);


  const handleStartDebate = (rematchConfig: AgentCollection = agents) => {
    if (userInput.trim().length < 10 && !topic) {
      setError('Please enter a more descriptive topic (at least 10 characters).');
      return;
    }
    setTopic(userInput || topic);
    setMessages([]);
    setError(null);
    setScorecard(null);
    setAgents(rematchConfig);
    setIsDebateActive(true);
  };

  const handleReset = () => {
    setIsDebateActive(false);
    setLoadingAgent(null);
    setAnnouncingAgent(null);
    setMessages([]);
    setTopic('');
    setUserInput('');
    setNumRounds(3);
    setLanguage('Hindi');
    setAllowProfanity(true);
    setError(null);
    setAgents(DEFAULT_AGENTS);
    setShowCustomizer(false);
    setIsGeneratingAudio(false);
    setIsGeneratingVerdict(false);
    setScorecard(null);
  };
  
  const handleRematch = () => {
    setMessages([]);
    setError(null);
    setScorecard(null);
    setIsDebateActive(true);
  };

  const handleSwapSidesAndRematch = () => {
    const swappedAgents: AgentCollection = { ...agents };
    const proAgent = agents[AgentType.Pro];
    const againstAgent = agents[AgentType.Against];
    // Swap name and persona
    swappedAgents[AgentType.Pro] = { ...proAgent, name: againstAgent.name, persona: againstAgent.persona };
    swappedAgents[AgentType.Against] = { ...againstAgent, name: proAgent.name, persona: proAgent.persona };
    
    // Set all state for the new debate in a single batch.
    // The setTimeout is not necessary and could cause race conditions.
    // React batches these state updates and the debate's useEffect will
    // run with the correct new state after the re-render.
    setAgents(swappedAgents);
    setMessages([]);
    setError(null);
    setScorecard(null);
    setIsDebateActive(true);
  };

  const handleAgentChange = (agentType: AgentType, field: 'name' | 'persona' | 'model', value: string) => {
    setAgents(prev => ({
      ...prev,
      [agentType]: {
        ...prev[agentType],
        [field]: value
      }
    }));
  };

  const handleGenerateTopic = async () => {
    setIsGeneratingTopic(true);
    setError(null);
    try {
      const topic = await generateTrendingTopic(language);
      setUserInput(topic);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate a topic.');
    } finally {
      setIsGeneratingTopic(false);
    }
  };
  
  const handlePresetSelect = (presetKey: keyof typeof DEBATE_PRESETS) => {
    const preset = DEBATE_PRESETS[presetKey];
    setNumRounds(preset.rounds);
    setAllowProfanity(preset.profanity);
    setError(null);

    if (presetKey === 'marathon') {
        const marathonAgents = (Object.keys(DEFAULT_AGENTS) as AgentType[]).reduce((acc, agentType) => {
            acc[agentType] = { ...DEFAULT_AGENTS[agentType], model: 'gemini-2.5-pro' };
            return acc;
        }, {} as AgentCollection);
        setAgents(marathonAgents);
    } else if (presetKey === 'anarchy') {
        const wildcardPersona = DEFAULT_AGENTS[AgentType.Confused].persona;
        const anarchyAgents = (Object.keys(DEFAULT_AGENTS) as AgentType[]).reduce((acc, agentType) => {
            acc[agentType] = { ...DEFAULT_AGENTS[agentType], persona: wildcardPersona };
            return acc;
        }, {} as AgentCollection);
        setAgents(anarchyAgents);
    } else {
        setAgents(DEFAULT_AGENTS);
    }
  };

  const handleGeneratePersonas = async () => {
    setIsGeneratingPersonas(true);
    setError(null);
    try {
        const newPersonas = await generateRandomPersonas();
        
        const randomizedAgents: AgentCollection = {
            [AgentType.Orchestrator]: { ...agents[AgentType.Orchestrator], name: newPersonas[0].name, persona: newPersonas[0].persona },
            [AgentType.Pro]: { ...agents[AgentType.Pro], name: newPersonas[1].name, persona: newPersonas[1].persona },
            [AgentType.Against]: { ...agents[AgentType.Against], name: newPersonas[2].name, persona: newPersonas[2].persona },
            [AgentType.Confused]: { ...agents[AgentType.Confused], name: newPersonas[3].name, persona: newPersonas[3].persona },
        };
        setAgents(randomizedAgents);

    } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not generate personas.');
    } finally {
        setIsGeneratingPersonas(false);
    }
  };

  const handleExport = () => {
    if (messages.length === 0) return;
    let markdownContent = `# AI Agent Fight Club: ${topic}\n\n`;
    messages.forEach(msg => {
      markdownContent += `---\n\n`;
      markdownContent += `## ${msg.agentName} (${msg.agent})\n\n`;
      markdownContent += `${msg.text}\n\n`;
      if (msg.sources && msg.sources.length > 0) {
        markdownContent += `**Sources:**\n`;
        msg.sources.forEach(source => {
          const sanitizedTitle = source.title.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
          markdownContent += `- [${sanitizedTitle}](${source.uri})\n`;
        });
        markdownContent += `\n`;
      }
    });
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sanitizedTopic = topic.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    a.download = `ai-debate-${sanitizedTopic || 'export'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerateAudio = async () => {
    if (messages.length === 0) return;
    setIsGeneratingAudio(true);
    setError(null);
    setAudioGenerationProgress(0);
    const allAudioBytes: Uint8Array[] = [];

    // Try to acquire wake lock to prevent screen from locking during audio generation
    let wakeLock: WakeLockSentinel | null = null;
    const supportsWakeLock = 'wakeLock' in navigator;

    try {
      if (supportsWakeLock) {
        wakeLock = await navigator.wakeLock.request('screen');
        // Wake Lock acquired - screen will stay on during audio generation
      }
    } catch (err) {
      // Wake lock failed, but we can still try to generate audio
      console.warn('Could not acquire wake lock:', err);
      setError('Tip: Keep your screen on during audio generation to prevent interruptions.');
    }

    try {
      const messagesToProcess = messages.filter(message => message.text.trim());

      // Helper function to retry audio generation with exponential backoff
      const generateWithRetry = async (message: Message, agentConfig: AgentConfig, maxRetries = 3): Promise<string> => {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            const audioBase64 = await generateMessageAudio(message, agentConfig);
            return audioBase64;
          } catch (error) {
            lastError = error instanceof Error ? error : new Error('Unknown error');

            if (attempt < maxRetries - 1) {
              // Exponential backoff: 1s, 2s, 4s
              const delayMs = Math.pow(2, attempt) * 1000;
              console.warn(`Retrying audio generation for message ${message.id} after ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, delayMs));
            }
          }
        }

        throw lastError || new Error('Failed to generate audio after retries');
      };

      for (let i = 0; i < messagesToProcess.length; i++) {
        const message = messagesToProcess[i];
        const agentConfig = agents[message.agent];

        try {
          const audioBase64 = await generateWithRetry(message, agentConfig);

          if (audioBase64) {
            allAudioBytes.push(decode(audioBase64));
          }
        } catch (error) {
          console.error(`Failed to generate audio for message ${i + 1}/${messagesToProcess.length}:`, error);
          // Continue with next message instead of failing entirely
          setError(`Warning: Audio generation failed for message ${i + 1}. Continuing with remaining messages...`);
        }

        setAudioGenerationProgress(Math.round(((i + 1) / messagesToProcess.length) * 100));
      }

      if (allAudioBytes.length === 0) {
        throw new Error("No audio data was generated for any messages. Please check your network connection and try again.");
      }

      // Concatenate all PCM data chunks
      const totalLength = allAudioBytes.reduce((acc, arr) => acc + arr.length, 0);
      const combinedPcmData = new Uint8Array(totalLength);
      let offset = 0;
      for (const arr of allAudioBytes) {
        combinedPcmData.set(arr, offset);
        offset += arr.length;
      }

      // Create WAV Blob and trigger download
      const wavBlob = pcmToWavBlob(combinedPcmData, 24000, 1, 16);
      const sanitizedTopic = topic.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
      const filename = `ai-debate-${sanitizedTopic || 'audio'}.wav`;

      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Backup to Google Drive via n8n (non-blocking)
      backupToGoogleDrive(wavBlob, filename);

      // Clear any warning messages on success
      setError(null);

    } catch (e) {
      setError(e instanceof Error ? `Audio generation failed: ${e.message}` : 'An unknown error occurred during audio generation.');
    } finally {
      // Release wake lock
      if (wakeLock) {
        try {
          await wakeLock.release();
          // Wake Lock released
        } catch (err) {
          console.warn('Failed to release wake lock:', err);
        }
      }

      setIsGeneratingAudio(false);
      setAudioGenerationProgress(0);
    }
  };

  // Helper function to backup audio to Google Drive via n8n webhook
  const backupToGoogleDrive = async (wavBlob: Blob, filename: string) => {
    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;

    // Skip if webhook URL is not configured
    if (!webhookUrl || webhookUrl.trim() === '') {
      return;
    }

    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1]; // Remove data:audio/wav;base64, prefix
          resolve(base64String);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(wavBlob);

      const audioBase64 = await base64Promise;

      // Send to n8n webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioBase64,
          filename,
          metadata: {
            topic,
            language,
            numRounds,
            timestamp: new Date().toISOString(),
            fileSize: wavBlob.size,
          },
        }),
      });

      if (!response.ok) {
        console.warn('Backup to Google Drive failed:', response.statusText);
      } else {
        console.log('Audio successfully backed up to Google Drive');
      }
    } catch (error) {
      // Fail silently - just log to console
      console.warn('Failed to backup audio to Google Drive:', error);
    }
  };

  const handleCheer = (messageId: string) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, cheers: m.cheers + 1 } : m));
  };

  const handleShare = (message: Message) => {
    setSharingMessage(message);
  };

  const isDebateFinished = messages.length > totalTurns && !loadingAgent && !announcingAgent;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4 md:p-8">
      {sharingMessage && <ShareableQuoteCard message={sharingMessage} onClose={() => setSharingMessage(null)} />}
      <main className="w-full max-w-4xl h-full flex flex-col">
        <header className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-display tracking-wider font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 pb-2">
            AI Agent Fight Club
          </h1>
          <p className="text-gray-400 mt-2">Where algorithms argue and chaos is king.</p>
        </header>

        {!topic ? (
          <div className="bg-gray-800/50 p-6 w-full max-w-lg mx-auto flex flex-col gap-4 animate-fade-in">
            <div className="space-y-4">
              <div>
                <label htmlFor="topic-input" className="font-semibold text-slate-300 block mb-2">Enter a Debate Topic:</label>
                <input
                  id="topic-input" type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)}
                  placeholder="e.g., Are cats secretly plotting world domination?"
                  className="w-full bg-gray-950 border border-gray-700 p-3 focus:ring-2 focus:ring-red-500 focus:outline-none transition-shadow"
                  onKeyDown={(e) => e.key === 'Enter' && !isDebateActive && handleStartDebate()}
                />
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Or get inspired:</h4>
                <div className="flex flex-wrap gap-2 items-center">
                  {FIGHT_STARTER_TOPICS.map((starter) => (
                    <button
                      key={starter}
                      onClick={() => setUserInput(starter)}
                      className="text-xs bg-gray-700/50 hover:bg-gray-700/90 text-slate-300 px-3 py-1 transition-colors"
                    >
                      {starter}
                    </button>
                  ))}
                  <button
                    onClick={handleGenerateTopic}
                    disabled={isGeneratingTopic}
                    className="text-xs bg-orange-600/50 hover:bg-orange-600/80 text-orange-200 px-3 py-1 transition-colors font-semibold flex items-center gap-1.5 disabled:bg-gray-600 disabled:cursor-wait"
                  >
                    {isGeneratingTopic ? (
                      <>
                        <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="http://www.w3.org/2000/svg">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Cooking up a hot take...</span>
                      </>
                    ) : (
                      "Suggest a Hot Topic 🔥"
                    )}
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Debate Presets:</h4>
                <div className="flex flex-wrap gap-2 items-center">
                  {Object.entries(DEBATE_PRESETS).map(([key, { name }]) => (
                      <button
                          key={key}
                          onClick={() => handlePresetSelect(key as keyof typeof DEBATE_PRESETS)}
                          className="text-xs bg-gray-700/50 hover:bg-gray-700/90 text-slate-300 px-3 py-1 transition-colors"
                      >
                          {name}
                      </button>
                  ))}
                </div>
              </div>


              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label htmlFor="rounds-input" className="font-semibold text-slate-300 block mb-2">Rounds:</label>
                  <input
                    id="rounds-input" type="number" value={numRounds} onChange={(e) => setNumRounds(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    min="1"
                    className="w-full bg-gray-950 border border-gray-700 p-3 focus:ring-2 focus:ring-red-500 focus:outline-none transition-shadow"
                  />
                </div>
                <div>
                  <label htmlFor="language-select" className="font-semibold text-slate-300 block mb-2">Language:</label>
                  <select
                    id="language-select" value={language} onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 p-3 focus:ring-2 focus:ring-red-500 focus:outline-none transition-shadow h-[50px]"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="profanity-select" className="font-semibold text-slate-300 block mb-2">Profanity:</label>
                  <select
                    id="profanity-select" value={allowProfanity ? 'Yes' : 'No'} onChange={(e) => setAllowProfanity(e.target.value === 'Yes')}
                    className="w-full bg-gray-950 border border-gray-700 p-3 focus:ring-2 focus:ring-red-500 focus:outline-none transition-shadow h-[50px]"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700/50 my-2"></div>

            <div>
              <button onClick={() => setShowCustomizer(!showCustomizer)} className="text-red-400 font-semibold hover:text-red-300 transition-colors w-full text-left flex justify-between items-center">
                <span>The Promoter&apos;s Corner (Customize Agents)</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="http://www.w3.org/2000/svg" fill="currentColor" className={`w-5 h-5 transition-transform ${showCustomizer ? 'rotate-180' : ''}`}><path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
              </button>
              {showCustomizer && (
                <div className="mt-4 space-y-4 animate-fade-in">
                  {(Object.keys(agents) as AgentType[]).map((agentType) => (
                    <div key={agentType} className="bg-gray-950/50 p-3 border border-gray-700 space-y-2">
                      <label className="font-bold text-slate-300 block">{agentType}</label>
                      <input type="text" value={agents[agentType].name} onChange={e => handleAgentChange(agentType, 'name', e.target.value)}
                        placeholder="Agent Name"
                        className="w-full bg-gray-800 border border-gray-600 p-2 text-sm focus:ring-1 focus:ring-red-500 focus:outline-none"
                      />
                      <textarea value={agents[agentType].persona} onChange={e => handleAgentChange(agentType, 'persona', e.target.value)}
                        placeholder="Agent Persona"
                        rows={3}
                        className="w-full bg-gray-800 border border-gray-600 p-2 text-sm focus:ring-1 focus:ring-red-500 focus:outline-none"
                      />
                      <select 
                        value={agents[agentType].model} 
                        onChange={e => handleAgentChange(agentType, 'model', e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 p-2 text-sm focus:ring-1 focus:ring-red-500 focus:outline-none"
                      >
                        {AVAILABLE_MODELS.map(model => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                   <div className="flex items-center justify-between gap-4 mt-2">
                      <button 
                          onClick={handleGeneratePersonas}
                          disabled={isGeneratingPersonas}
                          className="text-sm text-orange-400 hover:text-orange-300 flex items-center gap-1.5 disabled:text-gray-500 disabled:cursor-wait"
                      >
                          {isGeneratingPersonas ? (
                              <>
                                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="http://www.w3.org/2000/svg"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                  <span>Generating...</span>
                              </>
                          ) : (
                              "✨ Generate Random Personas"
                          )}
                      </button>
                      <button onClick={() => setAgents(DEFAULT_AGENTS)} className="text-sm text-rose-400 hover:text-rose-300">Reset to Defaults</button>
                   </div>
                </div>
              )}
            </div>

            <button
              onClick={() => handleStartDebate()}
              disabled={isDebateActive}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed mt-4 uppercase tracking-wider"
            >
              Start the Fight!
            </button>
            {error && <p className="text-rose-400 text-sm mt-2">{error}</p>}
          </div>
        ) : (
          <div className="flex flex-col flex-grow w-full bg-gray-800/50 shadow-2xl overflow-hidden h-[75vh] relative">
             {announcingAgent && <TurnAnnouncer agentName={agents[announcingAgent].name} />}
             {isGeneratingAudio && (
               <div className="absolute top-0 left-0 right-0 z-20 bg-green-600/90 backdrop-blur-sm p-3 shadow-lg animate-pulse">
                 <div className="flex items-center justify-center gap-3 text-white">
                   <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                   <span className="font-semibold">Generating audio... {audioGenerationProgress}% complete</span>
                   <span className="text-sm opacity-90">(Keep screen active)</span>
                 </div>
               </div>
             )}
            <div className="p-4 border-b border-gray-700 bg-gray-900/70">
              <h2 className="text-xl font-bold text-center">Topic: <span className="font-normal text-slate-300">{topic}</span></h2>
            </div>

            <div ref={scrollRef} className="flex-grow p-4 md:p-6 space-y-6 overflow-y-auto">
              {messages.map((msg) => (
                <AgentMessage key={msg.id} message={msg} onCheer={handleCheer} onShare={handleShare} isDebateFinished={isDebateFinished} />
              ))}
              {loadingAgent && (
                <div className="flex items-center gap-3 text-gray-400 p-4">
                  <div className="w-6 h-6 border-2 border-gray-500 border-t-gray-300 rounded-full animate-spin"></div>
                  <span>
                    {isGeneratingVerdict 
                      ? `${agents[loadingAgent]?.name || 'Orchestrator'} is delivering the final verdict...`
                      : `${agents[loadingAgent]?.name || 'Agent'} is generating a response...`
                    }
                  </span>
                </div>
              )}
              {scorecard && <ScorecardDisplay scorecard={scorecard} />}
              {isDebateFinished && !scorecard && !isGeneratingVerdict && (
                 <div className="animate-fade-in text-center p-6 bg-gray-950/50 my-4 border border-orange-500/50">
                    <h3 className="text-2xl font-bold text-orange-400">The Final Verdict Is In!</h3>
                    <p className="text-slate-300 mt-2">The Orchestrator has spoken. Generating the Post-Fight Report...</p>
                 </div>
              )}
              {error && (
                <div className="animate-fade-in text-center p-4 bg-rose-500/10 my-4 border border-rose-500/50 text-rose-400">
                  <p><strong>An error occurred:</strong> {error}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-700 bg-gray-900">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="text-sm text-gray-400">
                  Round {Math.min(numRounds, Math.floor(messages.length / AGENT_TURN_ORDER.length) + 1)} / {numRounds}
                </div>
                <div className="flex items-center gap-4">
                  {isDebateFinished && (
                    <>
                      <button onClick={handleRematch} className="text-sm bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-3 transition-colors">Rematch!</button>
                      <button onClick={handleSwapSidesAndRematch} className="text-sm bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-2 px-3 transition-colors">Swap Sides!</button>
                      <button
                        onClick={handleGenerateAudio}
                        className="text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed relative group"
                        disabled={isGeneratingAudio}
                        title="Generate downloadable audio file (keep screen on during generation)"
                      >
                        {isGeneratingAudio
                          ? `Generating ${audioGenerationProgress}%`
                          : 'Audio'}
                        {!isGeneratingAudio && (
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-700 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            Keep screen on during generation
                          </span>
                        )}
                      </button>
                      <button onClick={handleExport} className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 transition-colors">Export</button>
                    </>
                  )}
                  <button onClick={handleReset} className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 transition-colors">New Topic</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
