// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import axios from 'axios';
import * as net from 'net';

async function getAvailablePort(startingPort: number): Promise<number> {
    let port = startingPort;

    while (true) {
        if (await isPortAvailable(port)) {
            return port;
        }
        port += 1; // Increment port if it's in use
    }
}

function isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const server = net.createServer();

        server.once('error', () => resolve(false)); // Port is in use
        server.once('listening', () => {
            server.close(() => resolve(true)); // Port is available
        });

        server.listen(port, '127.0.0.1');
    });
}

interface Todo {
    prio: number;
    relativePath: string,
    filePath: string;
    index: number;
    content: string;
}

let serverProcess: cp.ChildProcess | null = null;
function installRequirements(callback: () => void, extensionPath: string) {
    const serverPath = path.join(extensionPath, 'server', 'backend.py');
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    
    if (workspaceFolder) {
        const relativePath = path.relative(workspaceFolder, serverPath);
        console.log(relativePath);  // Output: "server/backend.py"
    }

    const pythonPath = 'python'; // Ensure this points to the correct Python interpreter
    const requirementsPath = path.join(extensionPath, 'server', 'requirements.txt');
    // Spawn a process to install requirements.txt
    const installProcess = cp.spawn(pythonPath, ['-m', 'pip', 'install', '-r', requirementsPath], {
        shell: true,
    });

    installProcess.stdout?.on('data', (data) => {
        console.log(`Install output: ${data.toString()}`);
    });

    installProcess.stderr?.on('data', (data) => {
        console.error(`Install error: ${data.toString()}`);
    });

    installProcess.on('close', (code) => {
        if (code === 0) {
            console.log("Packages installed successfully.");
            callback();
        } else {
            console.error("Failed to install packages. Exited with code:", code);
        }
    });
}

function startServer(port: string, extensionPath : string) {
    console.log(`Starting server on port ${port}`);

    // Ensure dependencies are installed first
    installRequirements(() => {
        const serverPath = path.join(extensionPath, 'server');
    
        // Start the uvicorn server after successful installation
        serverProcess = cp.spawn('uvicorn', ['backend:app', '--host', '127.0.0.1', '--port', port.toString()], {
            cwd: serverPath,
            shell: true,
        });

        serverProcess.stdout?.on('data', (data) => {
            console.log(`Server output: ${data.toString()}`);
        });

        serverProcess.stderr?.on('data', (data) => {
            console.error(`Server error: ${data.toString()}`);
        });

        serverProcess.on('close', (code) => {
            console.log(`Server process exited with code ${code}`);
        });

        console.log("Server started successfully.");
    }, extensionPath);
}
function stopServer() {
    if (serverProcess) {
        serverProcess.kill();
        serverProcess = null;
        console.log("Server stopped.");
    }
}

async function getPriorityFromServer(todoText: string, port: string): Promise<number> {
    try {
        todoText = todoText.replace(/[:()]/g, '');
        const response = await axios.post(`http://127.0.0.1:${port}/predict`, null, {
            params: {
                todo_text: todoText
            }
        });
        
        return response.data.priority;
    } catch (error) {
        console.error("Error fetching priority from server:", error);
        return 4; // Default priority if the server request fails
    }
}

async function walkDirectorySync(rootDirPath: any, dirPath : any, fileProcessingCallback : any, todos : any, port: string) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const fileProcessingPromises: Promise<void>[] = [];

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            await walkDirectorySync(rootDirPath, fullPath, fileProcessingCallback, todos, port);
        } else {
            fileProcessingPromises.push(fileProcessingCallback(rootDirPath, fullPath, todos, port));
        }
    }

    await Promise.all(fileProcessingPromises);
}

async function processFileSync(rootDirPath : any, filePath : any, todos : any, port: string) {
    const data = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(rootDirPath, filePath);
    const lines = data.split('\n');
    const processingPromises = lines.map(async (line, index) => {
        const commentIndex = line.indexOf('//');
        const todoIndex = line.indexOf('TODO', commentIndex);
        if (commentIndex === -1 || todoIndex === -1 || todoIndex < commentIndex) {
            return; // Skip lines without TODOs
        }

        const afterTodo = line.substring(todoIndex + 4);
        let priority = 4;

        if (afterTodo.startsWith("-HIGH")) {
            priority = 1;
        } else if (afterTodo.startsWith("-MEDIUM")) {
            priority = 2;
        } else if (afterTodo.startsWith("-LOW")) {
            priority = 3;
        } else {
            priority = await getPriorityFromServer(afterTodo, port); // Await async priority fetching
        }

        const content = afterTodo.split(' ').slice(1).join(' ');
        todos.push({ prio: priority, filePath, relativePath, index, content });
    });
    await Promise.all(processingPromises);
}


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
    const port = await getAvailablePort(8000); // Find an available port starting from 8000
    
    startServer(port.toString(), context.extensionPath);
	
	let disposable = vscode.commands.registerCommand('todo-codetracker.findTodos', async () => {
		const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No open text editor');
            return;
        }

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showInformationMessage('No workspace is opened');
            return;
        }

		const todos: Todo[] = [];

        for (const folder of workspaceFolders) {
            await walkDirectorySync(folder.uri.fsPath, folder.uri.fsPath, processFileSync, todos, port.toString());
        }

        const sortedTodos = todos.sort((a, b) => a.prio - b.prio);
        const mappedStrings = sortedTodos.map(todo => {
            const { prio, relativePath, filePath, index, content } = todo;
            let label;
            switch (prio) {
                case 1:
                    label = "🔴";
                    break;
                case 2:
                    label = "🔶";
                    break;
                case 3:
                    label = "🟢";
                    break;
                default:
                    label = "❓";
            }
            
            return { label: label, description: `${relativePath}:${index + 1}: ${content}`, detail: filePath, lineNumber: index+1};
        });

		vscode.window.showQuickPick(mappedStrings, {
            placeHolder: 'Select a TODO to navigate to',
        }).then((selection : any ) => {
            if (!selection) return;
        
            if (selection.detail) {
                const uri = vscode.Uri.file(selection.detail); 
                vscode.workspace.openTextDocument(uri) 
                    .then(document => {
                        vscode.window.showTextDocument(document, {
                            preview: false,
                            selection: new vscode.Range(selection.lineNumber, 0, selection.lineNumber, 0)
                        }).then(editor => {

                            const position = new vscode.Position(selection.lineNumber - 1, 0);
                            editor.selection = new vscode.Selection(position, position);
                            editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
                        });
                    });
            }
        });
	});
    const languages = ['javascript', 'typescript'];

    languages.forEach(language => {
        const provider = vscode.languages.registerCompletionItemProvider(language, {
            provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('TODO ')) {
                    return undefined;
                }

                const replaceRange = new vscode.Range(
                    position.translate(0, -1), 
                    position 
                );

                const priorities = ['HIGH', 'MED', 'LOW'];
                return priorities.map(p => {
                    const completion = new vscode.CompletionItem(`TODO-${p}:`, vscode.CompletionItemKind.Snippet);
                    completion.insertText = `-${p}: `;
                    completion.range = replaceRange;
                    completion.documentation = new vscode.MarkdownString(`Mark the TODO as ${p} priority`);
                    return completion;
                });
            }
        }, ' ');
        context.subscriptions.push(provider);
    });
	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
    stopServer();
}
