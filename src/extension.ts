import * as vscode from 'vscode';
import axios, { get } from 'axios';

let statusBarItem: vscode.StatusBarItem;

const idTest = (id: string): boolean => !!id && /^[A-Z0-9]{5,}$/.test(id);

const hc_endpoint = "https://hackhour.hackclub.com/api/clock/";
const hc_slack_channel = "https://hackclub.slack.com/archives/C06SBHMQU8G";

async function checkID(id: string, retries = 0): Promise<boolean> | never {

	async function retry(message = 'Unknown error'): Promise<boolean> {
		vscode.window.showWarningMessage(`Fail ${retries + 1} to check ID: ${message}`);
		return new Promise((resolve, reject) =>
			setTimeout(async () => {
				try {
					if (retries < 2) {
						resolve(await checkID(id, retries + 1));
					} else {
						reject(new Error(message));
					}
				} catch (e: unknown) {
					if (e instanceof Error) {
						reject(e);
					} else {
						reject(new Error('Unknown error'));
					}
				}
			}, (retries + 1) * 500)
		);
	}


	let res: axios.AxiosResponse;

	try {
		res = await axios(hc_endpoint + id, {
			method: 'GET',
			headers: {
				'User-Agent': 'Arcade VSC Extension'
			},
			timeout: 5000
		});
	} catch (e: unknown) {
		if (e instanceof axios.AxiosError) {
			if (e.response === undefined) {
				return await retry(`Request error: ${e.message}`);
			}
			res = e.response;
		} else {
			console.error(e);
			return await retry(`Unknown error`);
		}
	}

	switch (res.status) {
		case 200:
			return true;
		case 404:
			if (res.data === 'User not found') {
				return false;
			}
			return await retry(`Unexpected result: ${res.data}`);
	}

	return await retry(`Unexpected status code: ${res.status}`);
}

async function sessionEnd(id: string): Promise<Date> | never {
	const res = await axios(hc_endpoint + id, {
		method: 'GET',
		headers: {
			'User-Agent': 'Arcade VSC Extension'
		},
		timeout: 5000
	});

	if (res.status === 404) {
		throw new Error('ID not found');
	}

	if (res.status !== 200) {
		throw new Error(`Unexpected status code of ${res.status}`);
	}

	const ms = Number(await res.data);

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
	setLoading();
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

			let valid = false;

			try {
				valid = await checkID(id);
			} catch (e: unknown) {
				if (e instanceof Error) {
					vscode.window.showErrorMessage(`Failed to check ID: ` + e.message);
					return;

				} else {
					vscode.window.showErrorMessage(`Failed to check ID: Unknown error`);
					return;
				}
			}

			if (valid) {
				await saveID(context, id);
				vscode.window.showInformationMessage('ID has been validated and saved successfully!');
				updateStatusBarItem(context);

			} else {
				vscode.window.showErrorMessage('ID is invalid! Please check your ID and try again');
				return;
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

	context.subscriptions.push(
		vscode.commands.registerCommand('arcade-vsc.refresh', async () => {
			await updateStatusBarItem(context);
			vscode.window.showInformationMessage('Force refreshed Arcade status');
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('arcade-vsc.slack', async () => {
			vscode.env.openExternal(vscode.Uri.parse(hc_slack_channel));
		})
	);

	getID(context).then(async (id) => {
		if (id === undefined) {
			vscode.window.showInformationMessage('Arcade VSC is not set up yet. Run the "Arcade: Init" command to get started!');
		} else {
			let valid = false;
			try {
				valid = await checkID(id);
			} catch (e: unknown) {
				if (e instanceof Error) {
					setError(`Failed to check ID: ` + e.message);
					return;
				} else {
					setError('Failed to check ID: Unknown error', true);
					return;
				}
			}
			if (!valid) {
				vscode.window.showWarningMessage('Your saved ID is invalid. Run the "Arcade: Init" command to reconfigure');
				clearID(context);
				updateStatusBarItem(context);
			}
		}
	});

	statusBarItem.show();


	async function loop() {
		console.log('tick')
		if (perm_error) {
			return;
		}

		if (error) {
			console.log("error t")
			updateStatusBarItem(context);
			setTimeout(loop, 1000 * 10);
			return;
		}

		updateStatusBarItem(context);
		setTimeout(loop, 1000);
	}
	loop();
}

let perm_error = false;
let error = false;
let sent_error = '';

async function setLoading() {
	statusBarItem.text = '$(loading~spin) Arcade Loading';
	statusBarItem.tooltip = 'Please wait...';
	statusBarItem.color = undefined;
	statusBarItem.backgroundColor = undefined;
}

async function setText(text: string, id: string) {
	statusBarItem.text = text;
	statusBarItem.tooltip = 'Hack Club Arcade (ID: ' + id + ')';
	statusBarItem.command = 'arcade-vsc.slack';
	statusBarItem.color = undefined;
	statusBarItem.backgroundColor = undefined;
}

async function setError(message: string = 'An error occurred', perm = false): Promise<void> {
	console.error(`Arcade VSC has encountered an${perm ? 'unrecoverable ' : ''} error: ` + message);
	if (sent_error !== message) {
		vscode.window.showErrorMessage(message);
	}
	sent_error = message;
	error = true;
	statusBarItem.text = `$(loading~spin) Arcade Error`;
	statusBarItem.tooltip = 'Retrying every 10s...';
	statusBarItem.command = '';

	if (perm) {
		statusBarItem.color = new vscode.ThemeColor('statusBarItem.warningForeground');
		statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
		statusBarItem.text = `$(error) Arcade Error`;
		statusBarItem.tooltip = 'Reload VS Code to try again';
	}

	perm_error = perm;
}

function unsetError() {
	console.log('Unsetting error');
	vscode.window.showInformationMessage('Arcade error resolved');
	sent_error = '';
	error = false;
	statusBarItem.color = undefined;
	statusBarItem.backgroundColor = undefined;
}

let end_date: Date | undefined;
let start_notified = false;
let pause_notified = true;

async function updateStatusBarItem(context: vscode.ExtensionContext): Promise<void> {
	let id = await getID(context);
	if (id === undefined) {
		statusBarItem.text = 'Arcade Not Set Up';
		statusBarItem.tooltip = 'Click to set up Arcade';
		statusBarItem.command = 'arcade-vsc.init';
		return;
	}

	try {
		console.log('d')
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
					await setError('Failed to get session time: Invalid data received');
					break;
				case 'No session active':
					if (error) {
						unsetError();
					}
					statusBarItem.text = `No Arcade Session`;
					start_notified = false;
					if (!pause_notified) {
						vscode.window.showInformationMessage('It seems like you have pause your Arcade session. Get back to work when you are ready!');
						pause_notified = true;
					}
					break;
				default:
					await setError('Failed to get session end time: ' + e.message);
			}
		} else {
			await setError('Failed to get session end time: Unknown error', true);
		}
		return;
	}

	const now = new Date();


	if (end_date.getTime() - now.getTime() < 900) {
		vscode.window.showInformationMessage('Your Arcade session has ended. Remember to scrap your progress! 🚀');
		console.log('Session has ended');
		end_date = undefined;
		updateStatusBarItem(context);
		return;
	}

	if (end_date && !start_notified) {
		if (end_date.getTime() - now.getTime() > 1000 * 60 * 59) {
			vscode.window.showInformationMessage('Your started an Arcade session. Get to work! 💻');
			console.log('Session has started');
		} else {
			vscode.window.showInformationMessage('Your Arcade session has been resumed. Continue working! 💻');
			console.log('Session has resumed');
		}
		start_notified = true;
		pause_notified = false;
	}

	const diff = new Date(end_date.getTime() - now.getTime());
	const minutes = diff.getUTCMinutes();
	const seconds = diff.getUTCSeconds();

	if (error) {
		unsetError();
	}
	setText(`$(watch) ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`, id);
}


export function deactivate(): void { }