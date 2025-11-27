import * as vscode from 'vscode';
import { Curse } from '../curse.interface';

export class SoundEffect implements Curse {
    name = "Sound Effect";
    description = "Plays a random sound effect";

    canApply(): boolean {
        return true;
    }

    async apply(): Promise<void> {
        const cp = require('child_process');
        const volume = vscode.workspace.getConfiguration('commitRoulette').get<number>('soundVolume') || 50;

        if (volume === 0) {
            return;
        }

        const command = `powershell -c "[System.Console]::Beep(800, 200); [System.Console]::Beep(600, 200); [System.Console]::Beep(400, 400)"`;

        cp.exec(command, (err: any, stdout: any, stderr: any) => {
            if (err) {
                console.error('CommitRoulette: Sound failed', err);
                vscode.window.showErrorMessage('Commit Roulette: Failed to play sound (PowerShell error).');
            }
        });
    }
}
