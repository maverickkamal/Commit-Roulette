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
            'Indent Switcher', 'Placebo Curse', 'The Jitterbug',
            'Australian Mode'
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
            <title>Commit Roulette Dashboard</title>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                :root {
                    --neon-red: #ff003c;
                    --neon-blue: #00f3ff;
                    --neon-green: #00ff41;
                    --bg-dark: #0a0a0a;
                    --card-bg: #1a1a1a;
                }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    padding: 20px;
                    background-color: var(--bg-dark);
                    color: #fff;
                    text-align: center;
                }
                h1 {
                    font-size: 3em;
                    text-shadow: 0 0 10px var(--neon-red), 0 0 20px var(--neon-red);
                    margin-bottom: 30px;
                    animation: flicker 2s infinite alternate;
                }
                .stats-container {
                    display: flex;
                    justify-content: space-around;
                    margin-bottom: 40px;
                    flex-wrap: wrap;
                }
                .stat-card {
                    background-color: var(--card-bg);
                    border: 1px solid var(--neon-blue);
                    border-radius: 10px;
                    padding: 20px;
                    width: 200px;
                    box-shadow: 0 0 15px rgba(0, 243, 255, 0.2);
                    transition: transform 0.3s;
                    margin: 10px;
                }
                .stat-card:hover {
                    transform: scale(1.05);
                    box-shadow: 0 0 25px rgba(0, 243, 255, 0.4);
                }
                .stat-value {
                    font-size: 2.5em;
                    font-weight: bold;
                    color: var(--neon-green);
                    text-shadow: 0 0 5px var(--neon-green);
                }
                .stat-label {
                    font-size: 1em;
                    color: #aaa;
                }
                .chart-container {
                    background-color: var(--card-bg);
                    padding: 20px;
                    border-radius: 10px;
                    margin-bottom: 40px;
                    border: 1px solid #333;
                }
                .settings-container {
                    background-color: var(--card-bg);
                    padding: 20px;
                    border-radius: 10px;
                    border: 1px solid var(--neon-red);
                    text-align: left;
                }
                .curse-toggles {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 10px;
                    margin-top: 15px;
                }
                .curse-toggle {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .curse-toggle input[type="checkbox"] {
                    transform: scale(1.2);
                    accent-color: var(--neon-red);
                }
                .slider-container {
                    margin-top: 20px;
                    padding: 10px;
                    border-top: 1px solid #333;
                }
                input[type="range"] {
                    width: 100%;
                    accent-color: var(--neon-red);
                }
                @keyframes flicker {
                    0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
                        text-shadow: 0 0 10px var(--neon-red), 0 0 20px var(--neon-red);
                    }
                    20%, 24%, 55% {
                        text-shadow: none;
                    }
                }
            </style>
        </head>
        <body>
            <h1>🎰 Commit Roulette 🎰</h1>
            
            <div class="stats-container">
                <div class="stat-card">
                    <div class="stat-value">${stats.totalCurses}</div>
                    <div class="stat-label">Total Curses</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.activeStreak}</div>
                    <div class="stat-label">Current Streak</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${(stats.probability * 100).toFixed(1)}%</div>
                    <div class="stat-label">Current Probability</div>
                </div>
            </div>

            <div class="chart-container">
                <canvas id="curseChart"></canvas>
            </div>

            <div class="settings-container">
                <h2 style="color: var(--neon-red); text-shadow: 0 0 5px var(--neon-red);">⚙️ Active Curses</h2>
                <div class="curse-toggles">
                    ${curseToggles}
                </div>
                
                <div class="slider-container">
                    <label for="curseDuration">⏱️ Curse Duration (minutes): <span id="durationValue">${vscode.workspace.getConfiguration('commitRoulette').get('curseDuration') || 5}</span></label>
                    <input type="range" id="curseDuration" min="1" max="60" value="${vscode.workspace.getConfiguration('commitRoulette').get('curseDuration') || 5}" onchange="updateDuration()" oninput="document.getElementById('durationValue').innerText = this.value">
                </div>
            </div>

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
                                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#7BC225', '#FF003C', '#00F3FF'
                            ],
                            borderColor: '#1a1a1a',
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'right', labels: { color: '#fff', font: { size: 14 } } }
                        }
                    }
                });

                function toggleCurse(curseName) {
                    const isChecked = document.getElementById(curseName).checked;
                    vscode.postMessage({ 
                        command: 'toggleCurse', 
                        curse: curseName, 
                        enabled: isChecked 
                    });
                }

                function updateDuration() {
                    const duration = parseInt(document.getElementById('curseDuration').value);
                    document.getElementById('durationValue').innerText = duration;
                    vscode.postMessage({ 
                        command: 'updateDuration', 
                        duration: duration 
                    });
                }
            </script>
        </body>
        </html>`;
    }
}
