import * as vscode from 'vscode';
import { Curse } from '../curse.interface';

export class SoundEffect implements Curse {
    name = "Sound Effect";
    description = "Plays a random sound effect";

    canApply(): boolean {
        return true;
    }

    async apply(): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'commitRouletteSound',
            'Commit Roulette Sound',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        const soundUrl = 'https://www.myinstants.com/media/sounds/airhorn.mp3';

        panel.webview.html = `
            <!DOCTYPE html>
            <html>
            <body>
                <audio autoplay src="${soundUrl}" onended="end()"></audio>
                <script>
                    const vscode = acquireVsCodeApi();
                    function end() {
                        setTimeout(() => {
                            vscode.postMessage({ command: 'finished' });
                        }, 1000);
                    }
                </script>
            </body>
            </html>
        `;

        panel.webview.onDidReceiveMessage(message => {
            if (message.command === 'finished') {
                panel.dispose();
            }
        });

        setTimeout(() => panel.dispose(), 5000);
    }
}