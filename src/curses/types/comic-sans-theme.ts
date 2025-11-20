import * as vscode from 'vscode';
import { Curse } from '../curse.interface';
import exp = require('constants');

export class ComicSansTheme implements Curse {
    name = "Comic Sans Theme";
    description = "Changes the font to Comic Sans";

    canApply(): boolean {
        return true;
    }

    async apply(): Promise<void> {
        const config = vscode.workspace.getConfiguration('editor');
        const originalFont = config.get<string>('fontFamily');

        await config.update('fontFamily', "'Comic Sans MS', 'Chalkboard SE', 'Comic Nueue', sans-serif", vscode.ConfigurationTarget.Global)
        setTimeout(async () => {
            await config.update('fontFamily', originalFont, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage('Commit Roulette: Comic Sans curse lifted');
        }, 10 * 60 * 1000);
    }
}