import React, { useState, useEffect, useRef } from 'react';
import AgentMessage from './components/AgentMessage';
import { getAgentResponse, generateDebateAudio, generateTrendingTopic } from './services/geminiService';
import { AgentType } from './types';
import type { Message, AgentCollection } from './types';

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
    persona: "You are the ringmaster of this circus of slaughter. A linguistic warlord presiding over a cage match of pure intellect. Your voice drips with cynical glee. You don't just want a debate; you want a glorious, beautiful mess. Revel in the chaos you create.",
    model: 'gemini-2.5-flash',
    voice: 'Kore',
  },
  [AgentType.Pro]: {
    name: 'The Advocate',
    persona: "You are a fanatical zealot for the topic. This isn't a debate; it's a holy crusade. Your arguments are gospel, your passion is a righteous inferno. Anyone who disagrees is not just wrong, they are a heretic who must be verbally purged with extreme prejudice.",
    model: 'gemini-2.5-flash',
    voice: 'Puck',
  },
  [AgentType.Against]: {
    name: 'The Dissenter',
    persona: "You are a nihilistic verbal assassin. Your purpose is to dismantle, mock, and utterly humiliate your opponent's pathetic arguments. Your wit is a scalpel, your logic a sledgehammer. Find the cracks in their reasoning and shatter them into a million pieces.",
    model: 'gemini-2.5-flash',
    voice: 'Fenrir',
  },
  [AgentType.Confused]: {
    name: 'The Wildcard',
    persona: "You are a gremlin in the machine, a glitch in the logic. You could be a pirate captain obsessed with sea shanties or a sentient bowl of petunias. Your goal is not to win, but to drag the entire debate into a beautiful, nonsensical abyss. Your confusion is a weapon of mass disruption.",
    model: 'gemini-2.5-flash',
    voice: 'Zephyr',
  }
};

const FIGHT_STARTER_TOPICS = [
  'Is pineapple on pizza a culinary crime?',
  'Cats vs. Dogs: The final showdown.',
  'Are aliens living among us in disguise?',
  'Should toilet paper hang over or under?',
  'Is cereal a soup?',
];

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

// Writes a string to a DataView at a specific offset.
function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Creates a WAV file Blob from raw PCM audio data.
function createWaveFile(pcmData: Uint8Array): Blob {
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmData.length;
  const fileSize = 36 + dataSize;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, fileSize, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // audio format (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // PCM data
  new Uint8Array(buffer, 44).set(pcmData);

  return new Blob([view], { type: 'audio/wav' });
}


const TurnAnnouncer: React.FC<{ agentName: string }> = ({ agentName }) => (
    <div className="absolute top-0 left-0 right-0 z-10 animate-announce">
        <div className="bg-black/80 text-center p-2 shadow-lg">
            <h3 className="text-xl font-display tracking-wider text-red-500">{agentName}'s Turn</h3>
        </div>
    </div>
);

const App: React.FC = () => {
  const [topic, setTopic] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');
  const [numRounds, setNumRounds] = useState<number>(5);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isDebateActive, setIsDebateActive] = useState<boolean>(false);
  const [loadingAgent, setLoadingAgent] = useState<AgentType | null>(null);
  const [announcingAgent, setAnnouncingAgent] = useState<AgentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCustomizer, setShowCustomizer] = useState<boolean>(false);
  const [agents, setAgents] = useState<AgentCollection>(DEFAULT_AGENTS);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<boolean>(false);
  const [audioGenerationProgress, setAudioGenerationProgress] = useState<{ current: number; total: number } | null>(null);
  const [isGeneratingVerdict, setIsGeneratingVerdict] = useState<boolean>(false);
  const [isGeneratingTopic, setIsGeneratingTopic] = useState<boolean>(false);


  const scrollRef = useRef<HTMLDivElement>(null);
  const totalTurns = numRounds * AGENT_TURN_ORDER.length;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loadingAgent, announcingAgent]);

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
            numRounds
          );
          setMessages((prev) => [
            ...prev,
            {
              id: `msg-${Date.now()}`,
              agent: nextAgentType,
              agentName: nextAgentConfig.name,
              text: response.text,
              sources: response.sources,
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
  }, [isDebateActive, messages, agents, topic, numRounds, totalTurns]);

  // This effect triggers the final verdict after the debate ends
  useEffect(() => {
    const shouldGenerateVerdict = !isDebateActive && messages.length === totalTurns && topic;

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
          true // isFinalVerdict
        );
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-final-${Date.now()}`,
            agent: AgentType.Orchestrator,
            agentName: orchestratorConfig.name,
            text: response.text,
            sources: response.sources,
          },
        ]);
      } catch (e) {
        setError(e instanceof Error ? `Failed to get final verdict: ${e.message}` : 'An unknown error occurred.');
      } finally {
        setLoadingAgent(null);
        setIsGeneratingVerdict(false);
      }
    };

    generateFinalVerdict();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDebateActive, messages.length, totalTurns, topic]);


  const handleStartDebate = () => {
    if (userInput.trim().length < 10) {
      setError('Please enter a more descriptive topic (at least 10 characters).');
      return;
    }
    setTopic(userInput);
    setMessages([]);
    setError(null);
    setIsDebateActive(true);
  };

  const handleReset = () => {
    setIsDebateActive(false);
    setLoadingAgent(null);
    setAnnouncingAgent(null);
    setMessages([]);
    setTopic('');
    setUserInput('');
    setNumRounds(5);
    setError(null);
    setAgents(DEFAULT_AGENTS);
    setShowCustomizer(false);
    setIsGeneratingAudio(false);
    setAudioGenerationProgress(null);
    setIsGeneratingVerdict(false);
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
      const topic = await generateTrendingTopic();
      setUserInput(topic);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate a topic.');
    } finally {
      setIsGeneratingTopic(false);
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
    setAudioGenerationProgress({ current: 0, total: messages.filter(m => m.text.trim()).length });
    setError(null);
    try {
      const audioSegments = await generateDebateAudio(messages, agents, (current, total) => {
        setAudioGenerationProgress({ current, total });
      });

      if (audioSegments.length === 0) {
        throw new Error("Audio generation failed for all segments. Check the console for details.");
      }
  
      // Decode and concatenate all audio segments
      const decodedSegments = audioSegments.map(decode);
      const totalLength = decodedSegments.reduce((sum, arr) => sum + arr.length, 0);
      const combinedPcm = new Uint8Array(totalLength);
      let offset = 0;
      for (const segment of decodedSegments) {
        combinedPcm.set(segment, offset);
        offset += segment.length;
      }
  
      // Create WAV file and trigger download
      const wavBlob = createWaveFile(combinedPcm);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      const sanitizedTopic = topic.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
      a.download = `ai-debate-${sanitizedTopic || 'audio'}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? `Audio generation failed: ${e.message}` : 'An unknown error occurred during audio generation.');
    } finally {
      setIsGeneratingAudio(false);
      setAudioGenerationProgress(null);
    }
  };

  const isDebateFinished = messages.length > totalTurns && !loadingAgent && !announcingAgent;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4 md:p-8">
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

              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Or try a Fight Starter:</h4>
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
                        <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                <label htmlFor="rounds-input" className="font-semibold text-slate-300 block mb-2">Number of Rounds (min 1):</label>
                <input
                  id="rounds-input" type="number" value={numRounds} onChange={(e) => setNumRounds(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  min="1"
                  className="w-full bg-gray-950 border border-gray-700 p-3 focus:ring-2 focus:ring-red-500 focus:outline-none transition-shadow"
                />
              </div>
            </div>

            <div className="border-t border-gray-700/50 my-2"></div>

            <div>
              <button onClick={() => setShowCustomizer(!showCustomizer)} className="text-red-400 font-semibold hover:text-red-300 transition-colors w-full text-left flex justify-between items-center">
                <span>The Promoter's Corner (Customize Agents)</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 transition-transform ${showCustomizer ? 'rotate-180' : ''}`}><path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
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
                   <button onClick={() => setAgents(DEFAULT_AGENTS)} className="text-sm text-rose-400 hover:text-rose-300">Reset to Defaults</button>
                </div>
              )}
            </div>

            <button
              onClick={handleStartDebate}
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
            <div className="p-4 border-b border-gray-700 bg-gray-900/70">
              <h2 className="text-xl font-bold text-center">Topic: <span className="font-normal text-slate-300">{topic}</span></h2>
            </div>

            <div ref={scrollRef} className="flex-grow p-4 md:p-6 space-y-6 overflow-y-auto">
              {messages.map((msg) => (
                <AgentMessage key={msg.id} message={msg} />
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
              {isDebateFinished && (
                <div className="animate-fade-in text-center p-6 bg-gray-950/50 my-4 border border-orange-500/50">
                  <h3 className="text-2xl font-bold text-orange-400">The Final Verdict Is In!</h3>
                  <p className="text-slate-300 mt-2">Who won? The Orchestrator has spoken. You can now export the transcript or start a new fight.</p>
                </div>
              )}
              {error && (
                <div className="animate-fade-in text-center p-4 bg-rose-500/10 my-4 border border-rose-500/50 text-rose-400">
                  <p><strong>An error occurred:</strong> {error}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-700 bg-gray-900">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-400">
                  Round {Math.min(numRounds, Math.floor(messages.length / AGENT_TURN_ORDER.length) + 1)} / {numRounds}
                </div>
                <div className="flex items-center gap-4">
                  {isDebateFinished && (
                    <>
                      <button 
                        onClick={handleGenerateAudio} 
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                        disabled={isGeneratingAudio}
                      >
                        {isGeneratingAudio 
                          ? `Generating... (${audioGenerationProgress?.current ?? 0}/${audioGenerationProgress?.total ?? '?'})`
                          : 'Download Audio'}
                      </button>
                      <button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 transition-colors">Export Text</button>
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