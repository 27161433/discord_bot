const { SlashCommandBuilder } = require('@discordjs/builders');
const {
    MessageActionRow,
    MessageSelectMenu,
    MessageEmbed,
    MessageButton,

} = require('discord.js');
const fs = require("fs");
const xp = require('../../path/user_log/xp.json');
const mail_txt = require('../../path/system_log/mail.json');
const { dev } = require("../../config.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mail')
        .setDefaultPermission(!dev)
        .setDescription('收件夾'),
    async run(client, interaction) {

        let newxp = xp.find(m => m.id === interaction.user.id);

        if (!newxp.mail[0]) return await interaction.reply({ content: '你沒有任何信件', ephemeral: true });

        let row_options = [];
        let title = '▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n';

        newxp.mail.forEach(m => {
            let int = parseInt(m);
            title += `🔹 ${mail_txt[int].title}\n`;
            row_options.push({
                label: `🔹 ${mail_txt[int].title}`,
                description: `未讀`,
                value: m,
            });
        });

        const embed = new MessageEmbed()
            .setTitle(`信件一覽`)
            .setDescription(title)
            .setColor("BLUE");

        const row = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId('閱覽信件')
                    .setPlaceholder('選擇欲閱覽信件')
                    .addOptions(row_options),
            );

        const embed2 = new MessageEmbed()
            .setTitle(`信件一覽`)
            .setDescription('❌取消')
            .setColor("RED");


        await interaction.reply({ embeds: [embed], ephemeral: true, components: [row] });

        read_mail();

        function read_mail() {

            const filter = i => {
                return ['閱覽信件'].includes(i.customId) && i.user.id === interaction.user.id;
            };

            interaction.channel.awaitMessageComponent({ filter, time: 30000 })
                .then(async i => {

                    let o = parseInt(i.values[0]);
                    let msg = '';
                    if (mail_txt[o].coin) msg = `\n\n附件:\n鳴鈴幣: ${mail_txt[o].coin}\n\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\nℹ 點擊以下按鈕以領取附件`;
                    else msg = `\n\n已自動刪除信件`;

                    const embed3 = new MessageEmbed()
                        .setTitle(mail_txt[o].title)
                        .setDescription(`▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n${mail_txt[o].txt}${msg}`)
                        .setColor("BLUE");

                    if (mail_txt[o].coin) {
                        
                        const row2 = new MessageActionRow()
                            .addComponents(
                                new MessageButton()
                                    .setCustomId('領取附件')
                                    .setLabel('領取附件')
                                    .setEmoji('✉')
                                    .setStyle('PRIMARY'),
                            );

                        await i.update({ embeds: [embed3], ephemeral: true, components: [row2] });
                        att(o);
                    } else {
                        for (let index = 0; index < newxp.mail.length; index++)
                            if (newxp.mail[index] === i.values[0]) {
                                newxp.mail.splice(index, 1);
                                break;
                            }
                        fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), err => {
                            if (err) console.error(err)
                        });

                        await i.update({ embeds: [embed3], ephemeral: true, components: [] });
                    }

                })
                .catch(async () => {
                    await interaction.editReply({ embeds: [embed2], ephemeral: true, components: [] })
                });

        }

        function att(o) {
            const filter = i => {
                return ['領取附件'].includes(i.customId) && i.user.id === interaction.user.id;
            };

            interaction.channel.awaitMessageComponent({ filter, time: 30000 })
                .then(async i => {

                    const embed3 = new MessageEmbed()
                        .setTitle(mail_txt[o].title)
                        .setDescription(`▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n${mail_txt[o].txt}\n\n附件:\n鳴鈴幣: ${mail_txt[o].coin}\n\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n✅領取成功\n\n已自動刪除信件`)
                        .setColor("GREEN");

                    newxp.coin = newxp.coin + mail_txt[o].coin;

                    for (let index = 0; index < newxp.mail.length; index++)
                        if (newxp.mail[index] === o.toString()) {
                            newxp.mail.splice(index, 1);
                            break;
                        }
                    fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), err => {
                        if (err) console.error(err)
                    });

                    await i.update({ embeds: [embed3], ephemeral: true, components: [] });
                })
                .catch(async () => {
                    await interaction.editReply({ embeds: [embed2], ephemeral: true, components: [] });
                })


        }



    }
};
