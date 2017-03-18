const discord = require("discord.js");
const client = new discord.Client();
const permission = require("./permissions.js");
const config = require("./config/config.json");

client.login(config.token);
