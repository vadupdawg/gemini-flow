import { CommandModule } from 'yargs';
import express from 'express';
import { Logger } from '../core/Logger';

export const startCommand: CommandModule = {
  command: 'start',
  describe: 'Start the Gemini Flow web UI',
  builder: {
    port: {
      describe: 'Port to run the web UI on',
      alias: 'p',
      type: 'number',
      default: 3000,
    },
  },
  handler: (argv) => {
    const app = express();
    const port = argv.port;

    app.get('/', (req, res) => {
      res.send('<h1>Gemini Flow</h1><p>Monitoring UI coming soon...</p>');
    });

    app.listen(port, () => {
      Logger.log('[WebUI]', `Gemini Flow UI listening on http://localhost:${port}`);
    });
  },
};
