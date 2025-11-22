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

        const soundUrl = 'https://www.actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg';

        panel.webview.html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta http-equiv="Content-Security-Policy" content="default-src *; media-src *;">
            </head>
            <body>
                <p>Playing sound...</p>
                <audio autoplay src="${soundUrl}" onended="end()" onerror="err()"></audio>
                <script>
                    const vscode = acquireVsCodeApi();
                    function end() {
                        vscode.postMessage({ command: 'finished' });
                    }
                    function err() {
                        console.error('Audio failed to load');
                        vscode.postMessage({ command: 'finished' });
                    }
                    setTimeout(end, 3000);
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