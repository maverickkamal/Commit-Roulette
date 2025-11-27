import * as vscode from 'vscode';
import { HistoryStore } from '../storage/history';
import { TextDecoder } from 'util';

export class DashboardPanel {
    public static currentPanel: DashboardPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, private extensionUri: vscode.Uri, private historyStore: HistoryStore) {
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'openSettings':
                        vscode.commands.executeCommand('workbench.action.openSettings', 'commitRoulette');
                        return;
                    case 'toggleCurse':
                        const config = vscode.workspace.getConfiguration('commitRoulette');
                        let enabledCurses = config.get<string[]>('enabledCurses') || [];

                        if (message.enabled) {
                            if (!enabledCurses.includes(message.curse)) {
                                enabledCurses.push(message.curse);
                            }
                        } else {
                            enabledCurses = enabledCurses.filter(c => c !== message.curse);
                        }

                        await config.update('enabledCurses', enabledCurses, vscode.ConfigurationTarget.Global);
                        return;
                    case 'updateDuration':
                        const configDuration = vscode.workspace.getConfiguration('commitRoulette');
                        await configDuration.update('curseDuration', message.duration, vscode.ConfigurationTarget.Global);
                        return;
                }
            },
            null,
            this._disposables
        );

        this._update();
    }

    public static createOrShow(extensionUri: vscode.Uri, historyStore: HistoryStore) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (DashboardPanel.currentPanel) {
            DashboardPanel.currentPanel._panel.reveal(column);
            DashboardPanel.currentPanel._update();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'commitRouletteStats',
            'Commit Roulette Statistics',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'src', 'media')]
            }
        );

        DashboardPanel.currentPanel = new DashboardPanel(panel, extensionUri, historyStore);
    }

    public dispose() {
        DashboardPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private async _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = await this._getHtmlForWebview(webview);
    }

    private async _getHtmlForWebview(webview: vscode.Webview) {
        const history = await this.historyStore.getHistory();

        const totalCurses = history.length;
        const curseCounts: { [key: string]: number } = {};
        history.forEach(h => {
            curseCounts[h.curseType] = (curseCounts[h.curseType] || 0) + 1;
        });

        let activeStreak = 0;
        if (history.length > 0) {
            const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);
            let lastAppliedTime = 0;
            for (const entry of sortedHistory) {
                if (!entry.wasUndone) {
                    lastAppliedTime = entry.timestamp;
                    break;
                }
            }

            if (lastAppliedTime > 0) {
                const oneDay = 24 * 60 * 60 * 1000; 
                let currentStreak = 0;
                let previousDay = Math.floor(lastAppliedTime / oneDay);

                for (const entry of sortedHistory) {
                    if (!entry.wasUndone) {
                        const entryDay = Math.floor(entry.timestamp / oneDay);
                        if (entryDay === previousDay) {
                            // Same day, continue tracking
                        } else if (entryDay === previousDay - 1) {
                            currentStreak++;
                            previousDay = entryDay;
                        } else if (entryDay < previousDay - 1) {
                            break;
                        }
                    }
                }
                activeStreak = currentStreak + 1; 
            }
        }

        const stats = {
            totalCurses,
            curseBreakdown: curseCounts,
            activeStreak
        };

        return this.getWebviewContent(webview, stats, history.slice().reverse());
    }

    private async getWebviewContent(webview: vscode.Webview, stats: any, history: any[]) {
        const mediaPath = vscode.Uri.joinPath(this.extensionUri, 'src', 'media');
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'dashboard.css'));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'dashboard.js'));
        const htmlUri = vscode.Uri.joinPath(mediaPath, 'dashboard.html');

        let htmlContent = '';
        try {
            const uint8Array = await vscode.workspace.fs.readFile(htmlUri);
            htmlContent = new TextDecoder().decode(uint8Array);
        } catch (error) {
            console.error('Error reading dashboard.html:', error);
            return `<h1>Error loading dashboard</h1><p>${error}</p>`;
        }

        const config = vscode.workspace.getConfiguration('commitRoulette');
        const curseDuration = config.get('curseDuration') || 5;

        const initialData = {
            stats,
            history,
            config: {
                enabledCurses: config.get<string[]>('enabledCurses') || []
            }
        };

        htmlContent = htmlContent
            .replace(/{{cspSource}}/g, webview.cspSource)
            .replace(/{{styleUri}}/g, styleUri.toString())
            .replace(/{{scriptUri}}/g, scriptUri.toString())
            .replace(/{{totalCurses}}/g, stats.totalCurses.toString())
            .replace(/{{activeStreak}}/g, stats.activeStreak.toString())
            .replace(/{{currentProbability}}/g, (stats.probability * 100).toFixed(1))
            .replace(/{{curseDuration}}/g, curseDuration.toString())
            .replace(/"{{initialData}}"/g, JSON.stringify(initialData));

        return htmlContent;
    }
}
