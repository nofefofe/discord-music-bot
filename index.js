const discord = require("discord.js");
const client = new discord.Client();
const fs = require("fs");

if(!fs.existsSync("./config/config.json"))
{
  console.error("Error: config.json is missing. You may need to copy the example config before continuing.");
}

const config = require("./config/config.json");
const command = require("./commands.js");

let guild;
client.on("ready", () => {
  console.log(`Logged in as ${client.user.username}`);
  command.ready(client);

  guild = client.guilds.get(config.guildId);

  if(!guild)
  {
    throw new Error("The bot does not belong to the guild specified in config.json.");
  }

  for(let otherGuild of client.guilds.array())
  {
    if(otherGuild.id !== config.guildId)otherGuild.leave();
  }
});

client.on("disconnect", (close) => {
  console.log(`WebSocket closed: ${close.reason}`);
});

client.on("warn", console.log);
client.on("error", console.error);

client.on("guildCreate", (guild) => {
  if(guild.id !== config.guildId)
  {
    guild.leave();
  }
});

client.on("message", (message) => {
  if(message.content.startsWith(config.commandPrefix))
  {
    command.processMessage(message);
  }
});

client.login(config.token);
