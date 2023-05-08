import * as vscode from 'vscode';
import axios from 'axios';


async function getCodeFromFlask(code: string): Promise<string> {
    try {
      const response = await axios.post('http://localhost:5000/predict', { "input_data": code });
      console.log('Done reauest, aswer', response.data.generated_code);
      return response.data.generated_code;
    } catch (error) {
      console.error('Error fetching code from Flask:', error);
      return '';
    }
  }


export function activate(_: vscode.ExtensionContext) {

    const provider: vscode.CompletionItemProvider = {
        // @ts-ignore
        provideInlineCompletionItems: async (document, position, context, token) => {
            
            const startLine = Math.max(position.line - 2, 0);
            const textBeforeCursor = document.getText(
                new vscode.Range(position.with(startLine, 0), position)
            );
            console.log('textBeforeCursor', textBeforeCursor);

            let items: any[] = [];

            if (textBeforeCursor) {
                let genCode;
                try {
                    genCode = await getCodeFromFlask(textBeforeCursor);
                    console.log('genCode', genCode);
                    if (genCode) {
                        return [{
                            text: genCode,
                            insertText: genCode,
                            range: new vscode.Range(position.translate(0, genCode.length), position)
                        }];
                    };
                    
                } catch (err: any) {
                    vscode.window.showErrorMessage(err.toString());
                }
            }
            return {items};
        },
    };

    // @ts-ignore
    vscode.languages.registerInlineCompletionItemProvider({ pattern: '**' }, provider);
}