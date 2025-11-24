import * as vscode from 'vscode';
import { Curse } from '../curse.interface';

export class AustralianMode implements Curse {
    name = "Australian Mode";
    description = "Turns your code upside down (reverses line order)";

    canApply(): boolean {
        return !!vscode.window.activeTextEditor;
    }

    private originalContent: string | undefined;
    private timeout: NodeJS.Timeout | undefined;

    async apply(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const document = editor.document;
        this.originalContent = document.getText();

        const lines = this.originalContent.split('\n');
        const reversedLines = lines.reverse().join('\n');

        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(this.originalContent.length)
        );

        await editor.edit(editBuilder => {
            editBuilder.replace(fullRange, reversedLines);
        });

        vscode.window.showInformationMessage('Commit Roulette: G\'day mate! aye');

        const durationMinutes = vscode.workspace.getConfiguration('commitRoulette').get<number>('curseDuration') || 5;

        this.timeout = setTimeout(async () => {
            await this.undo();
            vscode.window.showInformationMessage('Commit Roulette: Back to the northern hemisphere!');
        }, durationMinutes * 50 * 1000);
    }

    async undo(): Promise<void> {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = undefined;
        }

        const editor = vscode.window.activeTextEditor;
        if (editor && this.originalContent) {
            const document = editor.document;
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(document.getText().length)
            );

            await editor.edit(editBuilder => {
                editBuilder.replace(fullRange, this.originalContent!);
            });

            this.originalContent = undefined;
        }
    }
}
