import * as vscode from "vscode";

let hasSession = false;
let isPaused = false;
let remainingSeconds = 0;
let work = "";
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

    webviewView.webview.html = htmlTemplate("<p>Loading Arcade...</p>");
  }
}

export function updateSessionStatus(hasS: boolean, isP: boolean): void {
  hasSession = hasS;
  isPaused = isP;
}

export function updateSessionInfo(seconds: number, g: string, w: string): void {
  remainingSeconds = seconds;
  work = w;
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
    <p>Get to work! You have <code>${Math.ceil(
      remainingSeconds / 60
    )}</code> minute${
      Math.floor(remainingSeconds / 60) === 1 ? "" : "s"
    } left to work on:</p>
    <vscode-divider></vscode-divider>
    <p><em>${work}</em></p>
    <vscode-divider></vscode-divider>
    <p class="goal"><strong>Goal:</strong> ${goal}</p>
    <div class="btn-group">
      <vscode-button>Pause</vscode-button>
      <vscode-button appearance="secondary">End Early</vscode-button>
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
  return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          code {
            color: var(--vscode-editorWarning-foreground);
          }
          .btn-group vscode-button + vscode-button {
            margin-left: 0.4rem;
          }
          .goal {
            margin-top: 0.3rem;
            opacity: 0.8;
          }
        </style>
      </head>
      <body>
        ${content}
        ${
          extensionUri
            ? '<script type="module" src="' +
              getUrl(view!.webview, extensionUri, ["dist", "webview.js"]) +
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
