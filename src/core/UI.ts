import ora, { Ora } from 'ora';
import chalk from 'chalk';
import boxen from 'boxen';
import figures from 'figures';

interface SpinnerOptions {
  text?: string;
  color?: string;
  prefixText?: string;
}

interface TaskSpinner {
  spinner: Ora;
  startTime: number;
  taskName: string;
}

export class UI {
  private static activeSpinners: Map<string, TaskSpinner> = new Map();
  private static spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  
  // Modern color palette
  private static colors = {
    primary: chalk.hex('#4285F4'), // Google Blue
    success: chalk.hex('#34A853'), // Google Green
    warning: chalk.hex('#FBBC04'), // Google Yellow
    error: chalk.hex('#EA4335'), // Google Red
    info: chalk.hex('#9AA0A6'), // Gray
    accent: chalk.hex('#AF5CF7'), // Purple accent
    dim: chalk.dim,
    bold: chalk.bold
  };

  // Icons
  private static icons = {
    success: figures.tick,
    error: figures.cross,
    warning: figures.warning,
    info: figures.info,
    bullet: figures.bullet,
    pointer: figures.pointer,
    arrow: figures.arrowRight,
    robot: '🤖',
    sparkles: '✨',
    rocket: '🚀',
    gear: '⚙️',
    brain: '🧠',
    check: '✓',
    lightning: '⚡'
  };

  // Agent status indicators
  static agentStart(agentName: string, task: string): void {
    const prefixText = `${this.icons.robot} ${this.colors.bold(agentName)}`;
    const spinner = ora({
      text: this.colors.dim(task),
      prefixText,
      spinner: {
        interval: 80,
        frames: this.spinnerFrames
      },
      color: 'blue'
    }).start();

    this.activeSpinners.set(agentName, {
      spinner,
      startTime: Date.now(),
      taskName: task
    });
  }

  static agentSuccess(agentName: string, message?: string): void {
    const taskSpinner = this.activeSpinners.get(agentName);
    if (taskSpinner) {
      const duration = ((Date.now() - taskSpinner.startTime) / 1000).toFixed(1);
      const successText = message || taskSpinner.taskName;
      
      taskSpinner.spinner.stopAndPersist({
        symbol: this.colors.success(this.icons.success),
        text: `${this.colors.success(successText)} ${this.colors.dim(`(${duration}s)`)}`
      });
      
      this.activeSpinners.delete(agentName);
    }
  }

  static agentError(agentName: string, error: string): void {
    const taskSpinner = this.activeSpinners.get(agentName);
    if (taskSpinner) {
      taskSpinner.spinner.stopAndPersist({
        symbol: this.colors.error(this.icons.error),
        text: this.colors.error(error)
      });
      
      this.activeSpinners.delete(agentName);
    }
  }

  static agentInfo(agentName: string, info: string): void {
    const taskSpinner = this.activeSpinners.get(agentName);
    if (taskSpinner) {
      taskSpinner.spinner.text = this.colors.info(info);
    }
  }

  // System-wide messages
  static header(title: string, subtitle?: string): void {
    console.log();
    console.log(
      boxen(
        `${this.colors.primary(this.colors.bold(title))}${subtitle ? `\n${this.colors.dim(subtitle)}` : ''}`,
        {
          padding: 1,
          margin: 0,
          borderStyle: 'round',
          borderColor: 'blue',
          align: 'center'
        }
      )
    );
    console.log();
  }

  static section(title: string): void {
    console.log();
    console.log(`${this.colors.accent('▸')} ${this.colors.bold(title)}`);
  }

  static subsection(title: string): void {
    console.log(`  ${this.colors.dim('◦')} ${title}`);
  }

  static success(message: string): void {
    console.log(`${this.colors.success(this.icons.success)} ${this.colors.success(message)}`);
  }

  static error(message: string): void {
    console.log(`${this.colors.error(this.icons.error)} ${this.colors.error(message)}`);
  }

  static warning(message: string): void {
    console.log(`${this.colors.warning(this.icons.warning)} ${this.colors.warning(message)}`);
  }

  static info(message: string): void {
    console.log(`${this.colors.info(this.icons.info)} ${this.colors.info(message)}`);
  }

  static log(message: string): void {
    console.log(`  ${message}`);
  }

  static dim(message: string): void {
    console.log(this.colors.dim(`  ${message}`));
  }

  // Progress indicators
  static startProgress(title: string, items: string[]): void {
    console.log();
    console.log(`${this.colors.primary(this.icons.lightning)} ${this.colors.bold(title)}`);
    items.forEach(item => {
      console.log(`  ${this.colors.dim('○')} ${this.colors.dim(item)}`);
    });
  }

  static updateProgress(index: number, total: number, current: string): void {
    const percentage = Math.round((index + 1) / total * 100);
    console.log(`  ${this.colors.success('●')} ${current} ${this.colors.dim(`[${percentage}%]`)}`);
  }

  // Task list display
  static showTaskList(tasks: any[]): void {
    const pending = tasks.filter(t => t.status === 'pending');
    const inProgress = tasks.filter(t => t.status === 'in_progress');
    const completed = tasks.filter(t => t.status === 'completed');

    console.log();
    console.log(
      boxen(
        `${this.icons.brain} ${this.colors.bold('Task Overview')}\n\n` +
        `${this.colors.success(`✓ Completed: ${completed.length}`)}  ` +
        `${this.colors.warning(`◐ In Progress: ${inProgress.length}`)}  ` +
        `${this.colors.dim(`○ Pending: ${pending.length}`)}`,
        {
          padding: 1,
          borderStyle: 'round',
          borderColor: 'gray'
        }
      )
    );

    if (inProgress.length > 0) {
      this.section('Active Tasks');
      inProgress.forEach(task => {
        console.log(`  ${this.colors.warning('◐')} ${task.task} ${this.colors.dim(`[${task.agent}]`)}`);
      });
    }

    if (pending.length > 0 && pending.length <= 5) {
      this.section('Upcoming Tasks');
      pending.slice(0, 5).forEach(task => {
        console.log(`  ${this.colors.dim('○')} ${this.colors.dim(task.task)} ${this.colors.dim(`[${task.agent}]`)}`);
      });
      if (pending.length > 5) {
        console.log(`  ${this.colors.dim(`... and ${pending.length - 5} more`)}`);
      }
    }
  }

  // Command execution display
  static showCommand(command: string): void {
    console.log();
    console.log(`${this.colors.accent('$')} ${this.colors.bold(command)}`);
  }

  static showOutput(output: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const lines = output.split('\n');
    const colorFn = type === 'success' ? this.colors.success :
                    type === 'error' ? this.colors.error :
                    this.colors.dim;
    
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`  ${colorFn(line)}`);
      }
    });
  }

  // Special displays
  static showWelcome(): void {
    console.clear();
    console.log(
      boxen(
        `${this.icons.sparkles} ${this.colors.primary(this.colors.bold('Gemini Flow'))} ${this.icons.sparkles}\n\n` +
        `${this.colors.dim('AI-Powered Development Orchestration')}\n` +
        `${this.colors.dim('Powered by Google Gemini')}`,
        {
          padding: 2,
          margin: 1,
          borderStyle: 'double',
          borderColor: 'blue',
          align: 'center'
        }
      )
    );
  }

  static showSparcModes(modes: string[]): void {
    console.log();
    console.log(
      boxen(
        `${this.icons.brain} ${this.colors.bold('Available SPARC Modes')}\n\n` +
        modes.map((mode, i) => 
          `${this.colors.accent(String(i + 1).padStart(2))}. ${mode}`
        ).join('\n'),
        {
          padding: 1,
          borderStyle: 'round',
          borderColor: 'gray'
        }
      )
    );
  }

  // Clean up all spinners
  static cleanup(): void {
    this.activeSpinners.forEach(({ spinner }) => {
      spinner.stop();
    });
    this.activeSpinners.clear();
  }
}

// Export convenience functions
export const ui = {
  // Agent operations
  agentStart: UI.agentStart.bind(UI),
  agentSuccess: UI.agentSuccess.bind(UI),
  agentError: UI.agentError.bind(UI),
  agentInfo: UI.agentInfo.bind(UI),
  
  // Messages
  header: UI.header.bind(UI),
  section: UI.section.bind(UI),
  subsection: UI.subsection.bind(UI),
  success: UI.success.bind(UI),
  error: UI.error.bind(UI),
  warning: UI.warning.bind(UI),
  info: UI.info.bind(UI),
  log: UI.log.bind(UI),
  dim: UI.dim.bind(UI),
  
  // Progress
  startProgress: UI.startProgress.bind(UI),
  updateProgress: UI.updateProgress.bind(UI),
  
  // Display
  showTaskList: UI.showTaskList.bind(UI),
  showCommand: UI.showCommand.bind(UI),
  showOutput: UI.showOutput.bind(UI),
  showWelcome: UI.showWelcome.bind(UI),
  showSparcModes: UI.showSparcModes.bind(UI),
  
  // Cleanup
  cleanup: UI.cleanup.bind(UI)
};