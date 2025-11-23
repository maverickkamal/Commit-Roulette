import * as vscode from 'vscode';
import { Curse } from '../curse.interface';

export class KeyboardLagger implements Curse {
    name = "Keyboard Lagger";
    description = "Simulates keyboard lag by delaying inputs or edits";

    canApply(): boolean {
        return !!vscode.window.activeTextEditor;
    }

    async apply(): Promise<void> {
        const disposable = vscode.workspace.onDidChangeTextDocument(async (e) => {
            if (e.contentChanges.length === 0) return;
        });

        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) return;

        let isReapplying = false;

        const lagListener = vscode.workspace.onDidChangeTextDocument(async (event) => {
            if (isReapplying || event.document !== activeEditor.document) return;
            if (event.contentChanges.length === 0) return;

            isReapplying = true;

            await vscode.commands.executeCommand('undo');

            await new Promise(resolve => setTimeout(resolve, 200));

            await vscode.commands.executeCommand('redo');

            isReapplying = false;
        });

        const durationMinutes = vscode.workspace.getConfiguration('commitRoulette').get<number>('curseDuration') || 5;

        setTimeout(() => {
            lagListener.dispose();
            vscode.window.showInformationMessage('Commit Roulette: Keyboard Lagger curse lifted!');
        }, durationMinutes * 60 * 1000);
    }
}