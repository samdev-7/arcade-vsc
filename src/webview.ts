import {
  provideVSCodeDesignSystem,
  vsCodeButton,
  vsCodeDivider,
  vsCodeTextField,
  // @ts-ignore
} from "@vscode/webview-ui-toolkit";

provideVSCodeDesignSystem().register(
  vsCodeButton(),
  vsCodeDivider(),
  vsCodeTextField()
);

const vscode = acquireVsCodeApi();

window.addEventListener("load", main);

function main() {
  const startBtn = document.getElementById("start") as HTMLButtonElement | null;
  const pauseBtn = document.getElementById("pause") as HTMLButtonElement | null;
  const resumeBtn = document.getElementById(
    "resume"
  ) as HTMLButtonElement | null;
  const endBtn = document.getElementById("end") as HTMLButtonElement | null;

  startBtn?.addEventListener("click", () => {
    vscode.postMessage({ command: "start" });
  });

  pauseBtn?.addEventListener("click", () => {
    vscode.postMessage({ command: "pause" });
  });

  resumeBtn?.addEventListener("click", () => {
    vscode.postMessage({ command: "resume" });
  });

  endBtn?.addEventListener("click", () => {
    vscode.postMessage({ command: "end" });
  });
}
