import * as vscode from 'vscode';
import { CommitDetector } from "./git/commit-detector";
import { BackupManager } from './git/backup-manager';
import { CurseEngine } from './curses/curse-engine';
import { HistoryStore } from './storage/history';
import { DashboardPanel } from './ui/dashboard';


export function activate(context: vscode.ExtensionContext) {
    console.log('Commit Roulette is now active!');

    const historyStore = new HistoryStore(context);
    const backupManager = new BackupManager(context);
    const curseEngine = new CurseEngine(context, backupManager, historyStore);
    const detector = new CommitDetector(context);

    detector.onCommitDetected(async () => {
        const config = vscode.workspace.getConfiguration('commitRoulette');
        const enabled = config.get<boolean>('enabled', true);
        const probability = config.get<number>('probability', 1);

        if (enabled) {
            await curseEngine.executeCurseRoulette(probability);
        }
    });

    context.subscriptions.push(
        vscode.commands.registerCommand('commitRoulette.undoCurse', async () => {
            await curseEngine.undoLastCurse();
        }),
        vscode.commands.registerCommand('commitRoulette.showStats', () => {
            DashboardPanel.createOrShow(context.extensionUri, historyStore);
        }),
        vscode.commands.registerCommand('commitRoulette.testCurse', async () => {
            await curseEngine.executeCurseRoulette(100);
        })
    );

    const  statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.text = '$(beaker) Commit Roulette';
    statusBar.command = 'commitRoulette.showStats';
    statusBar.tooltip = 'Click to show Commit Roulette stats';
    statusBar.show();
    context.subscriptions.push(statusBar);
}

export function deactivate() { }