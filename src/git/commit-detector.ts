import * as vscode from 'vscode';
import simpleGit, { SimpleGit } from 'simple-git';

export class CommitDetector {
    private lastHash: string = '';
    private git: SimpleGit;
    private _onCommitDetected = new vscode.EventEmitter<string>();
    public readonly onCommitDetected = this._onCommitDetected.event;
    private isWatching = false;

    constructor(private context: vscode.ExtensionContext) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            this.git = simpleGit();
        } else {
            this.git = simpleGit(workspaceFolders[0].uri.fsPath);
        }

        this.startWatching();
    }
    
    async startWatching() {
        if (this.isWatching) return;
        this.isWatching = true;
        
        try {
            const log = await this.git.log({ maxCount: 1 });
            this.lastHash = log.latest?.hash || '';
        } catch (e: any) {
            if (e.message && e.message.includes('does not have any commits yet')) {
                console.log('CommitRoulette: Repository is empty. Waiting for first commit.');
                this.lastHash = '';
            } else {
                console.log('CommitRoulette: Not a git repo or error getting log', e);
            }
        }

        let debounceTimer: NodeJS.Timeout;

        const check = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.checkForCommit();
            }, 5000);
        };

        this.context.subscriptions.push(
            vscode.workspace.onDidSaveTextDocument(() => check()),
            vscode.workspace.onDidCreateFiles(() => check()),
            vscode.workspace.onDidDeleteFiles(() => check())
        );

        setInterval(() => this.checkForCommit(), 10000);
    }
    
    async checkForCommit(): Promise<boolean> {

        try {
            const log = await this.git.log({ maxCount: 1 });
            const currentHash = log.latest?.hash;

            if (currentHash && currentHash !== this.lastHash) {

                const previousHash = this.lastHash;
                this.lastHash = currentHash;

                console.log('CommitRoulette: Commit detected!', currentHash);
                this._onCommitDetected.fire(currentHash);
                // this._onCommitDetected.fire();
                return true;
            
            }
        } catch (e) {
            console.log('CommitRoulette: Error checking for commit', e);
        }
        return false;
    }
}