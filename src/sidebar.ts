import * as vscode from "vscode";

export class ArcadeViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private context?: vscode.WebviewViewResolveContext<unknown>;

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext<unknown>,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
    this.view = webviewView;
    this.context = context;

    webviewView.webview.options = {
      enableScripts: true,
      enableCommandUris: true,
    };

    webviewView.webview.html = `
    <!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
			</head>
			<body>
        <h1>Hello, Webview!</h1>
			</body>
			</html>
      `;
  }
}
