import * as vscode from 'vscode';
import { Curse } from '../curse.interface';

export class KeyboardLagger implements Curse {
    name = "Keyboard Lagger";
    description = "Simulates keyboard lag by delaying edits";

    canApply(): boolean {
        return !!vscode.window.activeTextEditor;
    }

    private lagListener: vscode.Disposable | undefined;
    private timeout: NodeJS.Timeout | undefined;

    async apply(): Promise<void> {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) return;

        let isReapplying = false;

        this.lagListener = vscode.workspace.onDidChangeTextDocument(async (event) => {
            if (isReapplying || event.document !== activeEditor.document) return;
            if (event.contentChanges.length === 0) return;

            if (event.contentChanges.length > 1 || event.contentChanges[0].text.length > 1) return;

            isReapplying = true;


            await vscode.commands.executeCommand('undo');

            await new Promise(resolve => setTimeout(resolve, 200));

            await vscode.commands.executeCommand('redo');

            isReapplying = false;
        });

        const durationMinutes = vscode.workspace.getConfiguration('commitRoulette').get<number>('curseDuration') || 5;

        this.timeout = setTimeout(() => {
            this.undo();
            vscode.window.showInformationMessage('Commit Roulette: Keyboard Lag curse lifted!');
        }, durationMinutes * 60 * 1000);
    }

    async undo(): Promise<void> {
        if (this.lagListener) {
            this.lagListener.dispose();
            this.lagListener = undefined;
        }
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = undefined;
        }
    }
}
