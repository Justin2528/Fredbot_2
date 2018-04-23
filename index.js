const botconfig = require("./botconfig.json");
const  tokenfile= require("./token.json");
const Discord  = require("discord.js");
const fs = require("fs");
const bot = new Discord.Client({disableEveryone: true});
bot.commands = new Discord.Collection();
let coins = require("./coins.json");
let xp = require("./xp.json");
let purple = botconfig.purple;
let cooldown = new Set();
let cdseconds = 3;

fs.readdir("./commands/", (err, files) => {

  if(err) console.log(err);

  let jsfile = files.filter(f => f.split(".").pop() === "js")
  if(jsfile.length <= 0){
    console.log("Couldn't find commands.");
    return;
  }

  jsfile.forEach((f, i) => {
    let props = require(`./commands/${f}`);
    console.log(`${f} loaded!`);
    bot.commands.set(props.help.name, props);
  });

});



bot.on("ready", async () => {
  console.log(`${bot.user.username} is online!`);
  bot.user.setActivity("do !help");
});

bot.on("guildMemberAdd", async member => {
  console.log(`${member.id} joined the server.`);

  let welcomechannel = member.guild.channels.find(`name`, "welcome_leave");
  welcomechannel.send(`YO! ${member} has joined the party!`);
});

bot.on("guildMemberRemove", async member => {

  console.log(`${member.id} left the server.`);

  let welcomechannel = member.guild.channels.find(`name`, "welcome_leave");
  welcomechannel.send(`Bad! ${member} left the party! shy guy. ha!`);

});


bot.on("message", async message => {
  if(message.author.bot) return;
  if(message.channel.type === "dm") return;

  let prefixes = JSON.parse(fs.readFileSync("./prefixes.json", "utf8"));
  if(!prefixes[message.guild.id]){
    prefixes[message.guild.id] = {
      prefixes: botconfig.prefix
    };
  }

  if(!coins[message.author.id]){
    coins[message.author.id] = {
      coins: 0
    };
  }

  let coinAmt = Math.floor(Math.random() * 15) + 1;
  let baseAmt = Math.floor(Math.random() * 15) + 1;
  console.log(`${coinAmt} ; ${baseAmt}`);

  if(coinAmt === baseAmt){
    coins[message.author.id] = {
      coins: coins[message.author.id].coins + coinAmt
    };
  fs.writeFile("./coins.json", JSON.stringify(coins), (err) => {
    if (err) console.log(err)
  });
  let coinEmbed = new Discord.RichEmbed()
  .setAuthor(message.author.username)
  .setColor("#4286f4")
  .addField("💰", `${coinAmt} coins added!`);

  message.channel.send(coinEmbed).then(msg => {msg.delete(5000)});
  }

  let xpAdd = Math.floor(Math.random() * 7) + 8;
  console.log(xpAdd);

  if(!xp[message.author.id]){
    xp[message.author.id] = {
      xp: 0,
      level: 1
    };
  }


  let curxp = xp[message.author.id].xp;
  let curlvl = xp[message.author.id].level;
  let nxtLvl = xp[message.author.id].level * 100;
  xp[message.author.id].xp =  curxp + xpAdd;
  if(nxtLvl <= xp[message.author.id].xp){
    xp[message.author.id].level = curlvl + 1;
    let lvlup = new Discord.RichEmbed()
    .setTitle("Level Up!")
    .setColor(purple)
    .addField("New Level", curlvl + 1);

    message.channel.send(lvlup).then(msg => {msg.delete(5000)});
  }
  fs.writeFile("./xp.json", JSON.stringify(xp), (err) => {
    if(err) console.log(err)
  });
  let prefix = prefixes[message.guild.id].prefixes;
  if(!message.content.startsWith(prefix)) return;
  if(cooldown.has(message.author.id)){
    message.delete();
    return message.reply("You have to wait 3 second between commands.")
  }
  //if (!message.member.hasPermission("ADMINISTRATOR")){
    cooldown.add(message.author.id);
  // }


  let messageArray = message.content.split(" ");
  let cmd = messageArray[0];
  let args = messageArray.slice(1);

  let commandfile = bot.commands.get(cmd.slice(prefix.length));
  if(commandfile) commandfile.run(bot,message,args);

  setTimeout(() => {
    cooldown.delete(message.author.id)
  }, cdseconds * 1000)

   if (cmd === `${prefix}help`) {
      const embed = new Discord.RichEmbed(0)
      .setColor("#4286f4")
      .setTitle("Command List:")
      .addField("!help", "Will give the current command list.")
      .addField("!warnlevel (player)", "This command will found the selected user and show how many time he/she has been warns.")
      .addField("!warn (player) (reason)", "warn player.")
      .addField("!kick (player reason)", "kick player.")
      .addField("!ban (player) (reason)", "ban player." )
      .addField("!serverinfo", "server info.")
      .addField("!botinfo", "bot info.")
      .addField("!level", "check your own level.")
      .addField("!doggo", "dog. :dog:")
      .addField("!clear (How many)", "clear messages")
      .addField("!say (message)", "found out!")
      .addField("!coins", "check your bounty :D!")
      .addField("!pay (User) (How much)", "pay someone.")
      .addField("!8ball (question)", "answer your question! *please add ? after question(no space)")
      .addField("Hey!(not a command)", "warn a user before do !warnlevel !")
      .addField("Hey!#2(not a command)", "create a channel call (reports , incidents , welcome_leave) so we can sent log.")
      message.channel.send({embed})
   }

   if(cmd === `${prefix}kick`){

      //!kick @Tanister askin for it

      let kUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
      if(!kUser) return message.channel.send("Can't find user!");
      let kReason = args.join(" ").slice(22);
      if(!message.member.hasPermission("MANAGE_MESSAGES")) return message.channel.send("No can do pal!");
      if(kUser.hasPermission("MANAGE_MESSAGES")) return message.channel.send("That person can't be kicked!");

      let kickEmbed = new Discord.RichEmbed()
      .setDescription("~Kick~")
      .setColor("#f44242")
      .addField("Kicked User", `${kUser} with ID ${kUser.id}`)
      .addField("Kicked By", `<@${message.author.id}> with ID ${message.author.id}`)
      .addField("Time", message.createdAt)
      .addField("Reason", kReason);

      let kickChannel = message.guild.channels.find(`name`, "incidents")
      if(!kickChannel) return message.channel.send("Can't find incidents channel.");

      message.guild.member(kUser).kick(kReason)
      kickChannel.send(kickEmbed);

      return;
    }

    if(cmd === `${prefix}ban`){

      let bUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
      if(!bUser) return message.channel.send("Can't find user!");
      let bReason = args.join(" ").slice(22);
      if(!message.member.hasPermission("MANAGE_MEMBERS")) return message.channel.send("No can do pal!");
      if(bUser.hasPermission("MANAGE_MESSAGES")) return message.channel.send("That person can't be Banned!");

      let banEmbed = new Discord.RichEmbed()
      .setDescription("~Ban~")
      .setColor("#f44242")
      .addField("Banned User", `${bUser} with ID ${bUser.id}`)
      .addField("Banned By", `<@${message.author.id}> with ID ${message.author.id}`)
      .addField("Banned In", message.channel)
      .addField("Time", message.createdAt)
      .addField("Reason", bReason);

      let incidentchannel = message.guild.channels.find(`name`, "incidents")
      if(!incidentchannel) return message.channel.send("Can't find incidents channel.");

      message.guild.member(bUser).ban(bReason);
      incidentchannel.send(banEmbed);


      return;
    }

    if(cmd === `${prefix}report`){

      //!report @ned this is the reason

      let rUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
      if(!rUser) return message.channel.send("Couldn't find user.");
      let reason = args.join(" ").slice(22);

      let reportEmbed = new Discord.RichEmbed()
      .setDescription("Reports")
      .setColor("#f44141")
      .addField("Reported User", `${rUser} with ID: ${rUser.id}`)
      .addField("Reported By", `${message.author} with ID: ${message.author.id}`)
      .addField("Channel", message.channel)
      .addField("Time", message.createdAt)
      .addField("Reason", reason);

      let reportschannel = message.guild.channels.find(`name`, "reports");
      if(!reportschannel) return message.channel.send("Couldn't find reports channel.");


      message.delete().catch(O_o=>{});
      reportschannel.send(reportEmbed);

      return;
    }





    if(cmd === `${prefix}serverinfo`){

      let sicon = message.guild.iconURL;
      let serverembed = new Discord.RichEmbed()
      .setDescription("Server Information")
      .setColor("#4274f4")
      .setThumbnail(sicon)
      .addField("Server Name", message.guild.name)
      .addField("Create On", message.guild.createdAt)
      .addField("You Joined", message.member.joinedAt)
      .addField("Total Members", message.guild.memberCount);

      return message.channel.send(serverembed);
    }



    if(cmd === `${prefix}botinfo`){

      let bicon = bot.user.displayAvatarURL;
      let botembed = new Discord.RichEmbed()
      .setDescription("Bot Information")
      .setColor("#4274f4")
      .setThumbnail(bicon)
      .addField("Bot Name", bot.user.username)
      .addField("Create On", bot.user.createdAt);

      return message.channel.send(botembed);
    }

});

bot.login(process.env.BOT_TOKEN);
