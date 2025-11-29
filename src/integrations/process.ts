// Process management utilities for playback control

import { spawn, ChildProcess } from 'child_process';
import { ErrorCode, YTNinjaError } from '../utils/index.js';

/**
 * Process tracker for managing playback sessions
 */
class ProcessTracker {
  private processes: Map<number, ChildProcess> = new Map();
  private nextId = 1;

  /**
   * Add a process to track
   */
  add(process: ChildProcess): number {
    const id = this.nextId++;
    this.processes.set(id, process);

    // Auto-remove when process exits
    process.on('exit', () => {
      this.processes.delete(id);
    });

    return id;
  }

  /**
   * Get a tracked process
   */
  get(id: number): ChildProcess | undefined {
    return this.processes.get(id);
  }

  /**
   * Remove a process from tracking
   */
  remove(id: number): void {
    this.processes.delete(id);
  }

  /**
   * Get all active process IDs
   */
  getActiveIds(): number[] {
    return Array.from(this.processes.keys());
  }

  /**
   * Kill a specific process
   */
  kill(id: number): boolean {
    const process = this.processes.get(id);
    if (process) {
      try {
        process.kill();
        this.processes.delete(id);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Kill all tracked processes
   */
  killAll(): void {
    for (const [id, process] of this.processes.entries()) {
      try {
        process.kill();
      } catch {
        // Ignore errors
      }
      this.processes.delete(id);
    }
  }

  /**
   * Check if any processes are active
   */
  hasActive(): boolean {
    return this.processes.size > 0;
  }
}

// Global process tracker
const processTracker = new ProcessTracker();

/**
 * Process manager for playback operations
 */
export class ProcessManager {
  /**
   * Launch VLC player
   */
  static launchVLC(url: string): number {
    try {
      // Try to find VLC in common locations
      const vlcPaths = [
        'vlc', // Linux/Mac (in PATH)
        'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe', // Windows default
        'C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe', // Windows 32-bit
        '/Applications/VLC.app/Contents/MacOS/VLC', // macOS
      ];

      let launched = false;

      for (const path of vlcPaths) {
        try {
          const process = spawn(path, [url], {
            detached: true,
            stdio: 'ignore',
          });

          process.unref();
          launched = true;
          return processTracker.add(process);
        } catch {
          continue;
        }
      }

      if (!launched) {
        throw new YTNinjaError(
          ErrorCode.PLAYER_NOT_FOUND,
          'VLC player not found',
          undefined,
          [
            'Install VLC Media Player',
            'Download from: https://www.videolan.org/vlc/',
            'Or use browser playback instead',
          ]
        );
      }

      return -1;
    } catch (error) {
      if (error instanceof YTNinjaError) throw error;
      throw new YTNinjaError(
        ErrorCode.PLAYER_LAUNCH_FAILED,
        'Failed to launch VLC player',
        error,
        ['Check if VLC is installed correctly', 'Try using browser playback instead']
      );
    }
  }

  /**
   * Launch browser
   */
  static launchBrowser(url: string): number {
    try {
      let command: string;
      let args: string[];

      // Detect platform and use appropriate command
      if (process.platform === 'win32') {
        command = 'cmd';
        args = ['/c', 'start', url];
      } else if (process.platform === 'darwin') {
        command = 'open';
        args = [url];
      } else {
        command = 'xdg-open';
        args = [url];
      }

      const browserProcess = spawn(command, args, {
        detached: true,
        stdio: 'ignore',
      });

      browserProcess.unref();
      return processTracker.add(browserProcess);
    } catch (error) {
      throw new YTNinjaError(
        ErrorCode.PLAYER_LAUNCH_FAILED,
        'Failed to launch browser',
        error,
        ['Check your default browser settings', 'Try copying the URL manually']
      );
    }
  }

  /**
   * Launch ffplay for audio playback
   */
  static launchFFplay(url: string, loop = false): number {
    try {
      const args = ['-nodisp', '-autoexit'];

      if (loop) {
        args.push('-loop', '0');
      }

      args.push(url);

      const process = spawn('ffplay', args, {
        detached: true,
        stdio: 'ignore',
      });

      process.unref();
      return processTracker.add(process);
    } catch (error) {
      throw new YTNinjaError(
        ErrorCode.PLAYER_NOT_FOUND,
        'ffplay not found',
        error,
        [
          'ffplay is part of FFmpeg',
          'Install FFmpeg from: https://ffmpeg.org/',
          'Or use VLC for audio playback',
        ]
      );
    }
  }

  /**
   * Stop a specific playback process
   */
  static stopProcess(processId: number): boolean {
    return processTracker.kill(processId);
  }

  /**
   * Stop all playback processes
   */
  static stopAll(): void {
    processTracker.killAll();
  }

  /**
   * Check if any playback is active
   */
  static hasActivePlayback(): boolean {
    return processTracker.hasActive();
  }

  /**
   * Get all active process IDs
   */
  static getActiveProcessIds(): number[] {
    return processTracker.getActiveIds();
  }

  /**
   * Check if VLC is available
   */
  static async isVLCAvailable(): Promise<boolean> {
    const { existsSync } = await import('fs');

    const vlcPaths = [
      'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe', // Windows default
      'C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe', // Windows 32-bit
      '/Applications/VLC.app/Contents/MacOS/VLC', // macOS
    ];

    // On Windows, check if file exists
    if (process.platform === 'win32') {
      for (const vlcPath of vlcPaths) {
        if (existsSync(vlcPath)) {
          return true;
        }
      }
      return false;
    }

    // On Unix systems, try running vlc --version
    try {
      const result = await new Promise<boolean>((resolve) => {
        const testProcess = spawn('vlc', ['--version'], {
          stdio: 'ignore',
        });

        testProcess.on('error', () => resolve(false));
        testProcess.on('exit', (code) => resolve(code === 0));

        // Timeout after 2 seconds
        setTimeout(() => {
          testProcess.kill();
          resolve(false);
        }, 2000);
      });

      return result;
    } catch {
      return false;
    }
  }

  /**
   * Check if ffplay is available
   */
  static async isFFplayAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const process = spawn('ffplay', ['-version'], {
          stdio: 'ignore',
        });

        process.on('error', () => resolve(false));
        process.on('exit', (code) => resolve(code === 0));
      } catch {
        resolve(false);
      }
    });
  }
}

// Export process tracker for testing
export { processTracker };
