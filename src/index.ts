#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { commands } from './commands';

const cli = yargs(hideBin(process.argv));

cli
    .command(commands)
    .demandCommand(1, 'You need at least one command before moving on')
    .help()
    .argv;
