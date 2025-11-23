import * as vscode from 'vscode';
import { Curse } from '../curse.interface';
import exp = require('constants');

export class ComicSansTheme implements Curse {
    name = "Comic Sans Theme";
    description = "Changes the font to Comic Sans";

    canApply(): boolean {
        return true;
    }

    private originalFont: string | undefined;
    private timeout: NodeJS.Timeout | undefined;


    async apply(): Promise<void> {
        const config = vscode.workspace.getConfiguration('editor');
        this.originalFont = config.get<string>('fontFamily');

        await config.update('fontFamily', "'Comic Sans MS', 'Chalkboard SE', 'Comic Nueue', sans-serif", vscode.ConfigurationTarget.Global)

        const durationMinutes = vscode.workspace.getConfiguration('commitRoulette').get<number>('curseDuration') || 5;
        this.timeout = setTimeout(async () => {
            vscode.window.showInformationMessage('Commit Roulette: Comic Sans curse lifted');
        }, durationMinutes * 60 * 1000);
    }

    async undo(): Promise<void> {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = undefined;
        }
        if (this.originalFont !== undefined) {
            const config = vscode.workspace.getConfiguration('editor');
            await config.update('fontFamily', this.originalFont, vscode.ConfigurationTarget.Global);
        }
    }
}