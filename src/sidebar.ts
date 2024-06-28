import * as vscode from "vscode";
import * as path from "path";

export class ArcadeSessionControl
  implements vscode.TreeDataProvider<vscode.TreeItem>
{
  constructor() {}

  // onDidChangeTreeData?:
  //   | vscode.Event<void | Dependency | Dependency[] | null | undefined>
  //   | undefined;

  getTreeItem(
    element: vscode.TreeItem
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
    throw new Error("Method not implemented.");
  }

  getChildren(
    element?: vscode.TreeItem | undefined
  ): vscode.ProviderResult<vscode.TreeItem[]> {
    return Promise.resolve([new vscode.TreeItem("Hello World!")]);
    throw new Error("Method getChildren not implemented.");
  }

  // getParent?(element: Dependency): vscode.ProviderResult<Dependency> {
  //   throw new Error("Method getParent not implemented.");
  // }

  // resolveTreeItem?(
  //   item: vscode.TreeItem,
  //   element: Dependency,
  //   token: vscode.CancellationToken
  // ): vscode.ProviderResult<vscode.TreeItem> {
  //   throw new Error("Method resolveTreeItem not implemented.");
  // }
}

class Dependency extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private version: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}-${this.version}`;
    this.description = this.version;
  }

  iconPath = {
    light: path.join(
      __filename,
      "..",
      "..",
      "resources",
      "light",
      "dependency.svg"
    ),
    dark: path.join(
      __filename,
      "..",
      "..",
      "resources",
      "dark",
      "dependency.svg"
    ),
  };
}
