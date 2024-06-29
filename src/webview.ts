import {
  provideVSCodeDesignSystem,
  vsCodeButton,
  vsCodeDivider,
  // @ts-ignore
} from "@vscode/webview-ui-toolkit";

provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeDivider());
