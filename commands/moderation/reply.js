const fs = require('fs');
const reply_data = require('../.././path/reply_data.json');
const xp = require('../.././path/user_log/xp.json');
const {
    MessageEmbed,
    MessageActionRow,
    MessageButton,
    MessageSelectMenu
} = require("discord.js");
const { SlashCommandBuilder } = require('@discordjs/builders');
const { dev } = require("../../config.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reply')
        .setDefaultPermission(!dev)
        .setDescription('快速回應管理系統')
        .addSubcommand(subcommand =>
            subcommand.setName('增加回應')
                .setDescription('增加回應')
                .addStringOption(option =>
                    option.setName('觸發詞')
                        .setDescription('輸入你想 增加 的用來觸發快速回應的文字')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('回應詞')
                        .setDescription('輸入你想用來 回應 的文字')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('查詢與移除回應')
                .setDescription('查詢與移除回應')
                .addStringOption(option =>
                    option.setName('觸發詞')
                        .setDescription('輸入你想 查詢/移除 的用來觸發快速回應的文字(不填寫則顯示所有觸發詞)'))),
    async run(client, interaction) {

        const string = interaction.options.getSubcommand();
        const reply = interaction.options.getString('觸發詞');
        const set_reply = interaction.options.getString('回應詞');

        const useravatarurl = interaction.user.displayAvatarURL({
            format: 'png',
            dynamic: true,
            size: 4096
        });

        const channel = interaction.guild.channels.cache.find(ch => ch.id === '860792818518982667');
        let new_reply = reply_data.find(m => m.msg === reply);
        const d = new Date
        const dformat = [
            d.getFullYear().toString().padStart(4, '0'),
            (d.getMonth() + 1).toString().padStart(2, '0'),
            d.getDate().toString().padStart(2, '0')
        ].join('/') + ' ' + [
            d.getHours().toString().padStart(2, '0'),
            d.getMinutes().toString().padStart(2, '0'),
            d.getSeconds().toString().padStart(2, '0')
        ].join(':');

        if (string === '增加回應') {

            if (reply.split('').length > 2000) return await interaction.reply({ content: '超過字數上限(2000),請減少回應字數', ephemeral: true });
            let msg = '目前此詞 **沒有任何** 已添加的快速回應';
            if (new_reply) {
                msg = `目前此詞已有 **${new_reply.reply.length}** 種快速回應:\n`;
                new_reply.reply.forEach(r => {
                    if (r.rep.startsWith('https')) msg += `[🔹 連結](${r.rep})\n`
                    else msg += `🔹 ${r.rep}\n`
                });
            }
            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('確認')
                        .setLabel('確認')
                        .setEmoji('⭕')
                        .setStyle('PRIMARY'),
                )
                .addComponents(
                    new MessageButton()
                        .setCustomId('取消')
                        .setLabel('取消')
                        .setEmoji('❌')
                        .setStyle('PRIMARY'),
                );
            const embed = new MessageEmbed()
                .setTitle('是否確認增加快速回應?')
                .setDescription(`${msg}`)
                .setColor('BLUE');

            await interaction.reply({ embeds: [embed], ephemeral: false, components: [row] });

            const filter = i => {
                return ['確認', '取消'].includes(i.customId) && i.user.id === interaction.user.id;
            };

            const err_row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('取消')
                        .setLabel('取消')
                        .setEmoji('❌')
                        .setStyle('DANGER')
                        .setDisabled(true),
                );

            const ok_row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('建立成功')
                        .setLabel('建立成功')
                        .setEmoji('✅')
                        .setStyle('SUCCESS')
                        .setDisabled(true),
                );


            interaction.channel.awaitMessageComponent({ filter, time: 5000 })
                .then(async i => {
                    if (i.customId === '確認') {

                        let rep = {
                            rep: set_reply,
                            id: interaction.user.id,
                            date: dformat,
                            embed: false
                        }

                        if (!new_reply) reply_data.push({
                            msg: reply,
                            reply: [rep],
                            use: 0
                        });
                        else new_reply.reply.push(rep);
                        fs.writeFile("./path/reply_data.json", JSON.stringify(reply_data, null, 4), (err) => {
                            if (err) console.log(err);
                        });

                        if (set_reply.startsWith('https') && (set_reply.includes('jpg') || set_reply.includes('png') || set_reply.includes('gif'))) {
                            const row2 = new MessageActionRow()
                                .addComponents(
                                    new MessageButton()
                                        .setCustomId('有顯示')
                                        .setLabel('有顯示')
                                        .setEmoji('⭕')
                                        .setStyle('PRIMARY'),
                                )
                                .addComponents(
                                    new MessageButton()
                                        .setCustomId('未顯示')
                                        .setLabel('未顯示')
                                        .setEmoji('❌')
                                        .setStyle('PRIMARY'),
                                );

                            const ok_embed = new MessageEmbed()
                                .setTitle('建立完成')
                                .setDescription(`觸發詞: ${reply}\n回應詞:(底下應顯示圖片)\n\n圖片如果有顯示請點擊下方按鈕⭕\n若未顯示請點擊下方按鈕❌`)
                                .setImage(set_reply)
                                .setColor('BLUE');

                            await i.update({ embeds: [ok_embed], ephemeral: false, components: [row2] });
                            new_reply = reply_data.find(m => m.msg === reply);

                            add_reply(ok_row, i);

                        } else {
                            const ok2_embed = new MessageEmbed()
                                .setTitle('建立完成')
                                .setDescription(`觸發詞: ${reply}\n回應詞:${set_reply}`)
                                .setColor('GREEN');

                            await i.update({ embeds: [ok2_embed], ephemeral: false, components: [ok_row] });
                        }
                    }
                    else if (i.customId === '取消') await i.followUp({ embeds: [embed], ephemeral: false, components: [err_row] });
                })
                .catch(async () => {
                    await interaction.followUp({ embeds: [embed], ephemeral: false, components: [err_row] })
                });

        } else if (string === '查詢與移除回應') {

            const newxp = xp.find(u => u.id === interaction.user.id);
            if (!newxp.set) newxp.set = {};
            fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                if (err) console.log(err);
            });

            if (reply) {
                if (!new_reply) return await interaction.reply({ content: '找不到這個觸發詞', ephemeral: false });
                let msg = ''
                let row_options = []

                if (interaction.member.roles.cache.some(role => role.name === '管理員')) {
                    row_options.push({
                        label: `❗ 刪除所有`,
                        description: `可刪除該觸發詞與所有回應 請謹慎使用`,
                        value: 'all',
                    });
                }

                for (let i = 0; i < new_reply.reply.length; i++) {
                    let lbbel_msg = '';

                    if (new_reply.reply[i].rep.startsWith('https') && (new_reply.reply[i].rep.includes('jpg') || new_reply.reply[i].rep.includes('png') || new_reply.reply[i].rep.includes('gif'))) {
                        msg += `▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n🔹 回應: [連結${i}](${new_reply.reply[i].rep})\n🔹 創建人: <@${new_reply.reply[i].id}>\n🔹 創建時間: ${new_reply.reply[i].date}\n`;
                        lbbel_msg = `🔹 連結${i}`;
                    } else if (new_reply.reply[i].rep.startsWith('<:')) {
                        msg += `▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n🔹 回應: ${new_reply.reply[i].rep}(貼圖${i})\n🔹 創建人: <@${new_reply.reply[i].id}>\n🔹 創建時間: ${new_reply.reply[i].date}\n`;
                        lbbel_msg = `🔹 貼圖${i}`;
                    } else {
                        msg += `▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n🔹 回應: ${new_reply.reply[i].rep}\n🔹 創建人: <@${new_reply.reply[i].id}>\n🔹 創建時間: ${new_reply.reply[i].date}\n`;
                        lbbel_msg = `🔹 ${new_reply.reply[i].rep}`;
                    }
                    let r_xp = xp.find(m => m.id === new_reply.reply[i].id);
                    if (!r_xp.set) r_xp.set = {};

                    if (interaction.member.roles.cache.some(role => role.name === '管理員') || new_reply.reply[i].id === interaction.user.id || r_xp.set.reply_permission)
                        row_options.push({
                            label: lbbel_msg,
                            description: `創建時間: ${new_reply.reply[i].date}`,
                            value: `${new_reply.reply[i].id}<$>${new_reply.reply[i].date}`,
                        });
                }

                msg += `▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫`;

                const embed = new MessageEmbed()
                    .setTitle(`觸發詞: ${new_reply.msg}`)
                    .setDescription(`${msg}`)
                    .setColor('BLUE');

                const row = new MessageActionRow()
                    .addComponents(
                        new MessageSelectMenu()
                            .setCustomId('刪除回應')
                            .setPlaceholder('選擇你想刪除的回應(可多選)')
                            .setMinValues(1)
                            .setMaxValues(row_options.length)
                            .addOptions(row_options),
                    )

                if (row_options.length === 0) return await interaction.reply({ embeds: [embed], ephemeral: false });
                else await interaction.reply({ embeds: [embed], ephemeral: false, components: [row] });

                const filter = i => {
                    return ['刪除回應'].includes(i.customId) && i.user.id === interaction.user.id;
                };

                interaction.channel.awaitMessageComponent({ filter, time: 30000 })
                    .then(async i => {
                        if (i.values.find(v => v === 'all')) {
                            reply_data.forEach((m, index) => {
                                if (m.msg === reply) reply_data.splice(index, 1)
                            });
                            const log_embed = new MessageEmbed()
                                .setTitle(`觸發詞刪除紀錄`)
                                .setDescription(`觸發詞: ${new_reply.msg}\n刪除者: ${interaction.user.toString()}\n刪除回應: 全部`)
                                .setThumbnail(useravatarurl)
                                .setColor("RED");

                            channel.send({ embeds: [log_embed] });

                        } else {
                            i.values.forEach(async value => {

                                const args = value.split('<$>')

                                for (let index = 0; index < new_reply.reply.length; index++) {
                                    if (new_reply.reply[index].id === args[0] && new_reply.reply[index].date === args[1]) {

                                        const log_embed = new MessageEmbed()
                                            .setTitle(`回應刪除紀錄`)
                                            .setDescription(`觸發詞: ${new_reply.msg}\n刪除回應: ${new_reply.reply[index].rep}\n刪除者: ${interaction.user.toString()}\n回應創建人: <@${new_reply.reply[index].id}>\n回應創建時間: ${new_reply.reply[index].date}`)
                                            .setThumbnail(useravatarurl)
                                            .setColor("RED");

                                        channel.send({ embeds: [log_embed] });
                                        new_reply.reply.splice(index, 1);
                                        break;
                                    }
                                }
                            });
                            if (!new_reply.reply[0]) reply_data.forEach((m, index) => {
                                if (m.msg === reply) reply_data.splice(index, 1)
                            });

                        }
                        fs.writeFile("./path/reply_data.json", JSON.stringify(reply_data, null, 4), (err) => {
                            if (err) console.log(err);
                        });

                        await interaction.editReply({ embeds: [embed], ephemeral: false, components: [] });
                        const ok_embed = new MessageEmbed()
                            .setDescription(`✅刪除成功`)
                            .setColor("GREEN");

                        await interaction.followUp({ embeds: [ok_embed], ephemeral: false })

                    })
                    .catch(async () => {
                        await interaction.editReply({ embeds: [embed], ephemeral: false, components: [] });
                    });

            } else {

                let msg = '';
                let row_options = [];

                reply_data.forEach((r, i) => {
                    if (i > 9) return;
                    if (r.msg.startsWith('https') && (r.msg.includes('jpg') || r.msg.includes('png') || r.msg.includes('gif'))) msg += `🔹 [連結](${r.msg})\n`;
                    else if (r.msg.startsWith('<:') && r.msg.endsWith('>')) msg += `🔹 ${r.msg}(貼圖${i})\n`;
                    else msg += `🔹 ${r.msg}\n`;
                });

                msg += `▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n觸發詞總數: ${reply_data.length}\n第1頁/共${Math.ceil(reply_data.length / 10)}頁`;
                row_options.push({
                    label: `❌ 關閉選單`,
                    description: `如果不再繼續使用此選單建議關閉以維護BOT整體使用體驗`,
                    value: `x`,
                });

                row_options.push({
                    label: `🔸 詳細模式`,
                    description: `使選單選項變更為選擇此頁觸發詞`,
                    value: `0<$>info_mode`,
                });


                for (let i = 1; i < Math.ceil(reply_data.length / 10); i++) {
                    row_options.push({
                        label: `🔹 第${i + 1}頁`,
                        description: `跳轉到頁數 ${i + 1}`,
                        value: `${i}`,
                    });
                }

                const embed = new MessageEmbed()
                    .setTitle(`觸發詞一覽`)
                    .setDescription(msg)
                    .setColor("BLUE");

                const row = new MessageActionRow()
                    .addComponents(
                        new MessageSelectMenu()
                            .setCustomId('觸發詞一覽選單')
                            .setPlaceholder('選擇頁數')
                            .addOptions(row_options),
                    )

                await interaction.reply({ embeds: [embed], ephemeral: false, components: [row] });
                reply_info();
            }
        }

        function reply_info() {
            const filter = i => {
                return ['觸發詞一覽選單'].includes(i.customId) && i.user.id === interaction.user.id;
            };
            let msg = '';
            let row_options = [];

            row_options.push({
                label: `❌ 關閉選單`,
                description: `如果不再繼續使用此選單建議關閉以維護BOT整體使用體驗`,
                value: `x`,
            });

            interaction.channel.awaitMessageComponent({ filter, time: 45000 })
                .then(async i => {
                    const args = i.values[0].split('<$>');

                    if (i.values.find(v => v === 'x')) {
                        const embed = new MessageEmbed()
                            .setTitle(`觸發詞一覽`)
                            .setDescription('手動關閉選單')
                            .setColor("BLUE");

                        return await i.update({ embeds: [embed], ephemeral: false, components: [] });
                    } else if (i.values.find(v => v.includes('info_mode'))) {
                        let o = parseInt(args[0]);
                        info_mode_list(row_options, o, i, msg);
                    } else if (i.values.find(v => v.includes('delete_mode'))) {

                        if (args[0] === 'all') {
                            let new_r = reply_data.find(m => m.msg === args[1]);
                            let o = parseInt(args[2]);

                            reply_data.forEach((m, index) => {
                                if (m.msg === args[1]) reply_data.splice(index, 1)
                            });
                            const log_embed = new MessageEmbed()
                                .setTitle(`觸發詞刪除紀錄`)
                                .setDescription(`觸發詞: ${new_r.msg}\n刪除者: ${interaction.user.toString()}\n刪除回應: 全部`)
                                .setThumbnail(useravatarurl)
                                .setColor("RED");

                            channel.send({ embeds: [log_embed] });
                            if (o >= Math.ceil(reply_data.length / 10)) o = Math.ceil(reply_data.length / 10) - 1;
                            info_mode_list(row_options, o, i, msg);

                        } else {
                            let new_r = reply_data.find(m => m.msg === args[2]);
                            let o = parseInt(args[3]);

                            i.values.forEach(async value => {

                                const args = value.split('<$>')

                                for (let index = 0; index < new_r.reply.length; index++) {
                                    if (new_r.reply[index].id === args[0] && new_r.reply[index].date === args[1]) {

                                        const log_embed = new MessageEmbed()
                                            .setTitle(`回應刪除紀錄`)
                                            .setDescription(`觸發詞: ${new_r.msg}\n刪除回應: ${new_r.reply[index].rep}\n刪除者: ${interaction.user.toString()}\n回應創建人: <@${new_r.reply[index].id}>\n回應創建時間: ${new_r.reply[index].date}`)
                                            .setThumbnail(useravatarurl)
                                            .setColor("RED");

                                        channel.send({ embeds: [log_embed] });
                                        new_r.reply.splice(index, 1);
                                        break;
                                    }
                                }
                            });
                            if (!new_r.reply[0]) {
                                reply_data.forEach((m, index) => {
                                    if (m.msg === args[2]) reply_data.splice(index, 1)
                                });
                                if (o >= Math.ceil(reply_data.length / 10)) o = Math.ceil(reply_data.length / 10) - 1;
                                info_mode_list(row_options, o, i, msg);
                            } else rep_mode_list(row_options, args, o, i, msg);

                        }
                        fs.writeFile("./path/reply_data.json", JSON.stringify(reply_data, null, 4), (err) => {
                            if (err) console.log(err);
                        });

                        const ok_embed = new MessageEmbed()
                            .setDescription(`✅刪除成功`)
                            .setColor("GREEN");

                        await interaction.followUp({ embeds: [ok_embed], ephemeral: false })


                    } else if (i.values.find(v => v.includes('page_mode'))) {
                        let o = parseInt(args[0]);

                        reply_data.forEach((r, index) => {
                            if (index > o * 10 - 1 && index < o * 10 + 10) {
                                if (r.msg.startsWith('https') && (r.msg.includes('jpg') || r.msg.includes('png') || r.msg.includes('gif'))) msg += `🔹 [連結](${r.msg})\n`;
                                else msg += `🔹 ${r.msg}\n`;
                            }
                        });

                        msg += `▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n觸發詞總數: ${reply_data.length}\n第${o + 1}頁/共${Math.ceil(reply_data.length / 10)}頁`;

                        row_options.push({
                            label: `🔸 詳細模式`,
                            description: `使選單選項變更為選擇此頁觸發詞`,
                            value: `${o}<$>info_mode`,
                        });

                        for (let r = 1; r < Math.ceil(reply_data.length / 10); r++) {
                            if (r !== o) row_options.push({
                                label: `🔹 第${r + 1}頁`,
                                description: `跳轉到頁數 ${i + 1}`,
                                value: `${r}`,
                            });
                        }

                        const embed = new MessageEmbed()
                            .setTitle(`觸發詞一覽`)
                            .setDescription(msg)
                            .setColor("BLUE");

                        const row = new MessageActionRow()
                            .addComponents(
                                new MessageSelectMenu()
                                    .setCustomId('觸發詞一覽選單')
                                    .setPlaceholder('選擇頁數')
                                    .addOptions(row_options),
                            )

                        await i.update({ embeds: [embed], ephemeral: false, components: [row] });

                    } else if (i.values.find(v => v.includes('rep_mode'))) {
                        let o = parseInt(args[0]);
                        rep_mode_list(row_options, args, o, i, msg);
                    } else {
                        for (let o = 0; o < Math.ceil(reply_data.length / 10); o++) {
                            if (i.values[0] === `${o}`) {

                                reply_data.forEach((r, index) => {
                                    if (index > o * 10 - 1 && index < o * 10 + 10) {
                                        if (r.msg.startsWith('https') && (r.msg.includes('jpg') || r.msg.includes('png') || r.msg.includes('gif'))) msg += `🔹 [連結](${r.msg})\n`;
                                        else if (r.msg.startsWith('<:') && r.msg.endsWith('>')) msg += `🔹 ${r.msg}(貼圖${i})\n`;
                                        else msg += `🔹 ${r.msg}\n`;
                                    }
                                });

                                msg += `▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n觸發詞總數: ${reply_data.length}\n第${o + 1}頁/共${Math.ceil(reply_data.length / 10)}頁`;

                                row_options.push({
                                    label: `🔸 詳細模式`,
                                    description: `使選單選項變更為選擇此頁觸發詞`,
                                    value: `${o}<$>info_mode`,
                                });

                                for (let r = 0; r < Math.ceil(reply_data.length / 10); r++) {
                                    if (r !== o) row_options.push({
                                        label: `🔹 第${r + 1}頁`,
                                        description: `跳轉到頁數 ${i + 1}`,
                                        value: `${r}`,
                                    });
                                }

                                const embed = new MessageEmbed()
                                    .setTitle(`觸發詞一覽`)
                                    .setDescription(msg)
                                    .setColor("BLUE");

                                const row = new MessageActionRow()
                                    .addComponents(
                                        new MessageSelectMenu()
                                            .setCustomId('觸發詞一覽選單')
                                            .setPlaceholder('選擇頁數')
                                            .addOptions(row_options),
                                    )

                                await i.update({ embeds: [embed], ephemeral: false, components: [row] });
                                break;
                            }
                        }
                    }
                    reply_info();
                })
                .catch(async () => {
                    const embed = new MessageEmbed()
                        .setTitle(`觸發詞一覽`)
                        .setDescription('超時')
                        .setColor("RED");

                    await interaction.editReply({ embeds: [embed], ephemeral: false, components: [] });
                })
        }

        async function info_mode_list(row_options, o, i, msg) {
            row_options.push({
                label: `🔸 總攬模式`,
                description: `使選單選項變更為選擇頁數`,
                value: `${o}<$>page_mode`,
            });

            reply_data.forEach((r, index) => {
                if (index > o * 10 - 1 && index < o * 10 + 10) {
                    let lbbel_msg = '';
                    if (r.msg.startsWith('https') && (r.msg.includes('jpg') || r.msg.includes('png') || r.msg.includes('gif'))) {
                        msg += `🔹 [連結${index}](${r.msg})\n`;
                        lbbel_msg = `🔹 連結${index}`;
                    } else if (r.msg.startsWith('<:') && r.msg.endsWith('>')) {
                        msg += `🔹 ${r.msg}(貼圖${index})\n`;
                        lbbel_msg = `🔹 貼圖${index}`;
                    } else {
                        msg += `🔹 ${r.msg}\n`;
                        lbbel_msg = `🔹 ${r.msg}`;
                    }
                    row_options.push({
                        label: lbbel_msg,
                        description: `使用次數: ${r.use}`,
                        value: `${o}<$>${r.msg}<$>rep_mode`,
                    });
                }
            });

            const embed = new MessageEmbed()
                .setTitle(`觸發詞一覽`)
                .setDescription(msg)
                .setColor("BLUE");

            const row = new MessageActionRow()
                .addComponents(
                    new MessageSelectMenu()
                        .setCustomId('觸發詞一覽選單')
                        .setPlaceholder('選擇觸發詞')
                        .addOptions(row_options),
                )

            await i.update({ embeds: [embed], ephemeral: false, components: [row] });
        }

        async function rep_mode_list(row_options, args, o, i, msg) {
            row_options.push({
                label: `🔸 上一頁`,
                description: `回到上一頁`,
                value: `${o}<$>info_mode`,
            });

            if (interaction.member.roles.cache.some(role => role.name === '管理員')) {
                row_options.push({
                    label: `❗ 刪除所有`,
                    description: `可刪除該觸發詞與所有回應 請謹慎使用`,
                    value: `all<$>${args[1]}<$>${o}<$>delete_mode`,
                });
            }

            let new_r = reply_data.find(m => m.msg === args[1]);

            for (let i = 0; i < new_r.reply.length; i++) {
                let lbbel_msg = '';

                if (new_r.reply[i].rep.startsWith('https') && (new_r.reply[i].rep.includes('jpg') || new_r.reply[i].rep.includes('png') || new_r.reply[i].rep.includes('gif'))) {
                    msg += `▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n🔹 回應: [連結${i}](${new_r.reply[i].rep})\n🔹 創建人: <@${new_r.reply[i].id}>\n🔹 創建時間: ${new_r.reply[i].date}\n`;
                    lbbel_msg = `🔹 連結${i}`;
                } else if (new_r.reply[i].rep.startsWith('<:')) {
                    msg += `▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n🔹 回應: ${new_r.reply[i].rep}(貼圖${i})\n🔹 創建人: <@${new_r.reply[i].id}>\n🔹 創建時間: ${new_r.reply[i].date}\n`;
                    lbbel_msg = `🔹 貼圖${i}`;
                } else {
                    msg += `▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n🔹 回應: ${new_r.reply[i].rep}\n🔹 創建人: <@${new_r.reply[i].id}>\n🔹 創建時間: ${new_r.reply[i].date}\n`;
                    lbbel_msg = `🔹 ${new_r.reply[i].rep}`;
                }
                let r_xp = xp.find(m => m.id === new_r.reply[i].id);
                if (!r_xp.set) r_xp.set = {};

                if (interaction.member.roles.cache.some(role => role.name === '管理員') || new_r.reply[i].id === interaction.user.id || r_xp.set.reply_permission)
                    row_options.push({
                        label: lbbel_msg,
                        description: `創建時間: ${new_r.reply[i].date}`,
                        value: `${new_r.reply[i].id}<$>${new_r.reply[i].date}<$>${args[1]}<$>${o}<$>delete_mode`,
                    });

            }
            fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                if (err) console.log(err);
            });

            msg += `▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n於底下選單選擇你想刪除的回應(可多選)\n選項優先級: 關閉選單 > 上一頁 > 刪除所有 > 刪除指定回應 \n優先級高的優先處理\n舉例: 如果於多選選單中選了 **關閉選單** 與 **上一頁** 與 **刪除所有** 則僅會關閉選單`;

            const embed = new MessageEmbed()
                .setTitle(`觸發詞: ${args[1]}`)
                .setDescription(msg)
                .setColor("BLUE");

            const row = new MessageActionRow()
                .addComponents(
                    new MessageSelectMenu()
                        .setCustomId('觸發詞一覽選單')
                        .setPlaceholder('選擇你想刪除的回應(可多選,也可回到上一頁繼續瀏覽)')
                        .setMinValues(1)
                        .setMaxValues(row_options.length)
                        .addOptions(row_options),
                )

            await i.update({ embeds: [embed], ephemeral: false, components: [row] });

        }

        function add_reply(ok_row, i2) {
            const filter = i => {
                return ['有顯示', '未顯示'].includes(i.customId) && i.user.id === interaction.user.id;
            };
            interaction.channel.awaitMessageComponent({ filter, time: 5000 })
                .then(async i => {
                    if (i.customId === '有顯示') {
                        const ok2_embed = new MessageEmbed()
                            .setTitle('建立完成')
                            .setDescription(`觸發詞: ${reply}\n回應圖片:(如下圖)\n圖片顯示模式: embed`)
                            .setImage(set_reply)
                            .setColor('GREEN');
                        new_reply.reply.embed = true;
                        fs.writeFile("./path/reply_data.json", JSON.stringify(reply_data, null, 4), (err) => {
                            if (err) console.log(err);
                        });

                        await i.update({ embeds: [ok2_embed], ephemeral: false, components: [ok_row] });

                    } else if (i.customId === '未顯示') {
                        const ok2_embed = new MessageEmbed()
                            .setTitle('建立完成')
                            .setDescription(`觸發詞: ${reply}\n回應圖片: [連結](${set_reply})\n圖片顯示模式: content`)
                            .setColor('GREEN');

                        await i.update({ embeds: [ok2_embed], ephemeral: false, components: [ok_row] });
                    }
                }).catch(async () => {
                    const ok2_embed = new MessageEmbed()
                        .setTitle('建立完成')
                        .setDescription(`觸發詞: ${reply}\n回應圖片: [連結](${set_reply})\n圖片顯示模式: content`)
                        .setColor('GREEN');

                    await i2.editReply({ embeds: [ok2_embed], ephemeral: false, components: [ok_row] });
                })

        }

    }
}
