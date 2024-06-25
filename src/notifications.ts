import * as vscode from "vscode";
import * as config from "./config";

export async function sessionStart(goal: string) {
  if (!(await config.showSessionNotifications())) {
    return;
  }
  vscode.window.showInformationMessage(
    "⌨️ Your session has started! " +
      (goal === "No Goal"
        ? "Don't forget to set your goal!"
        : `Time to get to work on ${goal}`)
  );
}

export async function sessionComplete() {
  if (!(await config.showSessionNotifications())) {
    return;
  }
  vscode.window.showInformationMessage(
    "🚀 Your session has ended! Remember to show your progress in the thread."
  );
}

export async function sessionPause() {
  if (!(await config.showSessionNotifications())) {
    return;
  }
  vscode.window.showInformationMessage(
    "⏸️ Your session has been paused. Take a break!"
  );
}

export async function sessionResume() {
  if (!(await config.showSessionNotifications())) {
    return;
  }
  vscode.window.showInformationMessage(
    "▶️ Your session has been resumed. Keep up the good work!"
  );
}

let typingAmount = 0;
let startNudged = false;

export async function onTyping(isActive: boolean) {
  if (!(await config.showStartReminderNotifications()) || isActive) {
    startNudged = false;
    typingAmount = 0;
    return;
  }

  typingAmount++;
  if (typingAmount >= 5 && !startNudged) {
    let selection = await vscode.window.showInformationMessage(
      "You seem to be working on something... Don't forget to start a session!",
      "Don't Show Again"
    );
    startNudged = true;
    if (selection === "Don't Show Again") {
      await config.hideStartReminderNotifications();
      await vscode.window.showInformationMessage(
        "Start reminder notifications have been disabled. You can re-enable them in the settings."
      );
    }
  }
}
