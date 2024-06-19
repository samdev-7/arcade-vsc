import * as vscode from 'vscode';
import fetch from 'node-fetch';
import { stat } from 'fs';

let statusBarItem: vscode.StatusBarItem;

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

async function sessionEnd(id: string): Promise<Date> | never {
	const res = await fetch(hc_endpoint + id, {
		method: 'GET',
		headers: {
			'User-Agent': 'Arcade VSC Extension'
		}
	});

	if (res.status === 404) {
		throw new Error('ID not found');
	}

	if (res.status !== 200) {
		throw new Error(`Unexpected status code of ${res.status}`);
	}

	const ms = Number(await res.text());

	if (isNaN(ms)) {
		throw new Error('Invalid time received');
	}

	if (ms === -1) {
		throw new Error('No session active');
	}

	const d = new Date();
	d.setMilliseconds(d.getMilliseconds() + ms);
	return d;
}


async function saveID(context: vscode.ExtensionContext, id: string): Promise<void> {
	await context.globalState.update('arcade-vsc-id', id);
}

async function getID(context: vscode.ExtensionContext): Promise<string | undefined> {
	return context.globalState.get('arcade-vsc-id');
}

async function clearID(context: vscode.ExtensionContext): Promise<void> {
	await context.globalState.update('arcade-vsc-id', undefined);
}

export function activate(context: vscode.ExtensionContext) {
	console.log('arcade-vsc is now active!');

	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0);
	statusBarItem.text = '$(loading~spin) Loading Arcade';
	statusBarItem.tooltip = 'Hack Club Arcade';
	context.subscriptions.push(statusBarItem);

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
				const valid = await checkID(id);
				if (valid) {
					await saveID(context, id);
					vscode.window.showInformationMessage('ID has been validated and saved successfully!');
					updateStatusBarItem(context);
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
					await permError();
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
			await clearID(context);
			vscode.window.showInformationMessage('Cleared saved ID');
			updateStatusBarItem(context);
		})
	);

	getID(context).then((id) => {
		if (id === undefined) {
			vscode.window.showInformationMessage('Arcade VSC is not set up yet. Run the "Arcade: Init" command to get started!');
		} else {
			checkID(id).then((valid) => {
				if (!valid) {
					vscode.window.showWarningMessage('Your saved ID is invalid. Run the "Arcade: Init" command to reconfigure');
					clearID(context);
					updateStatusBarItem(context);
				}
			});
		}
	});
	statusBarItem.show();
	updateStatusBarItem(context);
}

let perm_error = false;

async function permError() {
	perm_error = true;
	statusBarItem.text = `$(error) Arcade Error`;
	statusBarItem.tooltip = 'Reload VS Code to try again';
	statusBarItem.command = '';
	statusBarItem.color = new vscode.ThemeColor('statusBarItem.warningForeground');
	statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
}

let end_date: Date | undefined;

async function updateStatusBarItem(context: vscode.ExtensionContext): Promise<void> {
	if (perm_error) {
		return;
	}

	console.log('Updating status bar item');
	let id = await getID(context);
	if (id === undefined) {
		statusBarItem.text = 'Arcade Not Set Up';
		statusBarItem.tooltip = 'Click to set up Arcade';
		statusBarItem.command = 'arcade-vsc.init';
		return;
	}

	statusBarItem.tooltip = `Hack Club Arcade  (ID: ${id})`;
	statusBarItem.command = '';

	if (end_date === undefined) {
		try {
			end_date = await sessionEnd(id);
		} catch (e: unknown) {
			if (e instanceof Error) {
				switch (e.message) {
					case 'ID not found':
						vscode.window.showWarningMessage('Your saved ID is invalid. Run the "Arcade: Init" command to reconfigure');
						clearID(context);
						updateStatusBarItem(context);
						break;
					case 'Invalid time received':
						await permError();
						vscode.window.showErrorMessage('Failed to get session time: Invalid data received');
						break;
					case 'No session active':
						statusBarItem.text = `No Arcade Session`;
						break;
					default:
						vscode.window.showErrorMessage('Failed to get session end time: ' + e.message);
						await permError();
				}
			} else {
				vscode.window.showErrorMessage('Failed to get session end time: Unknown error');
				await permError();
			}
			return;
		}
	}

	const now = new Date();

	if (end_date === undefined || end_date.getTime() < now.getTime()) {
		vscode.window.showErrorMessage('Failed to get session end time: Unknown error');
		permError();
		return;
	}

	const diff = new Date(end_date.getTime() - now.getTime());
	const minutes = diff.getUTCMinutes();
	const seconds = diff.getUTCSeconds();

	statusBarItem.text = `$(clock) ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function deactivate(): void { }