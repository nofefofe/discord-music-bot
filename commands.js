const config = require("./config/config.json");
const permission = require("./permissions.js");
const ytdl = require("ytdl-core");

let client;
let guild;

module.exports.ready = (newClient) => {
  client  = newClient;
  guild = client.guilds.get(config.guildId);
};
let voiceConnection = null;
let streamDispatcher = null;

let queue = [];
let nowPlaying = {};

let commands = [
  {
    name: "help",
    description: "Lists all commands or gives help for one command.",
    permission: permission.ANY,
    parameters:
    [
      {
        name: "command",
        optional: true,
        description: "The command to get help for."
      }
    ],
    aliases: ["commands"],
    run: (message, params) =>
    {
      if(params.length === 0)
      {
        //list all commands
        let response = [`Hello ${message.author.username}, here's a list of commands:`];
        for(let command of commands)
        {
          response.push(
            `  **${config.commandPrefix}${command.name}** - ${command.description}`
          );
        }
        response.push(`Type \`${config.commandPrefix}help <command>\` for more specific help on a single command.`);
        message.author.sendMessage(response.join("\n"));
      }
      else
      {
        //give help on a single command
        let command = findCommand(params[0]);
        if(command)
        {
          let reply = [`**Help for ${config.commandPrefix}${command.name}**`, `${config.commandPrefix}${command.name} - ${command.description}`];
          if(command.aliases && command.aliases.length >= 1)
          {
            reply.push(`**Aliases:** ${command.aliases.join(", ")}`);
          }
          let example = [`${config.commandPrefix}${command.name}`];
          if(command.parameters && command.parameters.length >= 1)
          {
            reply.push("**Parameters:**");
            for(let parameter of command.parameters)
            {
              reply.push(`  ${parameter.name}${parameter.optional ? " *(optional)*" : ""} - ${parameter.description}`);
              if(parameter.optional)
                example.push(`[${parameter.name}]`);
              else
                example.push(`<${parameter.name}>`);
            }
          }
          reply.push(`**Example usage: **${example.join(" ")}`);
          message.reply(reply.join("\n"));
        }else
        {
          message.reply(`Command "${params[0]}" not found. Type ${config.commandPrefix}help for a list of commands.`);
        }
      }
    }
  },
  {
    name: "play",
    aliases: ["request"],
    description: "Adds a song to the queue to be played.",
    permission: permission.GUILD_ONLY,
    parameters: [
      {
        name: "url",
        description: "The YouTube URL to the song.",
        optional: false
      }
    ],
    run: (message, params) => {
      if(!message.member.voiceChannel && queue.length === 0) //if the queue is empty, the first request must be from someone in a voice channel
      {
        return;
      }
      let youtubeRegex = /^(?:https?:\/\/)?(?:www\.)?youtube.com\/watch\?v\=(.+)$/i;
      let match = youtubeRegex.exec(params[0]);
      if(match && match[1])
      {
        let videoId = match[1];
        ytdl.getInfo(videoId, (err, info) => {
          if(err)
          {
            message.reply(err);
          }else {
            queue.push({
              id: videoId,
              name: info.title,
              author: message.author
            });
            if(queue.length === 1 && !voiceConnection) //start playing if the bot isn't already; otherwise, just wait for the queue to come to the current song.
            {
              message.member.voiceChannel.join().then((connection) => {
                voiceConnection = connection;
                nextInQueue();
              }).catch((err) => {
                console.log(err);
                message.reply(err);
              });
            }else {
              message.reply(`Added **${info.title}** to queue. (#${queue.length} in line)`);
            }
          }
        });
      }else {
        message.reply("Make sure you use a valid YouTube URL.");
        //TODO youtube search if not matching
      }
    }
  }, {
    name: "stop",
    description: "Stops any currently playing audio and clears the queue.",
    aliases: [],
    permission: permission.GUILD_ONLY,
    parameters: [],
    run: () => {
      queue = [];
      stopPlaying();
    }
  }, {
    name: "volume",
    aliases: ["vol", "v"],
    description: "Changes the volume of the currently playing audio.",
    parameters: [
      {
        name: "volume",
        description: "Integer 0-100 representing the volume.",
        optional: false
      }
    ],
    permission: permission.GUILD_ONLY,
    run: (message, params) => {
      if(params.length >= 1)
      {
        try {
          let volume = parseInt(params[0]);
          streamDispatcher.setVolume(clamp(volume, 0, 100) / 100);
        }catch(e)
        {
          message.reply(`Error setting volume: ${e}`);
        }
      }else {
        message.reply("Target volume is required.");
      }
    }
  }, {
    name: "skip",
    aliases: [],
    description: "Skips the currently playing song and moves onto the next one in the queue.",
    parameters: [],
    permission: permission.GUILD_ONLY,
    run: () => {
      streamDispatcher.end();
    }
  }, {
    name: "queue",
    aliases: ["upnext"],
    description: "See the next songs in the queue.",
    parameters: [],
    permission: permission.GUILD_ONLY,
    run: (message) => {
      if(queue.length >= 1)
      {
        let lines = ["**Current queue: **"];
        for(let i = 0; i< (queue.length > config.queueShownLength ? config.queueShownLength : queue.length); i++)
        {
          let song = queue[i];
          lines.push(`  ${i+1}. **${song.name}** (requested by **${song.author.username}**)`);
        }
        if(queue.length > config.queueShownLength)
          lines.push(`  ...and ${queue.length-config.queueShownLength} more songs.`);
        message.channel.sendMessage(lines.join("\n"));
      }else
      {
        message.reply("The song queue is empty.");
      }
    }
  },
  {
    name: "clearqueue",
    aliases: ["cq"],
    description: "Clears the queue (without stopping what's currently playing)",
    parameters: [],
    permission: permission.GUILD_ONLY,
    run: () => {
      queue = [];
    }
  },
  {
    name: "pause",
    aliases: ["p", "resume", "r"],
    description: "Pauses/resumes the currently playing audio.",
    parameters: [],
    permission: permission.GUILD_ONLY,
    run: (message) => {
      if(streamDispatcher)
      {
        if(streamDispatcher.paused)
        {
          streamDispatcher.resume();
          message.channel.sendMessage(":arrow_forward:");
        }else
        {
          streamDispatcher.pause();
          message.channel.sendMessage(":pause_button:");
        }
      }
    }
  },
  {
    name: "nowplaying",
    aliases: ["np"],
    description: "Shows the currently playing audio.",
    parameters: [],
    permission: permission.GUILD_ONLY,
    run: (message) => {
      let np = getNowPlaying();
      if(np)
      {
        message.reply(`Currently playing **${np.title}**`);
      }else {
        message.reply("Nothing currently playing.");
      }
    }
  }
];
function clamp (a, min, max)
{
  if (a < min)return min;
  else if (a > max) return max;
  else return a;
}
function stopPlaying() {
  if(voiceConnection)
  {
    voiceConnection.channel.leave();
    voiceConnection = null;
    client.user.setGame(null);
  }
}
function nextInQueue()
{
  if(queue.length === 0) //reached end of queue
  {
    stopPlaying();
  }else
  {
    let nextSong = queue.shift(); //get song next in line, remove from queue
    playSong(nextSong.id);
  }
}
function getNowPlaying()
{
  if(!streamDispatcher || !voiceConnection) return null;
  else return nowPlaying;
}
function playSong(videoId)
{
  let textChannel = client.guilds.get(config.guildId).defaultChannel;
  let stream = ytdl(videoId, {filter: "audioonly", quality: "lowest"});
  stream.on("info", (info) => {
    nowPlaying = {
      title: info.title,
      image: info.iurlhq720
    };
    client.user.setGame(info.title);
  });
  stream.on("response", (response) => {
    if(response.statusCode === 200)
    {
      if(voiceConnection) //is currently connected to channel, just play in there
      {
        let dispatcher = voiceConnection.playStream(stream, {volume: .25, seek: 0});
        dispatcher.once("end", () => {
          nextInQueue();
        });
        dispatcher.on("error", (err) => {
          nextInQueue();
          textChannel.sendMessage(`Error playing video: ${err}`);
        });

        streamDispatcher = dispatcher;
      }
    } else {
      textChannel.sendMessage("There was an error with the video.");
      nextInQueue();
    }
  });
  stream.on("error", (err) => {
    textChannel.sendMessage(`Error playing video: ${err}`);
  });
}

function findCommand(name) {
  for(let command of commands)
  {
    if(command.name === name || command.aliases.includes(name))
    {
      return command;
    }
  }
  return null;
}

function processMessage(message)
{
  let split = message.content.split(" ");
  if(split.length > 0)
  {
    let commandIn = split[0].slice(config.commandPrefix.length);
    let params = split.slice(1);
    let command = findCommand(commandIn);
    if(command)
      {
      if(permission.checkPermission(message, command))
        {
        try {
          command.run(message, params);
        } catch (e) {
          console.error(e);
          message.reply(`There was an error running command \"${command.name}\"`);
        }
      }
      else
        {
        message.reply("You don't have permission to perform that command here.");
      }
    }else
      {
      message.reply(`Command "${commandIn}" not found. Type ${config.commandPrefix}help for a list of commands.`);
    }
  }
}
module.exports.processMessage = processMessage;
