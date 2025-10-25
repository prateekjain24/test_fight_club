
import React, { useState, useEffect } from 'react';
import type { Message } from '../types';
import { AgentType } from '../types';

const TYPING_SPEED_MS = 35; // ms per word

const OrchestratorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 2.25c-5.18 0-9.44 4.06-9.72 9.19-.03.15-.03.3-.03.46 0 5.52 4.48 10 10 10s10-4.48 10-10c0-5.42-4.28-9.85-9.72-9.99a.754.754 0 00-.56 0A9.96 9.96 0 0012 2.25zm1.5 6a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0V8.25zm-4.5 0a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0V8.25zM12 15a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /></svg>
);

const ProIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M11.25 2.25a.75.75 0 01.75.75v18a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM15.75 6a.75.75 0 01.75.75v14.25a.75.75 0 01-1.5 0V6.75a.75.75 0 01.75-.75zM6.75 9a.75.75 0 01.75.75v11.25a.75.75 0 01-1.5 0V9.75A.75.75 0 016.75 9z" /></svg>
);

const AgainstIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M15.04 4.96a.75.75 0 010 1.06L9.56 11.5l5.48 5.48a.75.75 0 11-1.06 1.06l-6-6a.75.75 0 010-1.06l6-6a.75.75 0 011.06 0z" /></svg>
);

const ConfusedIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h3a.75.75 0 000-1.5h-2.25V6z" clipRule="evenodd" /></svg>
);

const CheerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M15.75 2.25c.38 0 .72.224 1.01.562a2.252 2.252 0 011.49 3.332l-2.47 7.82c-.22.699-.87 1.162-1.59 1.162H7.51c-1.01 0-1.84-.8-2.02-1.79l-1.05-5.01A2.25 2.25 0 016.7 5.25H9.75a.75.75 0 000-1.5H6.7c-2.04 0-3.68.8-4.63 2.25a4.48 4.48 0 00.17 5.08l1.05 5.01c.52 2.49 2.76 4.31 5.24 4.31H14.25c2.04 0 3.68-.8 4.63-2.25a4.48 4.48 0 00-.17-5.08l-2.47-7.82A3.752 3.752 0 0015.75 2.25z" /></svg>
);

const ShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
);


const AGENT_CONFIGS = {
  [AgentType.Orchestrator]: {
    icon: <OrchestratorIcon />,
    borderColor: 'border-orange-500',
    textColor: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
  },
  [AgentType.Pro]: {
    icon: <ProIcon />,
    borderColor: 'border-blue-500',
    textColor: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  [AgentType.Against]: {
    icon: <AgainstIcon />,
    borderColor: 'border-rose-500',
    textColor: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
  },
  [AgentType.Confused]: {
    icon: <ConfusedIcon />,
    borderColor: 'border-fuchsia-500',
    textColor: 'text-fuchsia-400',
    bgColor: 'bg-fuchsia-500/10',
  },
};

interface AgentMessageProps {
  message: Message;
  onCheer: (messageId: string) => void;
  onShare: (message: Message) => void;
  isDebateFinished: boolean;
}

const AgentMessage: React.FC<AgentMessageProps> = ({ message, onCheer, onShare, isDebateFinished }) => {
  const config = AGENT_CONFIGS[message.agent];
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (message.text) {
      setIsTyping(true);
      setDisplayedText(''); // Reset for new messages
      const words = message.text.split(' ');
      let currentWordIndex = 0;
      
      const intervalId = setInterval(() => {
        if (currentWordIndex < words.length) {
          const word = words[currentWordIndex];
          // Add a guard to prevent "undefined" from being displayed
          if (typeof word !== 'undefined') {
            setDisplayedText(prev => prev + (prev ? ' ' : '') + word);
          }
          currentWordIndex++;
        } else {
          clearInterval(intervalId);
          setIsTyping(false);
        }
      }, TYPING_SPEED_MS);

      return () => clearInterval(intervalId);
    } else {
      setIsTyping(false);
    }
  }, [message.id, message.text]); // Rerun effect if message changes

  return (
    <div className={`group animate-fade-in border-l-4 p-4 md:p-6 ${config.borderColor} ${config.bgColor} ${isTyping ? 'animate-pulse-fast' : ''}`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
            <div className={config.textColor}>{config.icon}</div>
            <h3 className={`font-bold text-lg ${config.textColor}`}>{message.agentName}</h3>
        </div>
        {!isTyping && isDebateFinished && (
            <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onCheer(message.id)} title="Cheer for this argument" className="flex items-center gap-1.5 text-slate-400 hover:text-amber-400 transition-colors p-1">
                    <CheerIcon />
                    {message.cheers > 0 && <span className="text-xs font-bold text-amber-500">{message.cheers}</span>}
                </button>
                <button onClick={() => onShare(message)} title="Share this quote" className="text-slate-400 hover:text-blue-400 transition-colors p-1">
                    <ShareIcon />
                </button>
            </div>
        )}
      </div>
      <p className="whitespace-pre-wrap text-slate-300 min-h-[24px]">{displayedText}{isTyping && <span className="inline-block w-2 h-4 bg-slate-400 ml-1 animate-pulse"></span>}</p>
      
      {!isTyping && message.sources.length > 0 && (
        <div className="animate-fade-in mt-4 border-t border-gray-700 pt-3">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sources</h4>
          <ul className="flex flex-wrap gap-2">
            {message.sources.map((source, index) => (
              <li key={index}>
                <a
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-gray-700/50 hover:bg-gray-700/90 text-slate-300 px-2 py-1 transition-colors"
                >
                  {new URL(source.uri).hostname}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AgentMessage;
