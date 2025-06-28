import chalk from 'chalk';

export class Logger {
  static log(prefix: string, message: string) {
    console.log(`${chalk.blue.bold(prefix)} ${message}`);
  }

  static success(prefix: string, message: string) {
    console.log(`${chalk.green.bold(prefix)} ${message}`);
  }

  static error(prefix: string, message: string) {
    console.error(`${chalk.red.bold(prefix)} ${message}`);
  }

  static warn(prefix: string, message: string) {
    console.warn(`${chalk.yellow.bold(prefix)} ${message}`);
  }

  static security(prefix: string, command: string, confirmationPrompt: string) {
    console.log(`\n${chalk.red.bold(prefix)} Agent wants to execute the following command:\n\n  ${chalk.cyan(command)}\n`);
    return `${chalk.red.bold(prefix)} ${confirmationPrompt}`;
  }
}
