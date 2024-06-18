import * as vscode from 'vscode';
import fetch from 'node-fetch';

const idTest = (id: string): boolean => !!id && /^[A-Z0-9]{5,}$/.test(id);

const hc_endpoint = "https://hackhour.hackclub.com/api/clock/";

async function checkID(id: string): Promise<boolean> | never {
	const res = await fetch(hc_endpoint + id, {
		method: 'GET',
		headers: {
			'User-Agent': 'Arcade VSC Extension'
		}
	});

	switch (res.status) {
		case 200:
			return true;
		case 404:
			return false;
		default:
			throw new Error(`Unexpected status code of ${res.status}`);
	}

}

async function saveID(context: vscode.ExtensionContext, id: string): Promise<void> {
	await context.globalState.update('arcade-vsc-id', id);
}

async function getID(context: vscode.ExtensionContext): Promise<string | undefined> {
	return context.globalState.get('arcade-vsc-id');
}

export function activate(context: vscode.ExtensionContext) {

	console.log('arcade-vsc is now active!');

	if (context.globalState.get('arcade-vsc-id') === undefined) {
		vscode.window.showInformationMessage('Arcade VSC is not set up yet. Run the "Arcade: Init" command to get started!');
	}

	context.subscriptions.push(
		vscode.commands.registerCommand('arcade-vsc.init', async () => {
			const prev_id = await getID(context);

			let id = await vscode.window.showInputBox({
				prompt: 'Enter your user ID from the Hack Club Slack',
				placeHolder: !!prev_id ? 'This will overwrite your previous saved ID' : 'You can get this from #what-is-my-slack-id',
				validateInput: (id: string) => idTest(id) ? '' : 'Please enter a valid Slack ID (not your username)'
			});

			if (id === undefined) {
				vscode.window.showWarningMessage('Exited Arcade VSC setup as no ID was provided');
				return;
			};

			try {
				const res = await checkID(id);
				if (res) {
					await saveID(context, id);
					vscode.window.showInformationMessage('ID has been validated and saved successfully!');
				} else {
					vscode.window.showErrorMessage('ID is invalid! Please check your ID and try again');
					return;
				}
			} catch (e: unknown) {
				if (e instanceof Error) {
					vscode.window.showErrorMessage('Failed to check ID: ' + e.message);
					return;
				} else {
					vscode.window.showErrorMessage('Failed to check ID: Unknown error');
					return;
				}
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('arcade-vsc.clear', async () => {
			if (await getID(context) === undefined) {
				vscode.window.showWarningMessage('No ID is saved');
				return;
			}
			await context.globalState.update('arcade-vsc-id', undefined);
			vscode.window.showInformationMessage('Cleared saved ID');
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() { }
