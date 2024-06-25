import * as vscode from "vscode";

let statusBarItem: vscode.StatusBarItem;

export async function init(context: vscode.ExtensionContext) {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    0
  );

  statusBarItem.text = "$(loading~spin) Arcade Loading...";
  statusBarItem.show();

  context.subscriptions.push(statusBarItem);
}

export async function setLoading() {
  statusBarItem.text = "$(loading~spin) Arcade Loading...";
  statusBarItem.tooltip = "Please wait...";
  statusBarItem.command = undefined;
  statusBarItem.backgroundColor = undefined;
  statusBarItem.color = undefined;
}

export async function setText(text: string, id: string) {
  statusBarItem.text = text;
  statusBarItem.tooltip = "Hack Club Arcade (ID: " + id + ")";
  statusBarItem.command = "arcade-vsc.slack";
  statusBarItem.color = undefined;
  statusBarItem.backgroundColor = undefined;
}

export async function setError() {
  statusBarItem.text = "$(error) Arcade Error";
  statusBarItem.tooltip = "An error occurred while fetching the status";
  statusBarItem.command = "arcade-vsc.refresh";
  statusBarItem.color = new vscode.ThemeColor(
    "statusBarItem.warningForeground"
  );
  statusBarItem.backgroundColor = new vscode.ThemeColor(
    "statusBarItem.warningBackground"
  );
}

export function setSetup() {
  statusBarItem.text = "$(gear) Setup Arcade";
  statusBarItem.tooltip = "Click to set up Arcade";
  statusBarItem.command = "arcade-vsc.init";
  statusBarItem.color = undefined;
  statusBarItem.backgroundColor = undefined;
}
