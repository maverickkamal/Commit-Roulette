import * as vscode from 'vscode';
import { Curse } from '../curse.interface';

export class ColorInverter implements Curse {
    name = "Color Inverter";
    description = "Inverts theme colors (switches to high contrast or light/dark opposite)";

    canApply(): boolean {
        return true;
    }

    async apply(): Promise<void> {
        const config = vscode.workspace.getConfiguration('workbench');
        const currentTheme = config.get<string>('colorTheme');

        let newTheme = 'Default Light+';
        if (currentTheme && (currentTheme.includes('Light') || currentTheme.includes('white'))) {
            newTheme = 'Default Dark+';
        } else {
            newTheme = 'Default Light+';
        }

        await config.update('colorTheme', newTheme, vscode.ConfigurationTarget.Global);

        setTimeout(async () => {
            await config.update('colorTheme', currentTheme, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage('Commit Roulette: Color Inverter curse lifted!');
        }, 5 * 60 * 1000);
    }
}