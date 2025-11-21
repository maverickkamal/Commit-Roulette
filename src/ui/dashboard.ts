import * as vscode from 'vscode';
import { HistoryStore } from '../storage/history';

export class DashboardPanel {
    public static currentPanel: DashboardPanel | undefined;
    private readonly panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, private extensionUri: vscode.Uri, private historyStore: HistoryStore) {
        this.panel = panel;
        this.panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._update();
    }

    public static createOrShow(extensionUri: vscode.Uri, historyStore: HistoryStore) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (DashboardPanel.currentPanel) {
            DashboardPanel.currentPanel.panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'commitRouletteStats',
            'Commit Roulette Statistics',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
            }
        );

        DashboardPanel.currentPanel = new DashboardPanel(panel, extensionUri, historyStore);
    
    }

    public dispose() {
        DashboardPanel.currentPanel = undefined;
        this.panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private async _update() {
        const webview = this.panel.webview;
        this.panel.webview.html = await this._getHtmlForWebview(webview);
    }

    private async _getHtmlForWebview(webview: vscode.Webview) {
        const history = await this.historyStore.getHistory();

        const totalCurses = history.length;
        const curseCounts: { [key: string]: number } = {};
        history.forEach(h => {
            curseCounts[h.curseType] = (curseCounts[h.curseType] || 0) + 1;
        });

        const labels = Object.keys(curseCounts);
        const data = Object.values(curseCounts);

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Commit Roulette Stats</title>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                body { font-family: var(--vscode-font-family); padding: 20px; color: var(--vscode-editor-foreground); }
                h1 { color: var(--vscode-editor-foreground); }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { text-align: left; padding: 8px; border-bottom: 1px solid var(--vscode-panel-border); }
                .chart-container { width: 400px; height: 400px; margin: 0 auto; }
            </style>
        </head>
        <body>
            <h1>Commit Roulette Statistics</h1>
            <p>Total Curses Triggered: ${totalCurses}</p>
            
            <div class="chart-container">
                <canvas id="curseChart"></canvas>
            </div>

            <h2>History</h2>
            <table>
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Curse</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${history.slice().reverse().map(h => `
                        <tr>
                            <td>${new Date(h.timestamp).toLocaleString()}</td>
                            <td>${h.curseType}</td>
                            <td>${h.wasUndone ? 'Undone' : 'Applied'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <script>
                const ctx = document.getElementById('curseChart');
                new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: ${JSON.stringify(labels)},
                        datasets: [{
                            label: '# of Curses',
                            data: ${JSON.stringify(data)},
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: { color: '#ccc' }
                            }
                        }
                    }
                });
            </script>
        </body>
        </html>`;
                    
    }
}