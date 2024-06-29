import * as vscode from "vscode";

let hasSession = false;
let isPaused = false;
let remainingSeconds = 0;
let goal = "";

let view: vscode.WebviewView | undefined;
let extensionUri: vscode.Uri | undefined;

export class ArcadeViewProvider implements vscode.WebviewViewProvider {
  constructor(extensionU: vscode.Uri) {
    extensionUri = extensionU;
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext<unknown>,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
    view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      enableCommandUris: true,
      localResourceRoots: [vscode.Uri.joinPath(extensionUri!, "dist")],
    };

    webviewView.webview.html = htmlTemplate("<p>Loading...</p>");
  }
}

export function updateSessionStatus(hasS: boolean, isP: boolean): void {
  hasSession = hasS;
  isPaused = isP;
}

export function updateSessionInfo(seconds: number, g: string): void {
  remainingSeconds = seconds;
  goal = g;
}

function getHtmlContent(): string {
  console.log(`${hasSession} ${isPaused}`);
  if (!hasSession) {
    return `
    <p>It looks like you don't have an active Arcade session.</p>
    `;
  } else if (isPaused) {
    return `
    <p>Your session is paused.</p>
    <p>Click <a href="command:arcade.resumeSession">here</a> to resume your session.</p>
    `;
  } else {
    return `
    <p>Your session is active.</p>
    <p>Time remaining: ${remainingSeconds} seconds</p>
    <p>Goal: ${goal}</p>
    <div class="row">
      <vscode-button>Pause</vscode-button>
      <vscode-button appearance="secondary">End early</vscode-button>
    </div>
    `;
  }

  return "There was an error loading the content. Please try reloading.";
}

export function refreshView(): void {
  if (view) {
    view.webview.html = htmlTemplate(getHtmlContent());
  }
}

function htmlTemplate(content: string) {
  const nonce = getNonce();

  return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}';">
        <style>
          .row {
            display: grid;
            grid-auto-columns: max-content;
          }
        </style>
      </head>
      <body>
        ${content}
        ${
          extensionUri
            ? '<script type="module" src="' +
              getUrl(view!.webview, extensionUri, ["dist", "webview.js"]) +
              '" nonce="' +
              nonce +
              '"></script>'
            : ""
        }
      </body>
    </html>`;
}

function getUrl(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  pathList: string[]
): vscode.Uri {
  return webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...pathList));
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
