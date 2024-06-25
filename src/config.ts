import * as vscode from "vscode";

export async function saveID(id: string): Promise<void> {
  await vscode.workspace
    .getConfiguration()
    .update("arcade-vsc.slackID", id, true);
}

export async function getID(): Promise<string> {
  return await vscode.workspace
    .getConfiguration()
    .get("arcade-vsc.slackID", "");
}

export async function clearID(): Promise<void> {
  await vscode.workspace
    .getConfiguration()
    .update("arcade-vsc.slackID", undefined, true);
}

export async function showSessionNotifications(): Promise<boolean> {
  return await vscode.workspace
    .getConfiguration()
    .get("arcade-vsc.notifications.sessionNotifications", true);
}

export async function showStartReminderNotifications(): Promise<boolean> {
  return await vscode.workspace
    .getConfiguration()
    .get("arcade-vsc.notifications.startReminder", true);
}

export async function hideStartReminderNotifications(): Promise<void> {
  await vscode.workspace
    .getConfiguration()
    .update("arcade-vsc.notifications.startReminder", false, true);
}
