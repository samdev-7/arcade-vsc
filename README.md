# Arcade VSC

A VS code extension that allows you to view the [Hack Club Arcade](https://hackclub.com/arcade) timer in your editor.  

Install it [from the marketplace](https://marketplace.visualstudio.com/items?itemName=samdev.arcade-vsc).

## Features

A timer will be added to the right of your status bar that will show you how long left you have in your hack hour session.

![The timer in the status bar](https://cloud-dgalzi41m-hack-club-bot.vercel.app/0image.png)

## Requirements

You have to be in the Hack Club Slack to use the extension. See the [Hack Club Arcade](https://hackclub.com/arcade) page for information on how to join.

## Extension Settings

To set up, you will need to get your Slack ID and Arcade API key from the Hack Club Slack.  
Get your ID by going to the `#what-is-my-slack-id` channel and sending something.  
Get an API key by using the command `/api`. Do not share this key with others.

Then, you will need to run the `Arcade: Init` command and enter your Slack ID and API key.

The extension will then automatically start displaying the timer in the status bar during active Arcade sessions.

Arcade is configurable via VS Code's configuration options.

## Known Issues

- The timer may flicker when it is updating, this is due to latency with the Hack Club Arcade API.
- There may be delays in Start/Stop/Resume/End updates due to rate limits the Hack Club Arcade API. The timer will still count down normally.

## Release Notes

See the [changelog](https://github.com/samdev-7/arcade-vsc/blob/main/CHANGELOG.md) for more information.
