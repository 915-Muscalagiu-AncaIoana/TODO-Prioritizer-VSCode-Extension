// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface Todo {
    prio: number;
    relativePath: string,
    filePath: string;
    index: number;
    content: string;
}

function walkDirectorySync(rootDirPath: any, dirPath : any, fileProcessingCallback : any, todos : any) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    entries.forEach(entry => {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            walkDirectorySync(rootDirPath, fullPath, fileProcessingCallback, todos);
        } else {
            fileProcessingCallback(rootDirPath, fullPath, todos); 
        }
    });
}

function processFileSync(rootDirPath : any, filePath : any, todos : any) {
    const data = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(rootDirPath, filePath);
    const lines = data.split('\n');
    lines.forEach((line, index) => {
        const commentIndex = line.indexOf('//');
        const todoIndex = line.indexOf('TODO', commentIndex);
        if (commentIndex === -1 || todoIndex === -1 || todoIndex < commentIndex) {
          return;
        }
            const afterTodo = line.substring(todoIndex + 4); 
            let priority = 4; 

            if (afterTodo.startsWith("-HIGH")) {
                priority = 1;
            } else if (afterTodo.startsWith("-MEDIUM")) {
                priority = 2;
            } else if (afterTodo.startsWith("-LOW")) {
                priority = 3;
            }
            const content = afterTodo.split(' ').slice(1).join(' ');
            todos.push( {prio : priority, filePath: filePath, relativePath : relativePath, index : index, content: content } );
        }
    );
}


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	
	let disposable = vscode.commands.registerCommand('todo-codetracker.findTodos', () => {
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

        workspaceFolders.forEach(folder => {
            walkDirectorySync(folder.uri.fsPath,folder.uri.fsPath,processFileSync,todos);
        });

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
export function deactivate() {}
