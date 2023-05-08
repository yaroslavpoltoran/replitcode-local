import * as vscode from 'vscode';
import axios from 'axios';

let typingTimer: NodeJS.Timeout | null = null;
let typingDelay: number = vscode.workspace.getConfiguration().get('replitcode-local.typingDelay') || 1000;
let flaskUrl: string = vscode.workspace.getConfiguration().get('replitcode-local.flaskUrl') || 'http://localhost:5000/predict';
let codeLines: number = (vscode.workspace.getConfiguration().get<number>('replitcode-local.codeLines') || 3) - 1;

async function getCodeFromFlask(code: string): Promise<string> {
  try {
    const response = await axios.post(flaskUrl, { "input_data": code });
    console.log('Done request, answer:', response.data.generated_code);
    return response.data.generated_code;
  } catch (error) {
    console.error('Error fetching code from Flask:', error);
    return '';
  }
}

export function activate(context: vscode.ExtensionContext) {
  // Register a configuration change listener
  vscode.workspace.onDidChangeConfiguration(handleConfigurationChange);

  console.log('Done activate');

  const provider: vscode.CompletionItemProvider = {
    // @ts-ignore
    provideInlineCompletionItems: async (document, position, context, token) => {
      const startLine = Math.max(position.line - codeLines, 0);
      const textBeforeCursor = document.getText(
        new vscode.Range(position.with(startLine, 0), position)
      );
      console.log('textBeforeCursor', textBeforeCursor);

      let items: vscode.CompletionItem[] = [];

      if (textBeforeCursor) {
        if (typingTimer) {
          clearTimeout(typingTimer);
        }

        return new Promise((resolve) => {
          typingTimer = setTimeout(async () => {
            try {
              const genCode = await getCodeFromFlask(textBeforeCursor);
              console.log('genCode', genCode);
              if (genCode) {
                const completionItem = new vscode.CompletionItem(genCode);
                completionItem.range = new vscode.Range(position.translate(0, genCode.length), position);
                completionItem.insertText = genCode;
                items.push(completionItem);
              }
            } catch (err: any) {
              vscode.window.showErrorMessage(err.toString());
            }

            resolve({ items });
          }, typingDelay);
        });
      }

      return { items };
    },
  };
  // @ts-ignore
  vscode.languages.registerInlineCompletionItemProvider({ pattern: '**' }, provider);
}

function handleConfigurationChange(event: vscode.ConfigurationChangeEvent) {
  if (event.affectsConfiguration('replitcode-local.typingDelay')) {
    typingDelay = vscode.workspace.getConfiguration().get('replitcode-local.typingDelay') || 1000;
  }

  if (event.affectsConfiguration('replitcode-local.flaskUrl')) {
    flaskUrl = vscode.workspace.getConfiguration().get('replitcode-local.flaskUrl') || 'http://localhost:5000/predict';
  }

  if (event.affectsConfiguration('replitcode-local.codeLines')) {
    const newcodeLines = vscode.workspace.getConfiguration().get('replitcode-local.codeLines') as number;
    codeLines =  (newcodeLines || 1000) - 1;
  }
}

export function deactivate() {
  // Clean up resources if needed
}
