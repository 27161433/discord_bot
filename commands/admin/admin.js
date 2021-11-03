const { SlashCommandBuilder } = require('@discordjs/builders');
const {
    MessageActionRow,
    MessageSelectMenu,
    MessageEmbed,
    MessageButton,
    MessageAttachment

} = require('discord.js');
const ban = require('../../path/user_log/ban.json');
const fs = require("fs");
const guild_channel = require("../../path/system_log/guild_channel.json");
const mail_txt = require('../../path/system_log/mail.json');
const xp = require('../../path/user_log/xp.json');
const guildlog = require("../../path/system_log/guildlog.json");
const { dev } = require("../../config.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('管理員選單')
        .setDefaultPermission(!dev)
        .addSubcommand(subcommand =>
            subcommand.setName('一般選單')
                .setDescription('一般選單')
                .addStringOption(option =>
                    option.setName('選項')
                        .setDescription('管理員選單')
                        .setRequired(true)
                        .addChoice('🔹 發送全服信件', '發送全服信件')
                        .addChoice('🔹 查看/解除正在被禁言的用戶', '解除正在被禁言的用戶')
                        .addChoice('🔹 重啟進程(熱重啟)', '重啟進程')
                        .addChoice('🔹 刪除100則訊息', '刪除訊息')
                        .addChoice('🔹 建立自治區邀請碼', '建立自治區邀請碼')
                        .addChoice('🔹 手動發送每日圖', '手動發送每日圖')
                        .addChoice('🔹 全員簽到', '全員簽到')
                )
        ),
    async run(client, interaction) {

        if (!interaction.member.roles.cache.some(role => role.name === '管理員')) return await interaction.reply('管理員選單僅限管理員可用');

        const subcommand = interaction.options.getSubcommand();


        if (subcommand === '一般選單') {
            const string = interaction.options.getString('選項');
            if (string === '發送全服信件') {

                const embed = new MessageEmbed()
                    .setTitle('發送全服信件')
                    .setDescription('▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n1️⃣請輸入信件標題')
                    .setColor('BLUE');

                let mail_cache = {};
                let n = 0;

                await interaction.reply({ embeds: [embed], ephemeral: true });
                client.user_list[interaction.user.id] = true;
                send_mail_list(n, mail_cache);
            } else if (string === '解除正在被禁言的用戶') {

                let msg = '目前沒有被禁言的用戶'
                let row_options = []

                ban.forEach((m, i) => {
                    const d = new Date(m.time);
                    const dformat = [
                        d.getFullYear().toString().padStart(4, '0'),
                        (d.getMonth() + 1).toString().padStart(2, '0'),
                        d.getDate().toString().padStart(2, '0')
                    ].join('/') + ' ' + [
                        d.getHours().toString().padStart(2, '0'),
                        d.getMinutes().toString().padStart(2, '0'),
                        d.getSeconds().toString().padStart(2, '0')
                    ].join(':');

                    if (i === 0) msg = '--------------------\n';
                    msg += `<@${m.uid}>\n禁言時間: ${dformat}\n懲處時間: 1小時\n--------------------\n`

                    let user = interaction.guild.members.cache.find(member => member.user.id === m.uid);

                    row_options.push({
                        label: user.user.username,
                        description: `禁言時間: ${dformat}`,
                        value: m.uid,
                    });
                });


                let embed = new MessageEmbed()
                    .setTitle('正在被禁言的用戶')
                    .setDescription(msg)
                    .setColor('BLUE');

                let row = [];

                if (msg !== '目前沒有被禁言的用戶') row = [
                    new MessageActionRow()
                        .addComponents(
                            new MessageSelectMenu()
                                .setCustomId('解除禁言')
                                .setPlaceholder('選擇你想解除禁言的對象(可多選)')
                                .setMinValues(1)
                                .setMaxValues(row_options.length)
                                .addOptions(row_options),
                        )
                ]

                await interaction.reply({ embeds: [embed], components: row, ephemeral: true });

                const filter = i => i.customId === '解除禁言' && i.user.id === interaction.user.id;
                const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

                collector.on('collect', async i => {
                    if (i.customId === '解除禁言') {

                        i.values.forEach(value => {

                            let b = undefined;

                            for (let o = 0; o < ban.length; o++) {
                                if (ban[o].uid === value) {
                                    b = { id: ban[o].uid, index: o }
                                    break;
                                }
                            }

                            if (b) {
                                let member = interaction.guild.members.cache.find(member => member.user.id === b.id);
                                const useravatarurl = member.user.displayAvatarURL({
                                    format: 'png',
                                    dynamic: true,
                                    size: 4096
                                });

                                const roleban = member.guild.roles.cache.find(x => x.name === '禁言');
                                member.roles.remove(roleban);
                                const embed0 = new MessageEmbed()
                                    .setTitle(`禁言解除通知`)
                                    .setDescription(`<@${member.user.id}>`)
                                    .addField('解除者', `<@${interaction.user.id}>`)
                                    .setThumbnail(useravatarurl)
                                    //.setDescription(`<@${member.user.id}>的禁言懲罰已被<@${interaction.user.id}>解除`)
                                    .setColor('GREEN');

                                client.channels.cache.get(guild_channel.lin_log_channel.id).send({ embeds: [embed0] });
                                ban.splice(b.index, 1);
                            }

                        })

                        fs.writeFile("./path/user_log/ban.json", JSON.stringify(ban, null, 4), (err) => {
                            if (err) console.log(err)
                        });

                        msg = '目前沒有被禁言的用戶'

                        ban.forEach((m, i) => {
                            const d = new Date(m.time);
                            const dformat = [
                                d.getFullYear().toString().padStart(4, '0'),
                                (d.getMonth() + 1).toString().padStart(2, '0'),
                                d.getDate().toString().padStart(2, '0')
                            ].join('/') + ' ' + [
                                d.getHours().toString().padStart(2, '0'),
                                d.getMinutes().toString().padStart(2, '0'),
                                d.getSeconds().toString().padStart(2, '0')
                            ].join(':');

                            if (i === 0) msg = '--------------------\n';
                            msg += `<@${m.uid}>\n禁言時間: ${dformat}\n懲處時間: 1小時\n--------------------\n`

                            let user = interaction.guild.members.cache.find(member => member.user.id === m.uid);

                            row_options.push({
                                label: user.user.username,
                                description: `禁言時間: ${dformat}`,
                                value: m.uid,
                            });
                        });

                        embed = new MessageEmbed()
                            .setTitle('正在被禁言的用戶')
                            .setDescription(msg)
                            .setColor('BLUE');

                        await i.update({ embeds: [embed], components: [], ephemeral: true });

                        await interaction.followUp({ content: '✅成功', ephemeral: true });
                    }
                });

                interaction.client.functions.get("collector_end").run(collector, interaction, embed);

            } else if (string === '重啟進程') {
                await interaction.reply({ content: '✅成功', ephemeral: true });

            } else if (string === '刪除訊息') {
                const channel = client.channels.cache.get(interaction.channelId);
                channel.bulkDelete(100).catch(console.error());

                await interaction.reply({ content: '✅成功', ephemeral: true });
            } else if (string === '建立自治區邀請碼') {

                let str = "",
                    arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

                for (let i = 0; i < 10; i++) {
                    let r = Math.round(Math.random() * (arr.length - 1));
                    str += arr[r];
                }

                guildlog.join_key3 = str;

                fs.writeFile("./path/system_log/guildlog.json", JSON.stringify(guildlog, null, 4), (err) => {
                    if (err) console.log(err)
                });

                await interaction.reply({ content: `✅成功\n邀請碼: ${guildlog.join_key3}\n邀請碼於10分鐘後失效`, ephemeral: true });

                setTimeout(() => {
                    guildlog.join_key3 = 'sdhjfkhdfkghsdkgfhajsdhgkjfahgsjdkaghkjdhgfjkagyfiohjewibfhulsdhbf';
                    fs.writeFile("./path/system_log/guildlog.json", JSON.stringify(guildlog, null, 4), (err) => {
                        if (err) console.log(err)
                    });
                }, 600000)
            } else if (string === '手動發送每日圖') {
                client.functions.get("dayphoto").run(client, interaction);
                await interaction.reply({ content: `✅成功`, ephemeral: true });
            } else if (string === '全員簽到') {

                xp.forEach(m => {
                    m.sign_in.si = true;
                    m.sign_in.si_day++;
                });
                fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                    if (err) console.log(err)
                });
                await interaction.reply({ content: `✅成功`, ephemeral: true });
            }
        }

        function send_mail_list(n, mail_cache) {
            const filter = m => m.author.id === interaction.user.id;
            const func = {
                0: async (message) => {
                    if (!message.content) {
                        const embed = new MessageEmbed()
                            .setTitle(`發送全服信件`)
                            .setDescription(`▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n⚠沒有找到標題, 請重新輸入\n輸入 **x** 可取消`)
                            .setColor("YELLOW");
                        n--;
                        message.delete();
                        return await interaction.editReply({ embeds: [embed], ephemeral: true });
                    }
                    mail_cache.title = message.content;

                    const embed = new MessageEmbed()
                        .setTitle(mail_cache.title)
                        .setDescription(`▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n2️⃣請輸入信件內文\n輸入 **x** 可取消`)
                        .setColor("AQUA");

                    message.delete();
                    await interaction.editReply({ embeds: [embed], ephemeral: true });
                },
                1: async (message) => {

                    if (!message.content) {
                        const embed = new MessageEmbed()
                            .setTitle(mail_cache.title)
                            .setDescription(`▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n⚠沒有找到內文, 請重新輸入\n輸入 **x** 可取消`)
                            .setColor("YELLOW");
                        n--;
                        message.delete();
                        return await interaction.editReply({ embeds: [embed], ephemeral: true });
                    }
                    mail_cache.txt = message.content;

                    const embed = new MessageEmbed()
                        .setTitle(mail_cache.title)
                        .setDescription(`▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n${mail_cache.txt}\n\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n3️⃣是否為信件添加鳴鈴幣附件(輸入0不添加)\n輸入 **x** 可取消`)
                        .setColor("AQUA");

                    message.delete();
                    await interaction.editReply({ embeds: [embed], ephemeral: true });

                },
                2: async (message) => {
                    let coin = parseInt(message.content);
                    if (!message.content || isNaN(coin)) {
                        const embed = new MessageEmbed()
                            .setTitle(mail_cache.title)
                            .setDescription(`▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n${mail_cache.txt}\n\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n⚠沒有找到數字, 請重新輸入\n輸入 **x** 可取消`)
                            .setColor("YELLOW");
                        n--;
                        message.delete();
                        send_mail_list(n, mail_cache);
                        return await interaction.editReply({ embeds: [embed], ephemeral: true });
                    }
                    mail_cache.coin = coin;

                    let msg = '';
                    if (mail_cache.coin) msg = `\n\n附件:\n鳴鈴幣: ${coin}`;

                    const embed = new MessageEmbed()
                        .setTitle(mail_cache.title)
                        .setDescription(`▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n${mail_cache.txt}${msg}\n\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n以上為範例\n確認無誤即可發送`)
                        .setColor("WHITE");

                    const row = new MessageActionRow()
                        .addComponents(
                            new MessageButton()
                                .setCustomId('確認發送')
                                .setLabel('確認發送')
                                .setEmoji('✅')
                                .setStyle('PRIMARY'),
                        )
                        .addComponents(
                            new MessageButton()
                                .setCustomId('重新編輯')
                                .setLabel('重新編輯')
                                .setEmoji('✏')
                                .setStyle('PRIMARY'),
                        )
                        .addComponents(
                            new MessageButton()
                                .setCustomId('取消發送')
                                .setLabel('取消發送')
                                .setEmoji('❌')
                                .setStyle('PRIMARY'),
                        );

                    message.delete();
                    await interaction.editReply({ embeds: [embed], ephemeral: true, components: [row] });
                    func.button();
                },
                button: async () => {
                    const filter = i => {
                        return ['確認發送', '重新編輯', '取消發送'].includes(i.customId) && i.user.id === interaction.user.id;
                    };

                    interaction.channel.awaitMessageComponent({ filter, time: 30000 })
                        .then(async i => {

                            if (i.customId === '確認發送') {

                                let msg = '';
                                if (mail_cache.coin) msg = `\n\n附件:\n鳴鈴幣: ${mail_cache.coin}`;

                                const embed = new MessageEmbed()
                                    .setTitle(mail_cache.title)
                                    .setDescription(`▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n${mail_cache.txt}${msg}\n\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n✅發送成功`)
                                    .setColor("GREEN");

                                mail_cache.id = interaction.user.id;

                                mail_txt.push(mail_cache);
                                xp.forEach(m => m.mail.push((mail_txt.length - 1).toString()));

                                fs.writeFile("./path/system_log/mail.json", JSON.stringify(mail_txt, null, 4), err => {
                                    if (err) console.error(err)
                                });
                                fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), err => {
                                    if (err) console.error(err)
                                });
                                await i.update({ embeds: [embed], ephemeral: true, components: [] });
                            } else if (i.customId === '重新編輯') {
                                const embed = new MessageEmbed()
                                    .setTitle('發送全服信件')
                                    .setDescription('▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n1️⃣請輸入信件標題')
                                    .setColor('BLUE');

                                n = 0;
                                client.user_list[interaction.user.id] = true;
                                await i.update({ embeds: [embed], ephemeral: true, components: [] });
                                send_mail_list(n, mail_cache);
                            } else if (i.customId === '取消發送') {
                                let msg = '';
                                if (mail_cache.coin) msg = `\n\n附件:\n鳴鈴幣: ${mail_cache.coin}`;

                                const embed = new MessageEmbed()
                                    .setTitle(mail_cache.title)
                                    .setDescription(`▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n${mail_cache.txt}${msg}\n\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n❌取消`)
                                    .setColor("RED");

                                await i.update({ embeds: [embed], ephemeral: true, components: [] });
                            }
                        })
                        .catch(async () => {
                            let msg = '';
                            if (mail_cache.coin) msg = `\n\n附件:\n鳴鈴幣: ${mail_cache.coin}`;

                            const embed = new MessageEmbed()
                                .setTitle(mail_cache.title)
                                .setDescription(`▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n${mail_cache.txt}${msg}\n\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n❌取消`)
                                .setColor("RED");

                            await interaction.editReply({ embeds: [embed], ephemeral: true, components: [] });
                        });

                }
            }

            interaction.channel.awaitMessages({ filter, max: 1, time: 300000, errors: ['time'] })
                .then(async collected => {
                    if (collected.first().content === 'x') {
                        delete client.user_list[interaction.user.id];
                        const embed = new MessageEmbed()
                            .setTitle(`發送全服信件`)
                            .setDescription(`❌取消`)
                            .setColor("RED");
                        await interaction.editReply({ embeds: [embed], ephemeral: true });
                    } else {
                        func[n](collected.first());
                        n++
                        if (n > 2) return delete client.user_list[interaction.user.id];
                        send_mail_list(n, mail_cache);
                    }
                })
                .catch(async () => {
                    delete client.user_list[interaction.user.id];
                    const embed = new MessageEmbed()
                        .setTitle(`發送全服信件`)
                        .setDescription(`❌取消`)
                        .setColor("RED");

                    await interaction.editReply({ embeds: [embed], ephemeral: true });
                })
        }

    },
}
