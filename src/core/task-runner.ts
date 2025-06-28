
import { Agent } from './Agent';

async function main() {
  let input = '';
  process.stdin.on('data', (chunk) => {
    input += chunk;
  });

  process.stdin.on('end', async () => {
    try {
      const { task, systemPrompt, apiKey } = JSON.parse(input);
      
      // We need a dummy agent name and mode for now.
      // This can be expanded later.
      const agent = new Agent('task-runner-agent', 'task-runner-mode', apiKey);
      
      const result = await agent.run(task, systemPrompt);
      
      process.stdout.write(result);
      process.exit(0);
    } catch (error) {
      if (error instanceof Error) {
        process.stderr.write(error.message);
      } else {
        process.stderr.write('An unknown error occurred.');
      }
      process.exit(1);
    }
  });
}

main();
