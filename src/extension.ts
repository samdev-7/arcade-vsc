import * as vscode from "vscode";
import * as statusBar from "./statusbar";
import * as config from "./config";
import * as notifications from "./notifications";
import * as api from "./api";
// import {
//   ArcadeViewProvider,
//   refreshView,
//   updateSessionStatus,
//   updateSessionInfo,
//   updateLoadingStatus,
// } from "./sidebar";

const hcSlackRedirect = "slack://channel?team=T0266FRGM&id=C06SBHMQU8G";
let isActive = false;

export async function activate(context: vscode.ExtensionContext) {
  console.log("arcade-vsc activated");

  statusBar.init(context);

  context.subscriptions.push(
    vscode.commands.registerCommand("arcade-vsc.init", async () => {
      const prevKey = await config.getApiKey(context);

      let key = await vscode.window.showInputBox({
        prompt: "Enter your Arcade API key. Your key is saved locally.",
        placeHolder: !!prevKey
          ? `This will overwrite your current saved key.`
          : 'You can get this by running "/api" in Slack. (Do not share it with anyone else)',
        validateInput: (input: string) =>
          !!input && /^[a-z,0-9,-]{36,36}$/.test(input)
            ? ""
            : "Please enter a valid API key (not your username or ID)",
      });

      if (!key) {
        vscode.window.showInformationMessage(
          "Exited Arcade setup without saving as no API key was provided."
        );
        return;
      }

      let session: api.SessionData | null = null;

      try {
        session = await api.retrier(() => api.getSession(key), "getSession");
      } catch (err: unknown) {
        vscode.window.showErrorMessage(`Failed to validate API key: ${err}`);
        return;
      }

      if (session === null) {
        vscode.window.showErrorMessage(
          "Your API KEY is invalid! Please make sure you have at least one arcade session and try again."
        );
        return;
      }

      vscode.window.showInformationMessage(
        "Your API key has been securely saved locally."
      );
      config.saveApiKey(context, key);
      statusBar.setLoading();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("arcade-vsc.clear", async () => {
      await config.clearApiKey(context);
      vscode.window.showInformationMessage("Cleared saved data");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("arcade-vsc.refresh", async () => {
      await loop(context);
      vscode.window.showInformationMessage("Force refreshed status");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("arcade-vsc.slack", async () => {
      vscode.env.openExternal(vscode.Uri.parse(hcSlackRedirect));
    })
  );

  config.getApiKey(context).then(async (key) => {
    if (key === "" || key === undefined) {
      statusBar.setSetup();
      return;
    }

    let session: api.SessionData | null = null;

    try {
      session = await api.retrier(() => api.getSession(key), "getSession");
    } catch (err: unknown) {
      stickyError(`Failed to validate API key: ${err}`);
      return;
    }

    if (session === null) {
      invalidKey(context);
      return;
    }
  });

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(
      async () => await notifications.onTyping(isActive)
    )
  );

  // TODO: Re-enable webview when ready
  // context.subscriptions.push(
  //   vscode.window.registerWebviewViewProvider(
  //     "arcade.session",
  //     new ArcadeViewProvider(context.extensionUri, onWebviewMessage, context),
  //     { webviewOptions: { retainContextWhenHidden: true } }
  //   )
  // );

  setInterval(() => loop(context), 1000);
}

async function invalidKey(context: vscode.ExtensionContext) {
  vscode.window.showErrorMessage(
    'Your API key is invalid! Run the "Arcade: Init." command to reconfigure.'
  );
  config.clearApiKey(context);
  statusBar.setSetup();
}

let lastStickyError = "";

async function stickyError(msg: string) {
  if (msg !== lastStickyError) {
    vscode.window.showErrorMessage(msg);
    lastStickyError = msg;
  }
  statusBar.setError();
}

async function loop(context: vscode.ExtensionContext) {
  const key = await config.getApiKey(context);

  if (key === "" || key === undefined) {
    statusBar.setSetup();
    return;
  }

  let session: api.SessionData | null = null;

  try {
    session = await api.getSession(key);
  } catch (err: unknown) {
    stickyError(`Failed to fetch session info: ${err}`);
    return;
  }

  if (session === null) {
    invalidKey(context);
    return;
  }

  // updateSessionStatus(!session.completed || session.paused, session.paused);

  if (!session.completed && !session.paused) {
    await onActive(session);
  } else if (session.completed) {
    await onComplete();
  } else if (session.paused) {
    await onPaused(session);
  }

  // refreshView();
}

let startNotified = false;
let completeNotified = true;
let pauseNotified = false;
let resumeNotified = false;

async function onActive(session: api.SessionData) {
  isActive = true;

  const remainingMs = session.endTime.getTime() - Date.now();
  const remainingMin = Math.floor(remainingMs / 60000)
    .toString()
    .padStart(2, "0");
  const remainingSec = Math.floor((remainingMs % 60000) / 1000)
    .toString()
    .padStart(2, "0");

  // updateSessionInfo(Math.floor(remainingMs / 1000), session.goal, session.work);

  if (remainingMs > 0) {
    statusBar.setText(`$(watch) ${remainingMin}:${remainingSec}`);
  } else {
    statusBar.setText("$(loading~spin) Ending...");
  }

  if (!pauseNotified && !startNotified) {
    notifications.sessionStart(session.goal);
    startNotified = true;
    resumeNotified = true;
  } else if (pauseNotified && !resumeNotified) {
    notifications.sessionResume();
    resumeNotified = true;
    startNotified = true;
  }
  completeNotified = false;
  pauseNotified = false;
}

async function onComplete() {
  isActive = false;

  statusBar.setText("No Session");

  if (!completeNotified) {
    notifications.sessionComplete();
    completeNotified = true;
  }
  startNotified = false;
  pauseNotified = false;
  resumeNotified = false;
}

async function onPaused(session: api.SessionData) {
  isActive = false;

  statusBar.setText(`$(debug-pause) Paused: ${session.remaining} mins`);
  // updateSessionInfo(0, session.goal, session.work);

  if (!pauseNotified) {
    notifications.sessionPause();
    pauseNotified = true;
  }
  startNotified = false;
  completeNotified = false;
  resumeNotified = false;
}

// async function onWebviewMessage(event: any, context: vscode.ExtensionContext) {
//   let command = event.command as "start" | "pause" | "resume" | "end";

//   if ((await config.getApiKey(context)) === undefined) {
//     vscode.window.showErrorMessage(
//       `You need to set your API key to interact with sessions. Run the "Arcade: Init" command to set it up.`
//     );
//     return;
//   }

//   updateLoadingStatus(true);
//   refreshView();

//   switch (command) {
//     case "start":
//       console.log("start from webview");
//       api.startSession((await config.getApiKey(context))!);
//       break;
//     case "pause":
//       console.log("pause from webview");
//       api.pauseSession((await config.getApiKey(context))!);
//       break;
//     case "resume":
//       console.log("resume from webview");
//       api.pauseSession((await config.getApiKey(context))!);
//       break;
//     case "end":
//       console.log("end from webview");
//       api.endSession((await config.getApiKey(context))!);
//       break;
//   }

//   updateLoadingStatus(false);
//   refreshView();
// }
