
import { Command } from 'commander';
import express from 'express';

export const startCommand = () => {
  const command = new Command('start')
    .description('Start the Gemini Flow web UI')
    .option('-p, --port <port>', 'Port to run the web UI on', '3000')
    .action((options) => {
      const app = express();
      const port = parseInt(options.port, 10);

      app.get('/', (req, res) => {
        res.send('<h1>Gemini Flow</h1><p>Monitoring UI coming soon...</p>');
      });

      app.listen(port, () => {
        console.log(`Gemini Flow UI listening on port ${port}`);
      });
    });

  return command;
};
