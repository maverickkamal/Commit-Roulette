import * as vscode from 'vscode';
import { Curse } from '../curse.interface';

export class VariableReverser implements Curse {
    name = "Variable Reverser";
    description = "Reverses all variable names";

    canApply(): boolean {
        const editor = vscode.window.activeTextEditor;
        return !!editor && this.supportedLanguage(editor.document.languageId);
    }

    async apply(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const text = editor.document.getText();

        const reversed = text.replace(
            /\b([a-z][a-zA-Z0-9_]*)\b/g,
            (match) => {
                if (this.isKeyword(match)) return match;
                return this.reverseString(match);
            }
        );

        const fullRange = new vscode.Range(
            editor.document.positionAt(0),
            editor.document.positionAt(text.length)
        );

        await editor.edit((editBuilder) => {
            editBuilder.replace(fullRange, reversed);
        });
    }

    private reverseString(str: string): string {
        return str.split('').reverse().join('');
    }

    private isKeyword(word: string): boolean {
        const keywords = [
            'function', 'const', 'let', 'var', 'class', 'if', 'else', 'return',
            'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'finally',
            'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'default',
            'interface', 'type', 'enum', 'namespace', 'module', 'public', 'private',
            'protected', 'static', 'readonly', 'implements', 'extends', 'new', 'this',
            'super', 'true', 'false', 'null', 'undefined', 'void', 'any', 'number',
            'string', 'boolean', 'object', 'symbol', 'bigint', 'never', 'unknown'
        ];
        return keywords.includes(word);
    }

    private supportedLanguage(langId: string): boolean {
        return ['typescript', 'javascript', 'python', 'java', 'csharp', 'cpp', 'go', 'c'].includes(langId);
    }
    
}