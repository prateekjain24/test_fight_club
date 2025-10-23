
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
  text: string;
  sources: Source[];
}
