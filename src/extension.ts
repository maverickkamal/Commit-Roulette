import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('System Check: Extension is now active!');
    const disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from Mav!!');
    });
    context.subscriptions.push(disposable);
}  

export function deactivate() {}