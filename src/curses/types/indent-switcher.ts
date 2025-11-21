import * as vscode from 'vscode';
import { Curse } from '../curse.interface';

export class IndentSwitcher implements Curse {
    name = "Indent Switcher";
    description = "Converts tabs to spaces or vice versa";

    canApply(): boolean {
        return !!vscode.window.activeTextEditor;
    }

    async apply(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const options = editor.options;
        const insertSpaces = options.insertSpaces;

        if (insertSpaces) {
            await vscode.commands.executeCommand('editor.action.indentationToTabs');
            vscode.window.showInformationMessage('Commit Roulette: Converted to TABS!!!!!');
        } else {
            await vscode.commands.executeCommand('editor.action.indentationToSpaces');
            vscode.window.showInformationMessage('Commit Roulette: Converted to SPACES!!!!!');
        }
    }
}