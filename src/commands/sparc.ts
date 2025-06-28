import { Command } from 'commander';
import { Orchestrator, WorkflowStep } from '../core/Orchestrator';
import * as dotenv from 'dotenv';

dotenv.config();

export const sparcCommand = () => {
  const command = new Command('sparc')
    .description('Run a SPARC workflow')
    .option('--parallel', 'Run agents in parallel')
    .action(async (options) => {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error('GEMINI_API_KEY not found in .env file.');
        return;
      }

      const orchestrator = new Orchestrator(apiKey);

      // Create agents
      orchestrator.addAgent('coder', 'coder');
      orchestrator.addAgent('documenter', 'documenter');

      // Define a memory-driven workflow
      const workflow: WorkflowStep[] = [
        {
          agent: 'coder',
          task: 'Generate Python code for a moving average crossover trading strategy. The output should be a JSON object with a "content" field containing the code.',
          outputKey: 'algorithm_code'
        },
        {
          agent: 'documenter',
          task: 'Based on the provided Python code, create detailed documentation in Markdown format. The output should be a JSON object with a "content" field containing the documentation.',
          inputKey: 'algorithm_code',
          outputKey: 'algorithm_documentation'
        },
        {
            agent: 'coder',
            task: 'Save the generated Python code to a file named "trading_algorithm.py" in a new "output" directory. Use the writeFile tool.',
            inputKey: 'algorithm_code',
        },
        {
            agent: 'coder',
            task: 'Save the generated documentation to a file named "trading_algorithm.md" in the "output" directory. Use the writeFile tool.',
            inputKey: 'algorithm_documentation',
        }
      ];

      // Run the workflow
      await orchestrator.runWorkflow(workflow, options.parallel);

      console.log("\nWorkflow finished. Check the memory for the results.");
    });

  return command;
};
