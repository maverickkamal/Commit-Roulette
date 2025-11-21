import * as vscode from 'vscode';
import { Curse } from '../curse.interface';

export class EmojiInjector implements Curse {
    name = "Emoji Injector";
    description = "Adds  random emojis to comments";

    canApply(): boolean {
        const editor = vscode.window.activeTextEditor;
        return !!editor;
    }

    async apply(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const text = editor.document.getText();
        const emojis = ['💀', '🔥', '💩', '🤡', '👻', '🎃', '⚡', '🚀', '🐛', '💻'];

        const commentRegex = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)/gm;

        const injected = text.replace(commentRegex, (match) => {
            if (Math.random() > 0.3) return match; // 30% chance to inject emoji
            
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            return `${match} ${randomEmoji}`;
        });

        const fullRange = new vscode.Range(
            editor.document.positionAt(0),
            editor.document.positionAt(text.length)
        );

        await editor.edit(editBuilder => {
            editBuilder.replace(fullRange, injected);
        });
    }
}
