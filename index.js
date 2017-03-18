const discord = require("discord.js");
const client = new discord.Client();
const config = require("./config/config.json");
const command = require("./commands.js");

client.on("ready", () => {
  console.log(`Logged in as ${client.user.username}`);
});
client.on("disconnect", (close) => {
  console.log(`WebSocket closed: ${close.reason}`);
});
client.on("warn", console.log);
client.on("error", console.error);

client.on("message", (message) => {
  if(message.content.startsWith(config.commandPrefix))
  {
    command.processMessage(message);
  }
});

client.login(config.token);
