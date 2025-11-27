import * as vscode from 'vscode';
import { Curse } from '../curse.interface';

export class AustralianMode implements Curse {
    name = "Australian Mode";
    description = "Turns your code upside down (reverses line order)";

    canApply(): boolean {
        return !!vscode.window.activeTextEditor;
    }

    private originalContent: string | undefined;
    private documentUri: vscode.Uri | undefined;
    private timeout: NodeJS.Timeout | undefined;

    async apply(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        if (this.originalContent) {
            await this.undo();
        }

        const document = editor.document;
        this.documentUri = document.uri;
        this.originalContent = document.getText();

        const lines = this.originalContent.split('\n');
        const reversedLines = lines.reverse().join('\n');

        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(this.originalContent.length)
        );

        try {
            await editor.edit(editBuilder => {
                editBuilder.replace(fullRange, reversedLines);
            });

            vscode.window.showInformationMessage('Commit Roulette: G\'day mate! aye');
        } catch (error) {
            console.error('Commit Roulette: Australian Mode failed to apply', error);
            this.originalContent = undefined;
            this.documentUri = undefined;
            return;
        }

        const durationMinutes = vscode.workspace.getConfiguration('commitRoulette').get<number>('curseDuration') || 5;

        this.timeout = setTimeout(async () => {
            await this.undo();
            vscode.window.showInformationMessage('Commit Roulette: Back to the northern hemisphere!');
        }, durationMinutes * 60 * 1000);
    }

    async undo(): Promise<void> {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = undefined;
        }

        if (this.originalContent && this.documentUri) {
            const editor = vscode.window.visibleTextEditors.find(e => e.document.uri.toString() === this.documentUri?.toString());
            if (editor) {
        
                const document = editor.document;
                const fullRange = new vscode.Range(
                    document.positionAt(0),
                    document.positionAt(document.getText().length)
                );

                await editor.edit(editBuilder => {
                    editBuilder.replace(fullRange, this.originalContent!);
                });
            } else {
                vscode.window.showWarningMessage('Commit Roulette: Could not restore Australian Mode (file closed)');
            }

            this.originalContent = undefined;
            this.documentUri = undefined;
        }
    }
}
