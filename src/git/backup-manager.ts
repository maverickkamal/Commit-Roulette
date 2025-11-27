import * as vscode from 'vscode';

export class BackupManager {
    private backupDir: vscode.Uri;

    constructor(context: vscode.ExtensionContext) {
        this.backupDir = vscode.Uri.joinPath(context.globalStorageUri, 'backup');
        vscode.workspace.fs.createDirectory(this.backupDir);
    }

    async createBackup(): Promise<string> {
        const timestamp = Date.now();
        const backupId = timestamp.toString();
        const backupPath = vscode.Uri.joinPath(this.backupDir, backupId);

        await vscode.workspace.fs.createDirectory(backupPath);

        const files = await vscode.workspace.findFiles(
            '**/*',
            '**/node_modules/**,**/.git/**,**/out/**,**/dist/**,**/.vscode-test/**'
        );

        for (const file of files) {
            try {
                const content = await vscode.workspace.fs.readFile(file);
                const workspaceFolder = vscode.workspace.getWorkspaceFolder(file);
                if (!workspaceFolder) continue;

                const relativePath = file.path.substring(workspaceFolder.uri.path.length);
                const destPath = vscode.Uri.joinPath(backupPath, relativePath);

                const destParent = vscode.Uri.joinPath(destPath, '..');
                await vscode.workspace.fs.createDirectory(destParent);

                await vscode.workspace.fs.writeFile(destPath, content);
            } catch (e) {
                console.error(`Failed to backup file: ${file.fsPath}`, e);
            }
        }

        this.pruneBackups();

        return backupId;
    }

    async restoreBackup(backupId: string): Promise<void> {
        const backupPath = vscode.Uri.joinPath(this.backupDir, backupId);
        await this.restoreDirectory(backupPath, backupPath);
    }

    private async restoreDirectory(currentUri: vscode.Uri, rootBackupUri: vscode.Uri): Promise<void> {
        const entries = await vscode.workspace.fs.readDirectory(currentUri);

        for (const [name, type] of entries) {
            const entryUri = vscode.Uri.joinPath(currentUri, name);

            if (type === vscode.FileType.Directory) {
                await this.restoreDirectory(entryUri, rootBackupUri);
            } else {
                const relativePath = entryUri.path.substring(rootBackupUri.path.length);

                if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
                    const destUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, relativePath);

                    const content = await vscode.workspace.fs.readFile(entryUri);
                    await vscode.workspace.fs.writeFile(destUri, content);
                }
            }

        }

    }

    private async pruneBackups() {
        try {
            const entries = await vscode.workspace.fs.readDirectory(this.backupDir);
            entries.sort((a, b) => b[0].localeCompare(a[0]));

            if (entries.length > 3) {
                for (let i = 3; i < entries.length; i++) {
                    const dirToDelete = vscode.Uri.joinPath(this.backupDir, entries[i][0]);
                    await vscode.workspace.fs.delete(dirToDelete, { recursive: true });
                }
            }
        } catch (e) {
            console.error('Failed to prune backups', e);
        }
    }
    
}