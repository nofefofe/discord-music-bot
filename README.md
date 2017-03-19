# discord-music-bot
Yet another Discord music bot. Made for ease of use and simplicity. Works with YouTube, but SoundCloud integration is planned.

Features
------
* Bot doesn't sit in your channel if there's no audio playing.
* Bot can join any channel in the guild you want (but will stay in that channel until stopped or running out the queue)
* Queueing/requests
* Full control over the currently playing audio (volume, skip song, play/pause)
* Linux `man` style command help :)

Usage
------
Use the command `play <url>` to make the bot join your channel and start playing audio.

Using `play` while audio is already playing will cause it to be added to the queue, which can be viewed using the `queue` command, and can be cleared with the `clearqueue` command.

You can adjust the volume with `volume <0-100>` and pause/play with `pause`.

For a complete list of commands, use the `help` command. If you want more specific information about a command, use `help <command>`.

Installation
------
Firstly, make sure you have [Node](https://nodejs.org/en/) installed. It is absolutely necessary to run this bot.

After installing, you need to either download this repository (try the [latest release](https://github.com/joek13/discord-music-bot/releases/latest)) or clone it using Git. If you don't know what Git is, just go with the first option. Save the bot's files inside some directory, and navigate to the directory in the command line (shift-right click within the bot's folder and press "Open command window here" if you're on Windows). Next, run `npm install` to install the bot's dependencies, and it's now time to configure the bot.

Configuring
------
Within the bot's directory is a directory called `config`. If you just cloned the repository, then the only file inside is called `config.json.example`. Go ahead an rename it to just `config.json`, and open it up with your favorite text editor.

It should look something like this:
```json
{
  "token": "your bot token here",
  "commandPrefix": "!",
  "ownerId": "your id here",
  "guildId": "your guild id here",
  "queueShownLength": 10
}
```

Now, it's time to start filling this bad boy in. First, you'll need to create a bot to get its token.

To get your bot token, head on over to the [Discord developer page](https://discordapp.com/developers/applications/me). Click "new app."
![new app image](http://i.imgur.com/7RgksYQ.png)

On the next page, enter your bot's name, and go ahead and upload the icon you want to use for your bot's avatar.
![bot page image](http://i.imgur.com/eUyrtnb.png)

Hit "Create App." 

Next, press the big blue button that says "Create a Bot User"
![creating a bot user](http://i.imgur.com/sHi6QsM.png)

You should now see a new panel. Click the blue text next to "token" to reveal your bot's token. It is **extremely important** that you keep this token a secret. Anyone with it could login to your bot's account and make it do anything they want.
![getting the bot's token](http://i.imgur.com/UmSWOfB.png)

Copy the token exactly as it is. It may be very long, but even one character being off will mean that the bot will not work.

Now, put the token where the config says "your bot token here." The token needs to be surrounded by quotes. For example, if your token was `abc123`, your config file would now look like this:
```JSON
{
  "token": "abc123",
  "commandPrefix": "!",
  "ownerId": "your id here",
  "guildId": "your guild id here",
  "queueShownLength": 10
}
```
The next option is your command prefix. Since it's ! by default, commands would be prefixed with a "!" (so you type "!play <song>").

ownerId is your User ID. To find it easily, go into Discord and mention yourself. Then, before you send the message, put a single backslash before the mention, and send it.

You'll see some numbers instead of a regular mention. Copy just the numbers (ignore the other symbols), and paste it between the quotes (where "your id here" is).

Next, paste the id of your server between the quotes that say "your guild id here." If you don't know how to find your guild id, reference this [Discord help article](https://support.discordapp.com/hc/en-us/articles/206346498-Where-can-I-find-my-server-ID-).

If you've done everything correctly, your config should look something like this: 
```JSON
{
  "token": "abc123",
  "commandPrefix": "!",
  "ownerId": "123456789123456789",
  "guildId": "567891234567891234",
  "queueShownLength": 10
}
```
queueShownLength is mostly a quality of life option. When users run the `queue` command, this controls how many songs it will show before cutting off (to avoid clogging chat).

Inviting your bot
------
Paste this link into your web browser: `https://discordapp.com/oauth2/authorize?permissions=66575424&scope=bot&client_id=`. Before you hit enter, copy the client id from your bot's page at the [Discord apps](https://discordapp.com/developers/applications/me) page and paste it at the end of the URL. Hit enter, and you should be able to invite the bot to your server.

Running the bot
------
Finally! You're ready to run the bot. Go back to your command window and type `node index.js` to start it up. The bot will run as long as this command window is open. If you want to run the bot permanently, look into [pm2](http://pm2.keymetrics.io/).

FAQ/Help! IT DOESN'T WORK!
------
* It says that "node"/"npm" isn't recognized.
  * Make sure you have [Node](https://nodejs.org/en/) installed.
* I'm seeing `Error: config.json is missing.`
  * Take a look at the [configuring section](https://github.com/joek13/discord-music-bot#configuring).
* `The bot does not belong to the guild specified in config.json.`
  * Make sure that the guild id set in `config.json` is correct and that you have actually invited your bot.
