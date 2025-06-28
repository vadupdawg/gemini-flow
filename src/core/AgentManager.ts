import { Logger } from './Logger';

interface Agent {
  id: string;
  name: string;
  mode: string;
  status: 'idle' | 'running' | 'stopped';
}

export class AgentManager {
  private agents: Map<string, Agent> = new Map();

  spawn(name: string, mode: string): Agent {
    const id = `agent-${this.agents.size + 1}`;
    const agent: Agent = {
      id,
      name,
      mode,
      status: 'idle',
    };
    this.agents.set(id, agent);
    Logger.log('[AgentManager]', `Spawned agent ${name} (${id}) in mode ${mode}`);
    return agent;
  }

  get(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  list(): Agent[] {
    return Array.from(this.agents.values());
  }

  terminate(id: string): boolean {
    if (this.agents.has(id)) {
      this.agents.delete(id);
      Logger.log('[AgentManager]', `Terminated agent ${id}`);
      return true;
    }
    return false;
  }
}
