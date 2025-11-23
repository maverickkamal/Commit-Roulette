import * as vscode from 'vscode';
import { HistoryStore } from '../storage/history';

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
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
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

        return this.getWebviewContent(stats, history.slice().reverse());
    }

    private getWebviewContent(stats: any, history: any[]) {
        const curseTypes = [
            'Variable Reverser', 'Emoji Injector', 'Comic Sans Theme',
            'Sound Effect', 'Color Inverter', 'Keyboard Lagger',
            'Indent Switcher', 'Placebo Curse'
        ];

        const config = vscode.workspace.getConfiguration('commitRoulette');
        const enabledCurses = config.get<string[]>('enabledCurses') || [];

        const curseToggles = curseTypes.map(curse => {
            const isChecked = enabledCurses.includes(curse) ? 'checked' : '';
            return `
                <div class="curse-toggle">
                    <input type="checkbox" id="${curse}" ${isChecked} onchange="toggleCurse('${curse}')">
                    <label for="${curse}">${curse}</label>
                </div>
            `;
        }).join('');

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Commit Roulette Stats</title>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                body { font-family: var(--vscode-font-family); padding: 20px; color: var(--vscode-editor-foreground); }
                h1 { text-align: center; }
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .stat-card { background: var(--vscode-editor-background); border: 1px solid var(--vscode-widget-border); padding: 15px; border-radius: 5px; text-align: center; }
                .stat-value { font-size: 2em; font-weight: bold; color: var(--vscode-textLink-foreground); }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { text-align: left; padding: 8px; border-bottom: 1px solid var(--vscode-widget-border); }
                th { background-color: var(--vscode-editor-inactiveSelectionBackground); }
                .chart-container { position: relative; height: 300px; width: 100%; margin-bottom: 30px; }
                
                .settings-section { margin-top: 40px; border-top: 1px solid var(--vscode-widget-border); padding-top: 20px; }
                .curse-toggles { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin-top: 15px; }
                .curse-toggle { display: flex; align-items: center; gap: 10px; }
                .btn { display: inline-block; padding: 8px 16px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); text-decoration: none; border-radius: 2px; cursor: pointer; border: none; }
                .btn:hover { background: var(--vscode-button-hoverBackground); }
            </style>
        </head>
        <body>
            <h1>🎲 Commit Roulette Stats</h1>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${stats.totalCurses}</div>
                    <div>Total Curses</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.activeStreak || 0}</div>
                    <div>Current Streak</div>
                </div>
            </div>

            <div class="chart-container">
                <canvas id="curseChart"></canvas>
            </div>

            <div class="settings-section">
                <h2>Settings</h2>
                <button class="btn" onclick="openSettings()">⚙️ Open Extension Settings</button>

                <div style="margin-top: 20px;">
                    <h3>Curse Duration</h3>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <input type="range" id="curseDuration" min="1" max="60" value="${vscode.workspace.getConfiguration('commitRoulette').get('curseDuration') || 5}" onchange="updateDuration()" oninput="document.getElementById('durationValue').innerText = this.value + ' min'">
                        <span id="durationValue">${vscode.workspace.getConfiguration('commitRoulette').get('curseDuration') || 5} min</span>
                    </div>
                </div
                
                <h3>Enabled Curses</h3>
                <div class="curse-toggles">
                    ${curseToggles}
                </div>
            </div>

            <h2>Recent History</h2>
            <table>
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Curse</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${history.map(h => `
                        <tr>
                            <td>${new Date(h.timestamp).toLocaleString()}</td>
                            <td>${h.curseType}</td>
                            <td>${h.wasUndone ? 'Undone' : 'Applied'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <script>
                const vscode = acquireVsCodeApi();
                
                // Chart
                const ctx = document.getElementById('curseChart').getContext('2d');
                new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ${JSON.stringify(Object.keys(stats.curseBreakdown))},
                        datasets: [{
                            data: ${JSON.stringify(Object.values(stats.curseBreakdown))},
                            backgroundColor: [
                                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#7BC225'
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'right', labels: { color: '#ccc' } }
                        }
                    }
                });

                function openSettings() {
                    vscode.postMessage({ command: 'openSettings' });
                }

                function toggleCurse(curseName) {
                    const isChecked = document.getElementById(curseName).checked;
                    vscode.postMessage({ 
                        command: 'toggleCurse', 
                        curse: curseName, 
                        enabled: isChecked 
                    });
                }

                function updateDuration(){
                    const duration = parseInt(document.getElementById('curseDuration').value);
                    document.getElementById('durationValue').innerText = duration + ' min';
                    vscode.postMessage({ command: 'updateDuration', duration: duration });
                }
            </script>
        </body>
        </html>`;
    }
}
