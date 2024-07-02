import * as vscode from "vscode";

let hasSession = false;
let isPaused = false;
let loading = false;
let remainingSeconds = 0;
let work = "";
let goal = "";

let view: vscode.WebviewView | undefined;
let extensionUri: vscode.Uri | undefined;

export class ArcadeViewProvider implements vscode.WebviewViewProvider {
  onWebviewMessage: (message: any, context: vscode.ExtensionContext) => void;
  context: vscode.ExtensionContext;

  constructor(
    extensionU: vscode.Uri,
    onWebviewMessage: (message: any, context: vscode.ExtensionContext) => void,
    context: vscode.ExtensionContext
  ) {
    extensionUri = extensionU;
    this.onWebviewMessage = onWebviewMessage;
    this.context = context;
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

    webviewView.webview.onDidReceiveMessage((message: any) => {
      this.onWebviewMessage(message, this.context);
    });
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

export function updateLoadingStatus(l: boolean): void {
  loading = l;
}

function getHtmlContent(): string {
  if (!hasSession) {
    return `
    <p>Let's start a new session.</p>
    <div class="input">
      <strong>What are you working on?</strong>
      <vscode-text-field placeholder="Today I'm working on..." id="work"></vscode-text-field>
    </div>
    <vscode-button class="start-btn" id="start" ${loading ? "disabled" : ""
      }>Start the Timer</vscode-button>
    `;
  } else if (isPaused) {
    return `
    <p>Take a break! Your session is paused:</p>
    <vscode-divider></vscode-divider>
    <p><em>${work}</em></p>
    <vscode-divider></vscode-divider>
    <p class="goal"><strong>Goal:</strong> ${goal}</p>
    <div class="btn-group">
      <vscode-button id="resume" ${loading ? "disabled" : ""
      }>Resume</vscode-button>
    </div>
    `;
  } else {
    return `
    <p>Get to work! You have <code>${Math.ceil(
      remainingSeconds / 60
    )}</code> minute${Math.floor(remainingSeconds / 60) === 1 ? "" : "s"
      } left to work on:</p>
    <vscode-divider></vscode-divider>
    <p><em>${work}</em></p>
    <vscode-divider></vscode-divider>
    <p class="goal"><strong>Goal:</strong> ${goal}</p>
    <div class="btn-group">
      <vscode-button id="pause" ${loading ? "disabled" : ""
      }>Pause</vscode-button>
      <vscode-button appearance="secondary" id="end" ${loading ? "disabled" : ""
      }>End Early</vscode-button>
    </div>
    `;
  }
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
          .input {
            display: grid;
            gap: 0.3rem;
          }
          .start-btn {
            margin-top: 1rem;
          }
        </style>
      </head>
      <body>
        ${content}
        ${extensionUri
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
