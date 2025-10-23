
import React, { useState, useEffect, useRef } from 'react';
import AgentMessage from './components/AgentMessage';
import { getAgentResponse } from './services/geminiService';
import { AgentType } from './types';
import type { Message } from './types';

const AGENT_TURN_ORDER: AgentType[] = [
  AgentType.Orchestrator,
  AgentType.Pro,
  AgentType.Against,
  AgentType.Confused,
];
const TOTAL_ROUNDS = 6;
const TOTAL_TURNS = TOTAL_ROUNDS * AGENT_TURN_ORDER.length;

const App: React.FC = () => {
  const [topic, setTopic] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isDebateActive, setIsDebateActive] = useState<boolean>(false);
  const [loadingAgent, setLoadingAgent] = useState<AgentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loadingAgent]);

  useEffect(() => {
    const runDebateTurn = async () => {
      if (!isDebateActive || messages.length >= TOTAL_TURNS) {
        if(isDebateActive) {
          setIsDebateActive(false);
          setLoadingAgent(null);
        }
        return;
      }

      const currentTurnIndex = messages.length;
      const nextAgent = AGENT_TURN_ORDER[currentTurnIndex % AGENT_TURN_ORDER.length];
      const currentRound = Math.floor(currentTurnIndex / AGENT_TURN_ORDER.length) + 1;

      setLoadingAgent(nextAgent);
      setError(null);

      try {
        const response = await getAgentResponse(nextAgent, topic, messages, currentRound);
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            agent: nextAgent,
            text: response.text,
            sources: response.sources,
          },
        ]);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        setIsDebateActive(false);
        setLoadingAgent(null);
      }
    };
    
    if (isDebateActive) {
        // Add a small delay for a smoother UI update before the API call
        const timer = setTimeout(runDebateTurn, 500);
        return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDebateActive, messages, topic]);

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
    setMessages([]);
    setTopic('');
    setUserInput('');
    setError(null);
  };

  const isDebateFinished = messages.length >= TOTAL_TURNS && !loadingAgent;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center p-4 md:p-8">
      <main className="w-full max-w-4xl h-full flex flex-col">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-500 via-violet-500 to-sky-500 pb-2">
            AI Agent Fight Club
          </h1>
          <p className="text-slate-400 mt-2">Where algorithms argue and chaos is king.</p>
        </header>

        {!topic ? (
          <div className="bg-slate-800/50 rounded-lg p-6 w-full max-w-lg mx-auto flex flex-col gap-4 animate-fade-in">
            <label htmlFor="topic-input" className="font-semibold text-slate-300">Enter a Debate Topic:</label>
            <input
              id="topic-input"
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="e.g., Are cats secretly plotting world domination?"
              className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 focus:ring-2 focus:ring-violet-500 focus:outline-none transition-shadow"
              onKeyDown={(e) => e.key === 'Enter' && !isDebateActive && handleStartDebate()}
            />
            <button
              onClick={handleStartDebate}
              disabled={isDebateActive}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-4 rounded-md transition-all duration-300 transform hover:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              Start the Debate
            </button>
            {error && <p className="text-rose-400 text-sm mt-2">{error}</p>}
          </div>
        ) : (
          <div className="flex flex-col flex-grow w-full bg-slate-800/50 rounded-lg shadow-2xl overflow-hidden h-[75vh]">
            <div className="p-4 border-b border-slate-700 bg-slate-800/70">
                <h2 className="text-xl font-bold text-center">Topic: <span className="font-normal text-slate-300">{topic}</span></h2>
            </div>
            
            <div ref={scrollRef} className="flex-grow p-4 md:p-6 space-y-6 overflow-y-auto">
                {messages.map((msg) => (
                    <AgentMessage key={msg.id} message={msg} />
                ))}
                {loadingAgent && (
                    <div className="animate-pulse-fast flex items-center gap-3 text-slate-400 p-4">
                        <div className="w-6 h-6 border-2 border-slate-500 border-t-slate-300 rounded-full animate-spin"></div>
                        <span>{loadingAgent} is thinking...</span>
                    </div>
                )}
                {isDebateFinished && (
                     <div className="animate-fade-in text-center p-6 rounded-lg bg-slate-900/50 my-4 border border-amber-500/50">
                        <h3 className="text-2xl font-bold text-amber-400">The Debate Has Concluded!</h3>
                        <p className="text-slate-300 mt-2">Who won? You decide.</p>
                      </div>
                )}
                 {error && (
                    <div className="animate-fade-in text-center p-4 rounded-lg bg-rose-500/10 my-4 border border-rose-500/50 text-rose-400">
                      <p><strong>An error occurred:</strong> {error}</p>
                    </div>
                 )}
            </div>

            <div className="p-4 border-t border-slate-700 bg-slate-800">
                <div className="flex justify-between items-center">
                    <div className="text-sm text-slate-400">
                        Round {Math.min(TOTAL_ROUNDS, Math.floor(messages.length / AGENT_TURN_ORDER.length) + 1)} / {TOTAL_ROUNDS}
                    </div>
                    <button
                        onClick={handleReset}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
                    >
                        New Topic
                    </button>
                </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
