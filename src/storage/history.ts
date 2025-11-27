import * as vscode from 'vscode';

export interface CurseHistoryEntry {
    timestamp: number;
    curseType: string;
    backupId: string;
    wasUndone: boolean;
}

export class HistoryStore {
    constructor(private context: vscode.ExtensionContext) { }

    async addEntry(entry: CurseHistoryEntry): Promise<void> {
        const history = this.context.globalState.get<CurseHistoryEntry[]>('history', []);
        history.push(entry);
        if (history.length > 100) history.shift();
        await this.context.globalState.update('history', history);
    }

    async getHistory(): Promise<CurseHistoryEntry[]> {
        return this.context.globalState.get<CurseHistoryEntry[]>('history', []);
    }

    async getLastEntry(): Promise<CurseHistoryEntry | undefined> {
        const history = await this.getHistory();
        return history.length > 0 ? history[history.length - 1] : undefined;
    }
}