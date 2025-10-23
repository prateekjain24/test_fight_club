import React from 'react';
import type { Message } from '../types';
import { AgentType } from '../types';

const OrchestratorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.15l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.15 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clipRule="evenodd" />
  </svg>
);

const ProIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l4.006-5.61z" clipRule="evenodd" />
  </svg>
);

const AgainstIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
  </svg>
);

const ConfusedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.89-1.212-2.823-1.212-3.712 0-.89 1.212.23 2.87 1.348 3.251v6.582a.75.75 0 001.5 0v-6.582c1.118-.381 2.238-2.039 1.348-3.251zm-1.878 8.667a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
  </svg>
);

const AGENT_CONFIGS = {
  [AgentType.Orchestrator]: {
    icon: <OrchestratorIcon />,
    borderColor: 'border-amber-500',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
  [AgentType.Pro]: {
    icon: <ProIcon />,
    borderColor: 'border-sky-500',
    textColor: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
  },
  [AgentType.Against]: {
    icon: <AgainstIcon />,
    borderColor: 'border-rose-500',
    textColor: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
  },
  [AgentType.Confused]: {
    icon: <ConfusedIcon />,
    borderColor: 'border-violet-500',
    textColor: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
  },
};

interface AgentMessageProps {
  message: Message;
}

const AgentMessage: React.FC<AgentMessageProps> = ({ message }) => {
  const config = AGENT_CONFIGS[message.agent];

  return (
    <div className={`animate-fade-in border-l-4 p-4 md:p-6 rounded-r-lg ${config.borderColor} ${config.bgColor}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={config.textColor}>{config.icon}</div>
        <h3 className={`font-bold text-lg ${config.textColor}`}>{message.agentName}</h3>
      </div>
      <p className="whitespace-pre-wrap text-slate-300">{message.text}</p>
      {message.sources.length > 0 && (
        <div className="mt-4 border-t border-slate-700 pt-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sources</h4>
          <ul className="flex flex-wrap gap-2">
            {message.sources.map((source, index) => (
              <li key={index}>
                <a
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-slate-700/50 hover:bg-slate-700/90 text-slate-300 px-2 py-1 rounded-md transition-colors"
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
