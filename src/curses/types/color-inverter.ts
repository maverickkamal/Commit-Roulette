import * as vscode from 'vscode';
import { Curse } from '../curse.interface';

export class ColorInverter implements Curse {
    name = "Color Inverter";
    description = "Inverts theme colors (switches to high contrast or light/dark opposite)";

    canApply(): boolean {
        return true;
    }

    private originalTheme: string | undefined;
    private timeout: NodeJS.Timeout | undefined;

    async apply(): Promise<void> {
        const config = vscode.workspace.getConfiguration('workbench');
        if (this.originalTheme === undefined) {
            this.originalTheme = config.get<string>('colorTheme');
        }

        const currentTheme = config.get<string>('colorTheme');

        let newTheme = 'Default Light+';
        if (currentTheme && (currentTheme.includes('Light') || currentTheme.includes('white'))) {
            newTheme = 'Default Dark+';
        } else {
            newTheme = 'Default Light+';
        }

        await config.update('colorTheme', newTheme, vscode.ConfigurationTarget.Global);

        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        this.timeout = setTimeout(async () => {
            await this.undo();
            vscode.window.showInformationMessage('Commit Roulette: Color Inverter curse lifted!');
        }, 5 * 60 * 1000);
    }

    async undo(): Promise<void> {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = undefined;
        }
        if (this.originalTheme !== undefined) {
            const config = vscode.workspace.getConfiguration('workbench');
            await config.update('colorTheme', this.originalTheme, vscode.ConfigurationTarget.Global);

            this.originalTheme = undefined;
        }
    }
}