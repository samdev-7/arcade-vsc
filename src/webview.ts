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
    const workInp = document.getElementById("work") as HTMLInputElement | null;

    startBtn?.addEventListener("click", () => {
        if (!workInp?.value) {
            return;
        }
        vscode.postMessage({ command: "start", work: workInp.value });
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
