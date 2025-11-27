import * as vscode from 'vscode';
import { Curse } from './curse.interface';
import { BackupManager } from '../git/backup-manager';
import { HistoryStore  } from '../storage/history';
import {
    ColorInverter,
    ComicSansTheme,
    PlaceboCurse,
    VariableReverser,
    IndentSwitcher,
    EmojiInjector,
    SoundEffect,
    KeyboardLagger,
    AustralianMode,
    Jitterbug
} from './types';


export class CurseEngine {
    private curses: Curse[] = [];
    private backupManager: BackupManager;
    private historyStore: HistoryStore;

    constructor(context: vscode.ExtensionContext, backupManager: BackupManager, historyStore: HistoryStore) {
        this.backupManager = backupManager;
        this.historyStore = historyStore;

        this.curses.push(new ColorInverter());
        this.curses.push(new ComicSansTheme());
        this.curses.push(new PlaceboCurse());
        this.curses.push(new VariableReverser());
        this.curses.push(new IndentSwitcher());
        this.curses.push(new EmojiInjector());
        this.curses.push(new SoundEffect());
        this.curses.push(new KeyboardLagger());
        this.curses.push(new AustralianMode());
        this.curses.push(new Jitterbug());
    }

    async executeCurseRoulette(probability: number): Promise<void> {
        const roll = Math.random() * 100;
        if (roll > probability) {
            console.log(`CommitRoulette: Safe! Rolled ${roll} > ${probability}`);
            return;
        }

        if (vscode.debug.activeDebugSession) {
            console.log('CommitRoulette: Debug session active, skipping curse...');
            return;
        }

        let backupId = '';
        try {
            backupId = await this.backupManager.createBackup();
        
        } catch (e) {
            console.error('CommitRoulette: Backup failed, aborting curse...');
            return;
        }

        const curse = this.selectWeightedCurse();
        if (!curse) {

            console.log('CommitRoulette: No applicable curses found...');
            return;
        }

        console.log(`CommitRoulette: Triggering curse: ${curse.name}`);

        try {
            await curse.apply();
        
            this.showCurseNotification(curse, backupId);

            await this.historyStore.addEntry({
                timestamp: Date.now(),
                curseType: curse.name,
                backupId,
                wasUndone: false
            });

        } catch (e) {
            console.error(`CommitRoulette: Curse ${curse.name} failed`, e);
            vscode.window.showErrorMessage(`Commit Roulette: Curse ${curse.name} failed to apply.`);
        }
    }

    private selectWeightedCurse(): Curse | undefined {
        const config = vscode.workspace.getConfiguration('commitRoulette');
        const enabledCurses = config.get<string[]>('enabledCurses') || [];

        const applicableCurses = this.curses.filter(c => 
            c.canApply() && enabledCurses.includes(c.name)
        );
        
        if (applicableCurses.length === 0) return undefined;

        const randomIndex = Math.floor(Math.random() * applicableCurses.length);
        return applicableCurses[randomIndex];
    }

    private async showCurseNotification(curse: Curse, backupId: string): Promise<void> {
        const undo = 'Undo Curse';
        const message = `You've been cursed! (${curse.name})`;

        const selection = await vscode.window.showWarningMessage(message, undo, 'Accept Fate');

        if (selection === undo) {
            await this.undoLastCurse(backupId);
        }
    }

    async undoLastCurse(backupId?: string) {
        const lastEntry = await this.historyStore.getLastEntry();
        if (lastEntry && !lastEntry.wasUndone) {
            const curse = this.curses.find(c => c.name === lastEntry.curseType);
            if (curse && curse.undo) {
                await curse.undo();
                vscode.window.showInformationMessage(`Commit Roulette: ${curse.name} undone!`);
                return;
            }
        }
        if (!backupId) {

            if (lastEntry) backupId = lastEntry.backupId;
        }

        if (backupId) {
            await this.backupManager.restoreBackup(backupId);
            vscode.window.showInformationMessage('Commit Roulette: Curse undone! Phew.');

        } else {
            vscode.window.showErrorMessage('Commit Roulette: No backup found to restore.');
        }
    }

}