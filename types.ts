export enum AgentType {
  Orchestrator = 'The Orchestrator',
  Pro = 'The Advocate',
  Against = 'The Dissenter',
  Confused = 'The Wildcard',
}

export interface Source {
  uri: string;
  title: string;
}

export interface Message {
  id: string;
  agent: AgentType;
  agentName: string; // The customizable name of the agent
  text: string;
  sources: Source[];
}

export interface AgentConfig {
  name: string;
  persona: string;
  model: string;
  voice: string;
  ttsPrompt: string;
}

export type AgentCollection = Record<AgentType, AgentConfig>;