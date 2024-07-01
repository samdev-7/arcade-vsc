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

const HC_SLACK_REDIRECT = "slack://channel?team=T0266FRGM&id=C06SBHMQU8G";
const FETCH_INTERVAL = 1000 * 10;
const FETCH_ERROR_FACTOR = 2;
const FETCH_RETRY_CAP = 1000 * 60 * 5;

let isActive = false;

export async function activate(context: vscode.ExtensionContext) {
  console.log("arcade-vsc activated");

  statusBar.init(context);

  context.subscriptions.push(
    vscode.commands.registerCommand("arcade-vsc.init", async () => {
      const prevID = await config.getID();

      let id = await vscode.window.showInputBox({
        prompt: "Enter your user ID from the Hack Club Slack",
        placeHolder: !!prevID
          ? `This will overwrite your current ID: (${prevID})`
          : "You can get this from #what-is-my-slack-id",
        validateInput: (input: string) =>
          !!input && /^[A-Z0-9]{5,}$/.test(input)
            ? ""
            : "Please enter a valid ID (not your username or API key)",
        ignoreFocusOut: true,
      });

      if (!id) {
        vscode.window.showInformationMessage(
          "Exited Arcade setup without saving as no ID was provided."
        );
        return;
      }

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
        ignoreFocusOut: true,
      });

      if (!key) {
        vscode.window.showInformationMessage(
          "Exited Arcade setup without saving as no API key was provided."
        );
        return;
      }

      let session: api.SessionData | null = null;

      try {
        session = await api.retrier(
          () => api.getSession(key, id),
          "getSession"
        );
      } catch (err: unknown) {
        vscode.window.showErrorMessage(
          `Failed to validate information key: ${err}`
        );
        return;
      }

      if (session === null) {
        vscode.window.showErrorMessage(
          "Your saved info is invalid! Please make sure you have at least one arcade session and try again."
        );
        return;
      }

      vscode.window.showInformationMessage(
        "Your info has been securely saved locally."
      );
      config.saveApiKey(context, key);
      config.saveID(id);
      statusBar.setLoading();
      loop(context, Infinity, undefined, true);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("arcade-vsc.clear", async () => {
      await config.clearApiKey(context);
      await config.clearID();
      vscode.window.showInformationMessage("Cleared saved data");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("arcade-vsc.refresh", async () => {
      await loop(context, Infinity, undefined, true);
      vscode.window.showInformationMessage("Force refreshed status");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("arcade-vsc.slack", async () => {
      vscode.env.openExternal(vscode.Uri.parse(HC_SLACK_REDIRECT));
    })
  );

  config.getApiKey(context).then(async (key) => {
    if (key === "" || key === undefined) {
      statusBar.setSetup();
      return;
    }
    config.getID().then(async (id) => {
      if (id === "" || id === undefined) {
        statusBar.setSetup();
        return;
      }
    });

    // let session: api.SessionData | null = null;

    // try {
    //   session = await api.retrier(() => api.getSession(key), "getSession");
    // } catch (err: unknown) {
    //   stickyError(`Failed to validate API key: ${err}`);
    //   return;
    // }

    // if (session === null) {
    //   invalidKey(context);
    //   return;
    // }
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

  loop(context);
}

async function invalidKey(context: vscode.ExtensionContext) {
  vscode.window.showErrorMessage(
    'Your API key is invalid! Run the "Arcade: Init." command to reconfigure.'
  );
  config.clearApiKey(context);
  statusBar.setSetup();
}

let lastStickyError = "";
let stickyErrorCount = 0;

async function stickyError(msg: string) {
  stickyErrorCount++;
  if (msg !== lastStickyError) {
    vscode.window.showErrorMessage(msg);
    lastStickyError = msg;
  }
  statusBar.setError();
}

async function loop(
  context: vscode.ExtensionContext,
  sinceLastFetch = Infinity,
  prevSession?: api.SessionData,
  forced = false
) {
  let loopInterval = 1000;

  const key = await config.getApiKey(context);
  const id = await config.getID();

  if (key === "" || key === undefined || id === "" || id === undefined) {
    statusBar.setSetup();
    loop(context, sinceLastFetch + loopInterval, prevSession);
    return;
  }

  let session: api.SessionData | null = null;

  if (forced) {
    stickyErrorCount = 0;
  }

  if (
    (stickyErrorCount > 0 ? true : sinceLastFetch >= FETCH_INTERVAL) ||
    !prevSession ||
    forced
  ) {
    console.log("fetching session");
    try {
      session = await api.getSession(key, id);
    } catch (err: unknown) {
      console.error(`Error while fetching session: ${err}`);
      loopInterval = Math.min(
        FETCH_RETRY_CAP,
        FETCH_INTERVAL * Math.pow(FETCH_ERROR_FACTOR, stickyErrorCount)
      );

      stickyError(
        `Retrying in ${Math.floor(
          loopInterval / 1000
        )}s. Failed to fetch session info: ${err}`
      );

      if (!forced) {
        setTimeout(() => {
          loop(context, sinceLastFetch + loopInterval, prevSession);
        }, loopInterval);
      }

      return;
    }

    if (session === null) {
      invalidKey(context);

      if (!forced) {
        loop(context, sinceLastFetch + loopInterval, prevSession);
      }
      return;
    }

    sinceLastFetch = 0;
  } else {
    if (prevSession === undefined) {
      stickyError(
        "An unexpected error occured. This is not an issue with the API."
      );
      return;
    }
    session = prevSession;
  }

  stickyErrorCount = 0;

  // updateSessionStatus(!session.completed || session.paused, session.paused);

  if (!session.completed && !session.paused) {
    await onActive(session);
  } else if (session.completed) {
    await onComplete();
  } else if (session.paused) {
    await onPaused(session);
  }

  // refreshView();
  if (!forced) {
    setTimeout(
      () => loop(context, sinceLastFetch + loopInterval, session),
      loopInterval
    );
  }
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
