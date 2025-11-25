const vscode = acquireVsCodeApi();

const { stats, history, config } = window.initialData;

const ctx = document.getElementById('curseChart').getContext('2d');
new Chart(ctx, {
    type: 'doughnut',
    data: {
        labels: Object.keys(stats.curseBreakdown),
        datasets: [{
            data: Object.values(stats.curseBreakdown),
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

const curseTypes = [
    'Variable Reverser', 'Emoji Injector', 'Comic Sans Theme',
    'Sound Effect', 'Color Inverter', 'Keyboard Lagger',
    'Indent Switcher', 'Placebo Curse', 'The Jitterbug', 'Australian Mode'
];

const togglesContainer = document.getElementById('curse-toggles');
const enabledCurses = config.enabledCurses || [];

curseTypes.forEach(curse => {
    const isCHecked = enabledCurses.includes(curse) ? 'checked': '';
    const div = document.createElement('div');
    div.className = 'curse-toggle';
    div.innerHTML = `
        <input type="checkbox" id="${curse}" ${isCHecked}>
        <label for="${curse}">${curse}</label>
    `;
    togglesContainer.appendChild(div);

    div.querySelector('input').addEventListener('change', (e) => {
        toggleCurse(curse, e.target.checked);
    });
});


function toggleCurse(curseName, enabled) {
    vscode.postMessage({
        command: 'toggleCurse',
        curse: curseName,
        enabled: enabled
    });
}

const durationInput = document.getElementById('curseDuration');
const durationValue = document.getElementById('durationValue');

durationInput.addEventListener('input', (e) => {
    durationValue.innerText = e.target.value;
});

durationInput.addEventListener('change', (e) => {
    updateDuration(parseInt(e.target.value));
});

function updateDuration(duration) {
    vscode.postMessage({
        command: 'updateDuration',
        duration: duration
    });
}

const historyTableBody = document.querySelector('#history-table tbody');
history.forEach(h => {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${new Date(h.timestamp).toLocaleString()}</td>
        <td>${h.curseType}</td>
        <td>${h.wasUndone ? 'Undone' : 'Applied'}</td>
    `;
    historyTableBody.appendChild(row);
});

function openSettings() {
    vscode.postMessage({ command: 'openSettings' });
}
