import * as vscode from 'vscode';
import { Curse } from '../curse.interface';

export class EmojiInjector implements Curse {
    name = "Emoji Injector";
    description = "Adds  random emojis to comments and now strings";

    canApply(): boolean {
      
        return !!vscode.window.activeTextEditor;
    }

    async apply(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const document = editor.document;
        const text = document.getText();


        const regex = /(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)|("(\\.|[^"\\])*")|('(\\.|[^'\\])*')|(`(\\.|[^`\\])*`)/g;

        const emojis = ['😀', '😂', '🔥', '🐛', '💩', '💀', '🚀', '💻', '😱', '🤡', '👻', '🤖'];

        const edits: vscode.TextEdit[] = [];
        let match;
        while ((match = regex.exec(text)) !== null) {

            if (Math.random() > 0.5) {
                const startPos = document.positionAt(match.index + match[0].length - 1);
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                edits.push(vscode.TextEdit.insert(startPos, randomEmoji));
            }
        }

        if (edits.length > 0) {
            await editor.edit(editBuilder => {
                edits.forEach(edit => editBuilder.insert(edit.range.start, edit.newText));
            }); 
            vscode.window.showInformationMessage(`Commit Roulette: Injected ${edits.length} emojis!!!!!!!!!!!!`)
        }
    }
}

