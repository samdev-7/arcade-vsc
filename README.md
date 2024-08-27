# Arcade VSC

A VS code extension that allows you to view the [Hack Club Arcade](https://hackclub.com/arcade) timer in your editor.  

Install it [from the marketplace](https://marketplace.visualstudio.com/items?itemName=samdev.arcade-vsc).

_If you found this extension helpful in your Arcade journey, maybe you could give me a vote?_ 🙌

## Features

### The timer (ofc)
A timer will be added to the right of your status bar that will show you how long left you have in your hack hour session.  
Accurate to the second!

![The timer in the status bar](https://cloud-dgalzi41m-hack-club-bot.vercel.app/0image.png)

### Notifications
Arcade VSC has helpful notifications. Know when your session starts/pauses/ends!

![Start/pause/end notifications](https://cloud-9rffl52xc-hack-club-bot.vercel.app/0image.png)

For folks (like myself) who keep forgetting to start sessions, get reminded to start a session when you start typing!

![Reminder notifications](https://cloud-ixy70dhma-hack-club-bot.vercel.app/0image.png)

These notifications can be adjusted via the settings!

![Settings page](https://cloud-q7503ib70-hack-club-bot.vercel.app/0image.png)

### **NEW**: Control sessions
You can now start, stop, and control Arcade sessions. Use the pre-release version to check it out!

![Starting Arcade sessions within VS Code](https://cloud-4cnx5mxku-hack-club-bot.vercel.app/0image.png)
![Controlling Arcade sessions within VS Code](https://cloud-o315s3r6u-hack-club-bot.vercel.app/0image.png)

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
