import chalk from 'chalk';

export class Logger {
  static log(source: string, message: string) {
    console.log(`${chalk.blue.bold(source)} ${message}`);
  }

  static success(source: string, message: string) {
    console.log(`${chalk.green.bold(source)} ${chalk.green(message)}`);
  }

  static warn(source: string, message: string) {
    console.warn(`${chalk.yellow.bold(source)} ${chalk.yellow(message)}`);
  }

  static error(source: string, message: string) {
    console.error(`${chalk.red.bold(source)} ${chalk.red(message)}`);
  }

  static security(source: string, command: string, prompt: string) {
    return `${chalk.magenta.bold(source)} Command: "${chalk.cyan(command)}". ${prompt}`;
  }

  static raw(source: string, message: string) {
    console.log(`${chalk.gray.bold(source)}
${chalk.gray(message)}`);
  }
}