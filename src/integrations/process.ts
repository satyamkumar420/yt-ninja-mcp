// Process management utilities for playback control

import { spawn } from 'child_process';
import { ErrorCode, YTNinjaError } from '../utils/index.js';

/**
 * Process manager for playback operations
 */
export class ProcessManager {
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

      // Return a dummy process ID since we don't track it
      return 1;
    } catch (error) {
      throw new YTNinjaError(
        ErrorCode.PLAYER_LAUNCH_FAILED,
        'Failed to launch browser',
        error,
        ['Check your default browser settings', 'Try copying the URL manually']
      );
    }
  }
}
