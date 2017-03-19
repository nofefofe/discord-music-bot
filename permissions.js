const config = require("./config/config.json");

let permission =
  {
    ANY: 0, //anyone can use this command!
    GUILD_ONLY: 1, //anyone can use this command, but only in a guild!
  //intentionally leaving room for other, future permission here
    ADMIN_ONLY: 3, //only administrators can use this command!
    OWNER_ONLY: 4 //only the bot owner can use this command!
  };
module.exports = permission;
module.exports.checkPermission = (message, command) => {
  if(command.permission === permission.ANY) return true; //TODO: blacklist support
  if(command.permission >= permission.GUILD_ONLY && !message.guild) return false;
  if(message.author.id === config.ownerId) return true;
  if(command.permission >= permission.ADMIN_ONLY && !message.member.hasPermission("ADMINISTRATOR")) return false;
  if(command.permission >= permission.OWNER_ONLY && message.author.id !== config.ownerId) return false;
  return true;
};
