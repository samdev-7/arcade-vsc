import {
  provideVSCodeDesignSystem,
  vsCodeButton,
  // @ts-ignore
} from "@vscode/webview-ui-toolkit";

provideVSCodeDesignSystem().register(vsCodeButton());
