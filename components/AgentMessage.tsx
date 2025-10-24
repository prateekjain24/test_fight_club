
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
}

const AgentMessage: React.FC<AgentMessageProps> = ({ message }) => {
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
  }, [message.id]); // Rerun effect if message ID changes

  return (
    <div className={`animate-fade-in border-l-4 p-4 md:p-6 ${config.borderColor} ${config.bgColor} ${isTyping ? 'animate-pulse-fast' : ''}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={config.textColor}>{config.icon}</div>
        <h3 className={`font-bold text-lg ${config.textColor}`}>{message.agentName}</h3>
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
