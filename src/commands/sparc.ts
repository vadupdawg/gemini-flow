import { Command } from 'commander';
import { Orchestrator, WorkflowStep } from '../core/Orchestrator';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

interface WorkflowFile {
  agents: { [key: string]: string };
  workflow: WorkflowStep[];
}

export const sparcCommand = () => {
  const command = new Command('sparc')
    .description('Run a SPARC workflow from a file')
    .argument('<workflowFile>', 'Path to the workflow file (e.g., workflow.json)')
    .option('--parallel', 'Run agents in parallel')
    .action(async (workflowFile, options) => {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error('GEMINI_API_KEY not found in .env file.');
        return;
      }

      const filePath = path.resolve(process.cwd(), workflowFile);
      if (!fs.existsSync(filePath)) {
        console.error(`Workflow file not found at: ${filePath}`);
        return;
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const workflowData: WorkflowFile = JSON.parse(fileContent);

      const orchestrator = new Orchestrator(apiKey);

      // Create agents from the workflow file
      for (const agentName in workflowData.agents) {
        orchestrator.addAgent(agentName, workflowData.agents[agentName]);
      }

      // Run the workflow
      await orchestrator.runWorkflow(workflowData.workflow, options.parallel);

      console.log("\nWorkflow finished. Check the memory for the results.");
    });

  return command;
};
