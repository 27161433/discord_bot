const {
    Collection,
    MessageEmbed,
    MessageActionRow,
    MessageSelectMenu
} = require("discord.js");
const config = require("./config.json");
const backup = require("discord-backup");

const f = require("./functions.js");
const fs = require("fs");
const AsciiTable = require("ascii-table");

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const guild_channel = require("./path/system_log/guild_channel.json");
const {
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
    AudioPlayerStatus,
    entersState,
    StreamType
} = require('@discordjs/voice');

const xp = require('./path/user_log/xp.json');
/*
xp.forEach(i => {
    i.mail = [];
    if (!i.set) i.set = {};
    if (!i.gf) i.gf = [];
    if (i.story === 0) delete i.story;
    if (i.rank) delete i.rank;
    if (i.set.gt_style) delete i.set.gt_style;
    if (i.set.gt_check) delete i.set.gt_check;
    if (i.set.txt_permission === 1) delete i.set.txt_permission;
    if (i.set.txt_permission === 0) i.set.reply_permission === true;
    if (i.set.txt_reply_mode === 2) delete i.set.txt_reply_mode;
    if (i.sign_in) i.sign_in = {
        si: 0,
        si_day: 0
    }

})
fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
    if (err) console.log(err);
});
*/

//const hub = require("./functions.js");
//const fs = require("fs");

//環境變數
//export PKG_CONFIG_PATH=$PKG_CONFIG_PATH:/usr/lib/arm-linux-gnueabihf/pkgconfig/

module.exports = {
    lin: (client, dev) => {
        client.commands = new Collection();
        client.functions = new Collection();
        client.user_list = {};
        client.music = [];
        client.wish = [];
        const slash_commands = [];

        f.forEach(fun => {
            client.functions.set(fun.name, fun);
        });

        let table = new AsciiTable("Commands");
        table.setHeading("Command", "Load status");

        fs.readdirSync("./commands/").forEach(dir => {
            const commands = fs.readdirSync(`./commands/${dir}/`).filter(file => file.endsWith(".js"));

            for (let file of commands) {
                let pull = require(`./commands/${dir}/${file}`);

                if (pull.data) {
                    //client.commands.set(pull.name, pull);

                    slash_commands.push(pull.data.toJSON());
                    client.commands.set(pull.data.name, pull);
                    table.addRow(file, '\x1b[32mOK\x1b[30m✔✔✔✔✔✔✔✔✔✔✔✔✔✔\x1b[0m');
                } else {
                    table.addRow(file, `\x1b[31mERR\x1b[30m❌❌❌❌❌❌❌❌❌❌❌❌❌❌\x1b[0m`);
                    continue;
                }

                //if (pull.aliases && Array.isArray(pull.aliases)) pull.aliases.forEach(alias => client.aliases.set(alias, pull.name));
            }
        });

        let rest;

        if (dev) rest = new REST({ version: '9' }).setToken(config.asup_00);
        else rest = new REST({ version: '9' }).setToken(config.lintoken);

        (async () => {
            try {
                let clientId = config.clientId
                if (dev) clientId = config.dev_clientId
                await rest.put(
                    Routes.applicationGuildCommands(clientId, config.guildId),
                    { body: slash_commands },
                );
                console.log('Successfully registered application commands.');
            } catch (error) {
                console.error(error);
            }
        })();

        console.log(table.toString());

        client.once("ready", async () => {

            console.log(`${client.user.username} 已上線 ${client.guilds.cache.size} 個伺服器`);
            client.user.setPresence({
                status: 'online',
                activities: [{
                    name: '鳴鈴の窩',
                    type: 'WATCHING'
                }]
            });

            /*
                        fs.readFile('./functions.js', 'utf-8', (err, data) => {
                            console.log(data);
                        });
            */
            //client.messages.cache.get('829351976377778238')
            //console.log(client.channels.cache.get(guildinfo.channels.joinchannel));

            client.functions.get("timeout").run(client, dev); //處理所有超時

            client.functions.get("initialization").run(client, dev); //紀錄初始化系統

        });



        client.on('interactionCreate', async interaction => {

            //if (!interaction.isCommand()) return;

            if (interaction.commandName === 'join') return client.functions.get("cmds").run(client, interaction);

            if (interaction.channel === interaction.guild.channels.cache.find(c => c.id === guild_channel.gate_channel.id)) return await interaction.reply({ content: '⚠ 無法於群規中使用任何指令', ephemeral: true });

            try {
                client.functions.get("music_player_button").run(client, interaction);
            } catch (err) {
                const embed = new MessageEmbed()
                    .setTitle('指令動作未完成')
                    .addField('錯誤代碼', `${err}`)
                    .addField('錯誤功能', `music_player_button`)
                    .setColor("RED");
                console.log(err);
                return client.channels.cache.get(guild_channel.lin_log_channel.id).send({ embeds: [embed] });
            }

            //指令系統
            client.functions.get("cmds").run(client, interaction);

        });

        //成員流動紀錄
        client.on('guildMemberRemove', member => {
            var memberCount = client.guilds.cache.get(member.guild.id).memberCount;
            client.channels.cache.get(guild_channel.join_leave_log_channel.id).send(`${member.user.username} 離開了${member.guild.name} \n現在 ${member.guild.name} 只剩下 ${memberCount} 位成員了`);
        });
        //以上

        client.on('guildMemberAdd', member => {

            client.functions.get("memberadd").run(member);

        });


        process.on('unhandledRejection', error => {
            if (error == 'HTTPError: Response code 403 (Forbidden)') {
                console.log('HTTPError: Response code 403 (Forbidden)');
            } else console.error('Uncaught Promise Rejection', error);
            const embed = new MessageEmbed()
                .setTitle('指令動作未完成')
                .addField('錯誤代碼', `${error}`)
                .setColor("RED");

            if (error == 'HTTPError: Response code 403 (Forbidden)') return;
            return client.channels.cache.get(guild_channel.lin_log_channel.id).send({ embeds: [embed] });
        });

        client.on("messageCreate", async message => {

            if (!message.guild) return;

            client.functions.get("xpcard").run(message, client);

            if (message.author.bot) return;

            try {
                client.functions.get("auto_msg").run(message);
            } catch (err) {
                console.log(err);
                return client.channels.cache.get(guild_channel.lin_log_channel.id).send({ embeds: [err_embed(err, '自動打雜系統')] });
            }

            //等級計算系統
            try {
                client.functions.get("exp").run(message);
            } catch (err) {
                console.log(err);
                return client.channels.cache.get(guild_channel.lin_log_channel.id).send({ embeds: [err_embed(err, '等級計算系統')] });
            }

            //發圖獎勵系統
            try {
                client.functions.get("reward").run(message);
            } catch (err) {
                console.log(err);
                return client.channels.cache.get(guild_channel.lin_log_channel.id).send({ embeds: [err_embed(err, '發圖獎勵系統')] });
            }

            //禁言系統
            try {
                client.functions.get("ban").run(message);
            } catch (err) {
                console.log(err);
                return client.channels.cache.get(guild_channel.lin_log_channel.id).send({ embeds: [err_embed(err, '禁言系統')] });
            }

            //訊息活躍度紀錄系統
            try {
                client.functions.get("msglog").run(message);
            } catch (err) {
                console.log(err);
                return client.channels.cache.get(guild_channel.lin_log_channel.id).send({ embeds: [err_embed(err, '訊息活躍度紀錄系統')] });
            }

            //觸發詞回覆系統
            try {
                client.functions.get("txtmsg").run(message, client, dev);
            } catch (err) {
                console.log(err);
                return client.channels.cache.get(guild_channel.lin_log_channel.id).send({ embeds: [err_embed(err, '觸發詞回覆系統')] });
            }

            //未讀信件提醒系統
            try {
                client.functions.get("mail_msg").run(message, client, dev);
            } catch (err) {
                console.log(err);
                return client.channels.cache.get(guild_channel.lin_log_channel.id).send({ embeds: [err_embed(err, '未讀信件提醒系統')] });
            }

            function err_embed(err, func) {
                const useravatarurl = message.author.displayAvatarURL({
                    format: 'png',
                    dynamic: true,
                    size: 4096
                });
                const embed = new MessageEmbed()
                    .setTitle('⚠ERROR')
                    .setDescription(`使用者: ${message.author.toString()}\n\n錯誤碼: ${err}`)
                    .setThumbnail(useravatarurl)
                    .addField('錯誤功能', func)
                    .addField('觸發頻道位置', `${message.channel.toString()}`)
                    .setColor("RED");
                return embed;
            }

        });

        client.on('messageReactionAdd', async (reaction, user) => {

            if (user.bot) return;
            // When we receive a reaction we check if the reaction is partial or not
            if (reaction.partial) {
                // If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
                try {
                    await reaction.fetch();
                } catch (error) {
                    console.error('Something went wrong when fetching the message: ', error);
                    // Return as `reaction.message.author` may be undefined/null
                    return;
                }
            }

            //簽到系統
            client.functions.get("sign_in").run(reaction, user);

            //身分組分配系統
            client.functions.get("gate_join").run(reaction, user);

            /*
            console.log(reaction._emoji.name);
            // Now the message has been cached and is fully available
            console.log(`${reaction.message.author}'s message "${reaction.message.content}" gained a reaction!`);
            // The reaction is now also fully available and the properties will be reflected accurately:
            console.log(`${reaction.count} user(s) have given the same reaction to this message!`);
            */
        });

        client.on('messageReactionRemove', async (reaction, user) => {

            if (user.bot) return;
            client.functions.get("gate_leave").run(reaction, user);

        });


        client.on('voiceStateUpdate', (oldState, newState) => {

            //語音頻道活躍度檢測系統
            try {
                client.functions.get("voice_activity").run(newState, oldState);
            } catch (err) {
                console.log(err);
                console.log(newState);
                console.log(oldState);
                return client.channels.cache.get(guild_channel.lin_log_channel.id).send({ embeds: [err_embed(err, '語音頻道活躍度檢測系統')] });
            }


            function err_embed(err, func) {
                const useravatarurl = newState.member.user.displayAvatarURL({
                    format: 'png',
                    dynamic: true,
                    size: 4096
                });
                const embed = new MessageEmbed()
                    .setTitle('⚠ERROR')
                    .setDescription(`使用者: ${newState.member.user.toString()}\n\n錯誤碼: ${err}`)
                    .setThumbnail(useravatarurl)
                    .addField('錯誤功能', func)
                    .addField('舊頻道', `<#${oldState.channelId}>`)
                    .addField('新頻道', `<#${newState.channelId}>`)
                    .setColor("RED");
                return embed;
            }



        });

        if (dev) client.login(config.asup_00);
        else client.login(config.lintoken);
    },

    bak: (client) => {
        client.on("ready", () => {

            console.log(`${client.user.username} 已上線 ${client.guilds.cache.size} 個伺服器`);
            client.user.setPresence({
                status: 'online',
                activities: [{
                    name: '鳴鈴の窩',
                    type: 'WATCHING'
                }]
            });

        });

        //群組備份系統
        let baktimeout = 0;
        client.on("messageCreate", async message => {



            if (message.author.bot) return;
            if (!message.guild) return;
            if (baktimeout === 1) return;

            const linchannel = message.guild.channels.cache.find(c => c.name === "💫活躍度");

            setInterval(async () => {
                const d = new Date

                if (d.getHours() === 4 && d.getMinutes() === 0) {

                    backup.setStorageFolder(__dirname + "/backups/");
                    await backup.create(message.guild, {
                        jsonBeautify: true,
                        maxMessagesPerChannel: 300
                    }).then((backupData) => {
                        console.log(backupData.id); // NSJH2
                    });

                    const embed = new MessageEmbed()
                        .setColor('#298fff')
                        .setDescription(`本日訊息已備份`);

                    linchannel.send({ embeds: [embed] });
                    console.log('備份成功');
                }
            }, 60000);
            baktimeout = 1;
        });
        //以上

        client.login(config.baktoken);
    },

    online_check: (client) => {
        client.on("ready", () => {

            console.log(`${client.user.username} 已上線 ${client.guilds.cache.size} 個伺服器`);

            client.user.setPresence({
                status: 'online',
                activities: [{
                    name: '鳴鈴の窩',
                    type: 'WATCHING'
                }]
            });

        });

        /*
        client.on('presenceUpdate', (oldPresence, newPresence) => {
            let member = newPresence.member;
            // User id of the user you're tracking status.
            if (member.id === '725985700130062369' && oldPresence.status !== newPresence.status) {
                if (newPresence.status === "offline") {
                    client.channels.cache.get('725985488711712772').send('小鈴本體可能因問題或更新中暫時下線 \n正在重啟中... \n@everyone');
                    const spawn = require('child_process').spawn,
                        ls = spawn('lin_start.bat', ['/c', 'my.bat']);
        
                    ls.stdout.on('data', function(data) {
                        console.log('lin: ' + data);
                    });
                    ls.stderr.on('data', function(data) {
                        console.log('lin: ' + data);
                    });
                    ls.on('exit', function(code) {
                        console.log('lin child process exited with code ' + code);
                    });
                } else if (newPresence.status === "online") {
                    client.channels.cache.get('725985488711712772').send('小鈴本體重啟完成 \n@everyone');
                }
            }
        
            if (member.id === '742741893263392780' && oldPresence.status !== newPresence.status) {
                if (newPresence.status === "offline") {
                    client.channels.cache.get('725985488711712772').send('備份機構可能因問題或更新中暫時下線 \n正在重啟中... \n@everyone');
                    const spawn = require('child_process').spawn,
                        ls = spawn('bak_start.bat', ['/c', 'my.bat']);
        
                    ls.stdout.on('data', function(data) {
                        console.log('bak: ' + data);
                    });
                    ls.stderr.on('data', function(data) {
                        console.log('bak: ' + data);
                    });
                    ls.on('exit', function(code) {
                        console.log('bak child process exited with code ' + code);
                    });
                } else if (newPresence.status === "online") {
                    client.channels.cache.get('725985488711712772').send('備份機構重啟完成 \n@everyone');
                }
            }
        
            if (member.id === '743361367125524490' && oldPresence.status !== newPresence.status) {
                if (newPresence.status === "offline") {
                    client.channels.cache.get('725985488711712772').send('圖片生產器可能因問題或更新中暫時下線 \n正在重啟中... \n@everyone');
                    const spawn = require('child_process').spawn,
                        ls = spawn('canvas_start.bat', ['/c', 'my.bat']);
        
                    ls.stdout.on('data', function(data) {
                        console.log('canvas: ' + data);
                    });
                    ls.stderr.on('data', function(data) {
                        console.log('canvas: ' + data);
                    });
                    ls.on('exit', function(code) {
                        console.log('canvas child process exited with code ' + code);
                    });
                } else if (newPresence.status === "online") {
                    client.channels.cache.get('725985488711712772').send('圖片生產器重啟完成 \n@everyone');
                }
            }
        
            if (member.id === '731536001591279617' && oldPresence.status !== newPresence.status) {
                if (newPresence.status === "offline") {
                    client.channels.cache.get('725985488711712772').send('熒🎶可能因問題或更新中暫時下線 \n正在重啟中... \n@everyone');
                    const spawn = require('child_process').spawn,
                        ls = spawn('asup_00_start.bat', ['/c', 'my.bat']);
        
                    ls.stdout.on('data', function(data) {
                        console.log('canvas: ' + data);
                    });
                    ls.stderr.on('data', function(data) {
                        console.log('canvas: ' + data);
                    });
                    ls.on('exit', function(code) {
                        console.log('canvas child process exited with code ' + code);
                    });
                } else if (newPresence.status === "online") {
                    client.channels.cache.get('725985488711712772').send('熒🎶重啟完成 \n@everyone');
                }
            }
        
        
        });
        */
        client.login(config.onlinechecktoken);

    },

    //楓葉
    sup_01: (client, dev) => {
        client.on("ready", () => {

            console.log(`${client.user.username} 已上線 ${client.guilds.cache.size} 個伺服器`);
            client.user.setPresence({
                status: 'online',
                activities: [{
                    name: '鳴鈴の窩',
                    type: 'WATCHING'
                }]
            });

        });

        if (dev) client.login(config.lintoken);
        else client.login(config.asup_00);
    }
}