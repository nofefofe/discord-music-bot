const config = require("./config/config.json");
const permission = require("./permissions.js");
const ytdl = require("ytdl-core");

let targetChannel = null;
let voiceConnection = null;
let streamDispatcher = null;
let queue = [];

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
              reply.push(`  ${parameter.name} ${parameter.optional ? "*(optional)*" : ""} - ${parameter.description}`);
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
      if(!message.member.voiceChannel)
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
            message.reply(`There is an error with that video: ${err}`);
          }else {
            queue.push({
              id: videoId,
              name: info.title,
              author: message.author
            });
            if(!voiceConnection) //start playing if the bot isn't already; otherwise, just wait for the queue to come to the current song.
            {
              targetChannel = message.member.voiceChannel;
              nextInQueue(message.guild);
            }else {
              message.reply(`Added **${info.title}** to queue. (#${queue.length} in line)`);
            }
          }
        });
      }else {
        message.reply("Make sure you use a valid YouTube URL.");
      }
    }
  }
];

function nextInQueue(guild)
{
  if(queue.length === 0 && voiceConnection) //reached end of queue
  {
    voiceConnection.channel.leave().catch(console.err);
  }else
  {
    let nextSong = queue.shift(); //get song next in line, remove from queue
    playSong(nextSong.id, guild);
  }
}
function playSong(videoId, guild)
{
  let stream = ytdl(videoId, {filter: "audioonly", quality: "lowest"});
  stream.on("response", (response) => {
    if(response.statusCode === 200)
    {
      if(voiceConnection) //is currently connected to channel, just play in there
      {
        let dispatcher = voiceConnection.playStream(stream, {volume: .25, seek: 0});
        dispatcher.once("end", () => {
          nextInQueue(guild);
        });
        dispatcher.on("error", (err) => {
          nextInQueue(guild);
          guild.defaultChannel.sendMessage(`Error playing video: ${err}`);
        });
        streamDispatcher = dispatcher;
      }
      else { //join voice channel
        targetChannel.join().then((connection) => {
          voiceConnection = connection;
          playSong(videoId, guild); //try again now that bot is in voice channel
        });
      }
    }else {
      guild.defaultChannel.sendMessage("There was an error with the video.");
      nextInQueue();
    }
  });
  stream.on("error", (err) => {
    guild.defaultChannel.sendMessage(`Error playing video: ${err}`);
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
      message.reply(`Command "${params[0]}" not found. Type ${config.commandPrefix}help for a list of commands.`);
    }
  }
}
module.exports.processMessage = processMessage;
