import * as vscode from 'vscode';
import { Curse } from '../curse.interface';

export class IndentSwitcher implements Curse {
    name = "Indent Switcher";
    description = "Converts tabs to spaces or vice versa";

    canApply(): boolean {
        return !!vscode.window.activeTextEditor;
    }

    private originalInsertSpaces: boolean | undefined;
    private originalTabSize: number | string | undefined;

    async apply(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const options = editor.options;
        this.originalInsertSpaces = options.insertSpaces as boolean;
        this.originalTabSize = options.tabSize;

        
        const insertSpaces = options.insertSpaces;

        const newTabSize = [2, 4, 8][Math.floor(Math.random() * 3)];

        if (insertSpaces) {
            editor.options = { insertSpaces: false, tabSize: newTabSize };
            await vscode.commands.executeCommand('editor.action.indentationToTabs');
            vscode.window.showInformationMessage(`Commit Roulette: Converted to TABS (Size ${newTabSize})!`);
        } else {
            editor.options = { insertSpaces: true, tabSize: newTabSize };
            await vscode.commands.executeCommand('editor.action.indentationToSpaces');
            vscode.window.showInformationMessage(`Commit Roulette: Converted to SPACES (Size ${newTabSize})!`);
        }

        await vscode.commands.executeCommand('editor.action.formatDocument');
    }

    async undo(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        if (this.originalInsertSpaces !== undefined && this.originalTabSize !== undefined) {
            editor.options = {
                insertSpaces: this.originalInsertSpaces,
                tabSize: this.originalTabSize
            };

            if (this.originalInsertSpaces) {
                await vscode.commands.executeCommand('editor.action.indentationToSpaces');
            } else {
                await vscode.commands.executeCommand('editor.action.indentationToTabs');
            }

            await vscode.commands.executeCommand('editor.action.formatDocument');
            vscode.window.showInformationMessage('Commit Roulette: Indent Switcher curse lifted!');
        }
            
    }
}