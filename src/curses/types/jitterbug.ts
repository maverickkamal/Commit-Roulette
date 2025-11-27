import * as vscode from 'vscode';
import { Curse } from '../curse.interface';

export class Jitterbug implements Curse {
    name = "The Jitterbug (File Hopper)";
    description = "Randomly switches between open files and leaves 'helpful' comments.";

    canApply(): boolean {
        return vscode.workspace.textDocuments.length > 1;
    }

    private isRunning = false;
    private comments = [
        "// Did you mean to write this?",
        "// This looks suspicious...",
        "// TODO: Rewrite this entire file",
        "// I'm watching you...",
        "// Bug detected (maybe), ha!",
        "// ¯\\_(ツ)_/¯",
        "// This code is cursed",
        "// Have you tried turning it off and on again?"
    ];

    async apply(): Promise<void> {
        this.isRunning = true;
        const durationMinutes = vscode.workspace.getConfiguration('commitRoulette').get<number>('curseDuration') || 5;
        const endTime = Date.now() + (durationMinutes * 60 * 1000);

        this.hopLoop(endTime);
    }

    private async hopLoop(endTime: number) {
        if (!this.isRunning) return;

        if (Date.now() > endTime) {
            this.stop();
            vscode.window.showInformationMessage('Commit Roulette: The hopping has stopped.');
            return;
        }

        try {
            const documents = vscode.workspace.textDocuments.filter(doc => !doc.isClosed && doc.uri.scheme === 'file');

            if (documents.length > 0) {
                const randomDoc = documents[Math.floor(Math.random() * documents.length)];

                const editor = await vscode.window.showTextDocument(randomDoc, {
                    preview: false,
                    preserveFocus: false
                });

                const lineCount = randomDoc.lineCount;
                const randomLine = Math.floor(Math.random() * lineCount);
                const randomComment = this.comments[Math.floor(Math.random() * this.comments.length)];

                await editor.edit(editBuilder => {
                    const position = new vscode.Position(randomLine, 0);
                    editBuilder.insert(position, `${randomComment}\n`);
                });
            }
        } catch (e) {
            console.error('File Hopper error:', e);
        }

        if (this.isRunning) {
            setTimeout(() => this.hopLoop(endTime), 30000);
        }
    }

    async undo(): Promise<void> {
        this.stop();
        vscode.window.showInformationMessage('Commit Roulette: File Hopper stopped. You might want to check your files for comments!');
    }

    private stop() {
        this.isRunning = false;
    }
}
