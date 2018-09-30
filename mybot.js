const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const fs = require('fs');
const request = require('request');

var logs;

var guildName = "Oz"
var serverName = "Uldaman"
var region = "US"

var warcraftLogsApiKey = "6d3a3b4d4b3909ca0c6bb5af9abce58a"
var notificationChannelId = "453730673698537472"

var url = "https://www.warcraftlogs.com:443/v1/reports/guild/" + guildName + "/" + serverName + "/" + region + "?api_key=" + warcraftLogsApiKey;

//runs every 60s
var interval = 60;

//console greeting message
client.on("ready", () => {
  console.log("Locked and loaded, captain!");
});
 
//event listener for new guild members
client.on('guildMemberAdd', member => {

  // Sends message to 'news-feed' channel in Oz cord
  const channel = member.guild.channels.find(ch => ch.name === 'news-feed');

  // Do nothing if chan gets deleted or name changed or something (not there)
  if (!channel) return;

  // Sends welcome msg to member
  channel.send(`Welcome to the Oz Discord Channel, ${member}!`);
});

//compares existing logs.json version against updated one and posts newest item added to log. 
setInterval(function(){
  request.get({
    url: url,
    json: true,
    headers: {'User-Agent': 'request'}
  }, (err, res, data) => {
    if (err)
    {
      console.log('Error:', err);
    }
    else if (res.statusCode !== 200)
    {
      console.log('Status:', res.statusCode);
    }
    else
    {

      logs = data;

      //compare old & new log data
      var oldLogs = fs.readFileSync('logs.json', 'utf8')

      if (oldLogs !== JSON.stringify(logs))
      {
        //notification sent to Discord channel
        postLogNotification(logs[0]);
        //new saved log data to logs.json
        saveLogsToFile();
      }
    }
  });
}, interval * 1000)

//saves new entry to logs.json
function saveLogsToFile() {
  console.log("Writing logs to file ...")
  fs.writeFile("logs.json", JSON.stringify(logs), function(err){
    if(err)
    {
      return console.log("File write error:" + err);
    }
    console.log("File write successful!");
  });
}

//formats alert sent to Discord channel
function postLogNotification(log){
  var startDate = new Date(log.start);
  console.log(log)
  var messageString = (startDate.getMonth()+1) + "-" + startDate.getDate() + "-" + startDate.getFullYear() + "   ";
  messageString += "**" + log.title + "**\n";
  messageString += "https://www.warcraftlogs.com/reports/" + log.id;
  client.channels.get(notificationChannelId).send(messageString);
}

client.on("message", message => {
  if (message.author.bot) return;
  if (message.content.indexOf(config.prefix) !== 0) return;
 
 //reads message regardless of prefix or case
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
 
  if(command === 'ping') {
    message.channel.send('Pong!');
  } 

});


//logs into WCL with Discord client token via config file
client.login(config.token);