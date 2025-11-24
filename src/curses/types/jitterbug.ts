import * as vscode from 'vscode';
import { Curse } from '../curse.interface';

export class Jitterbug implements Curse {
    name = "The Jitterbug";
    description = "It simulates an earthquake by shaking the screen (rapid scrolling)"

    canApply(): boolean {
        return !!vscode.window.activeTextEditor;
    }

    async apply(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const durationMinutes = vscode.workspace.getConfiguration('commitRoulette').get<number>('curseDuration') || 5;
        const endTime = Date.now() + (durationMinutes * 60 * 1000);

        const interval = setInterval(async () => {
            if (Date.now() > endTime || !vscode.window.activeTextEditor) {
                clearInterval(interval);
                vscode.window.showInformationMessage('Commit Roulette: The earth stands still again.');
                return;
            }

            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                const direction = Math.random() > 0.5 ? 'up' : 'down';
                await vscode.commands.executeCommand('editorScroll', {
                    to: direction,
                    by: 'line',
                    value: 1,
                    revealCursor: false
                });

                setTimeout(async () => {
                    await vscode.commands.executeCommand('editorScroll', {
                        to: direction === 'up' ? 'down' : 'up',
                        by: 'line',
                        value: 1,
                        revealCursor: false
                    });
                }, 50);
            }  
        }, 3000);
    }
}


