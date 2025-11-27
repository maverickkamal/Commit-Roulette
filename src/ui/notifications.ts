import * as vscode from 'vscode';

export class Notifications {
    static async showCurseAlert(curseName: string, onUndo: () => void) {
        const undo = 'Undo Curse';
        const message = `You've been cursed! (${curseName})`;
        
        const selection = await vscode.window.showWarningMessage(message, undo, 'Accept Fate');
        
        if (selection === undo) {
            onUndo();
        }
    }
}