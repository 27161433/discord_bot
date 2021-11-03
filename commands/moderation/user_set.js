const { SlashCommandBuilder } = require('@discordjs/builders');
const {
    MessageActionRow,
    MessageSelectMenu,
    MessageEmbed,
    MessageButton,

} = require('discord.js');
const fs = require("fs");
const xp = require('../../path/user_log/xp.json');
const { dev } = require("../../config.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user_set')
        .setDefaultPermission(!dev)
        .setDescription('個人設定')
        .addStringOption(option =>
            option.setName('選項')
                .setDescription('選項')
                .setRequired(true)
                .addChoice('🔹 快速回應功能角色設定', '快速回應功能角色設定')
                .addChoice('🔹 快速回應刪除權限設定', '快速回應刪除權限設定')
                .addChoice('🔹 快速回應優先回覆設定', '快速回應優先回覆設定')
                .addChoice('🔹 簽到提醒功能設定', '簽到提醒功能設定')
                .addChoice('🔹 名字顏色設定', '名字顏色設定')),

    async run(client, interaction) {

        const string = interaction.options.getString('選項');
        const newxp = xp.find(m => m.id === interaction.user.id);

        if (string === '快速回應功能角色設定') {
            if (!newxp.gf) return await interaction.reply({ content: '你沒有任何自定義角色, 先去商城購買一個吧', ephemeral: true });
            let row_options = [];
            let msg = '▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫';
            for (let i = 0; i < newxp.gf.length; i++) {
                if (newxp.gf[i].use) {
                    msg += `\n🔸 ${newxp.gf[i].name}`;
                } else {
                    msg += `\n🔹 ${newxp.gf[i].name}`;
                    row_options.push({
                        label: `🔹 ${newxp.gf[i].name}`,
                        description: ``,
                        value: newxp.gf[i].name,
                    });
                }
            }
            msg += `\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n🔸: 表示正在使用中的角色\n於下方選單選擇你想使用的角色`;

            const embed = new MessageEmbed()
                .setTitle(`快速回應角色一覽`)
                .setDescription(msg)
                .setColor("BLUE");

            msg += `\n❌操作超時`;

            const embed2 = new MessageEmbed()
                .setTitle(`快速回應角色一覽`)
                .setDescription(msg)
                .setColor("RED");


            const row = new MessageActionRow()
                .addComponents(
                    new MessageSelectMenu()
                        .setCustomId('快速回應角色一覽選單')
                        .setPlaceholder('選擇使用角色')
                        .addOptions(row_options),
                )

            await interaction.reply({ embeds: [embed], ephemeral: true, components: [row] });

            const filter = i => {
                return ['快速回應角色一覽選單'].includes(i.customId) && i.user.id === interaction.user.id;
            };

            interaction.channel.awaitMessageComponent({ filter, time: 30000 })
                .then(async i => {
                    let set_gf = newxp.gf.find(m => m.name === i.values[0]);
                    newxp.gf.forEach(m => m.use = false);
                    set_gf.use = true;
                    msg = '▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫';
                    for (let i = 0; i < newxp.gf.length; i++) {
                        if (newxp.gf[i].use) msg += `\n🔸 ${newxp.gf[i].name}`;
                        else msg += `\n🔹 ${newxp.gf[i].name}`;
                    }
                    msg += `\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n✅角色變更成功`;

                    const embed3 = new MessageEmbed()
                        .setTitle(`快速回應角色一覽`)
                        .setDescription(msg)
                        .setColor("GREEN");

                    await i.update({ embeds: [embed3], ephemeral: true, components: [] });
                    fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                        if (err) console.log(err);
                    });

                })
                .catch(async () => {
                    await interaction.editReply({ embeds: [embed2], ephemeral: true, components: [] })
                })

        } else if (string === '快速回應刪除權限設定') {

            let msg = '▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫';

            if (newxp.set.reply_permission) msg += `\n🔹 僅允許管理員刪除你的回應\n🔸 允許所有人刪除你的回應`;
            else msg += `\n🔸 僅允許管理員刪除你的回應\n🔹 允許所有人刪除你的回應`;

            msg += `\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n🔸: 表示正在使用中的設定\n點擊下方按鈕🔄進行變更`;

            const embed = new MessageEmbed()
                .setTitle(`快速回應刪除權限設定`)
                .setDescription(msg)
                .setColor("BLUE");

            msg += `\n❌取消變更`;

            const embed2 = new MessageEmbed()
                .setTitle(`快速回應刪除權限設定`)
                .setDescription(msg)
                .setColor("RED");

            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('變更設定')
                        .setLabel('變更設定')
                        .setEmoji('🔄')
                        .setStyle('PRIMARY'),
                )
                .addComponents(
                    new MessageButton()
                        .setCustomId('取消變更')
                        .setLabel('取消變更')
                        .setEmoji('❌')
                        .setStyle('PRIMARY'),
                );

            await interaction.reply({ embeds: [embed], ephemeral: true, components: [row] });

            const filter = i => {
                return ['變更設定', '取消變更'].includes(i.customId) && i.user.id === interaction.user.id;
            };

            interaction.channel.awaitMessageComponent({ filter, time: 30000 })
                .then(async i => {

                    if (i.customId === '變更設定') {
                        newxp.set.reply_permission = !newxp.set.reply_permission;
                        msg = '▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫';
                        if (newxp.set.reply_permission) msg += `\n🔹 僅允許管理員刪除你的回應\n🔸 允許所有人刪除你的回應`;
                        else msg += `\n🔸 僅允許管理員刪除你的回應\n🔹 允許所有人刪除你的回應`;

                        msg += `\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n✅變更成功`;

                        const embed3 = new MessageEmbed()
                            .setTitle(`快速回應刪除權限設定`)
                            .setDescription(msg)
                            .setColor("GREEN");

                        await i.update({ embeds: [embed3], ephemeral: true, components: [] });
                        fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                            if (err) console.log(err);
                        });
                    } else if (i.customId === '取消變更') await i.update({ embeds: [embed2], ephemeral: true, components: [] });
                })
                .catch(async () => {
                    await interaction.editReply({ embeds: [embed2], ephemeral: true, components: [] });
                })

        } else if (string === '快速回應優先回覆設定') {

            let msg = '▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫';

            if (newxp.set.reply_mode) msg += `\n🔹 隨機使用\n🔸 優先使用自己設定的詞`;
            else msg += `\n🔸 隨機使用\n🔹 優先使用自己設定的詞`;

            msg += `\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n🔸: 表示正在使用中的設定\n點擊下方按鈕🔄進行變更`;

            const embed = new MessageEmbed()
                .setTitle(`快速回應優先回覆設定`)
                .setDescription(msg)
                .setColor("BLUE");

            msg += `\n❌取消變更`;

            const embed2 = new MessageEmbed()
                .setTitle(`快速回應優先回覆設定`)
                .setDescription(msg)
                .setColor("RED");

            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('變更設定')
                        .setLabel('變更設定')
                        .setEmoji('🔄')
                        .setStyle('PRIMARY'),
                )
                .addComponents(
                    new MessageButton()
                        .setCustomId('取消變更')
                        .setLabel('取消變更')
                        .setEmoji('❌')
                        .setStyle('PRIMARY'),
                );

            await interaction.reply({ embeds: [embed], ephemeral: true, components: [row] });

            const filter = i => {
                return ['變更設定', '取消變更'].includes(i.customId) && i.user.id === interaction.user.id;
            };

            interaction.channel.awaitMessageComponent({ filter, time: 30000 })
                .then(async i => {

                    if (i.customId === '變更設定') {
                        newxp.set.reply_mode = !newxp.set.reply_mode;
                        msg = '▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫';
                        if (newxp.set.reply_mode) msg += `\n🔹 隨機使用\n🔸 優先使用自己設定的詞`;
                        else msg += `\n🔸 隨機使用\n🔹 優先使用自己設定的詞`;

                        msg += `\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n✅變更成功`;

                        const embed3 = new MessageEmbed()
                            .setTitle(`快速回應優先回覆設定`)
                            .setDescription(msg)
                            .setColor("GREEN");

                        await i.update({ embeds: [embed3], ephemeral: true, components: [] });
                        fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                            if (err) console.log(err);
                        });
                    } else if (i.customId === '取消變更') await i.update({ embeds: [embed2], ephemeral: true, components: [] });
                })
                .catch(async () => {
                    await interaction.editReply({ embeds: [embed2], ephemeral: true, components: [] });
                });

        } else if (string === '簽到提醒功能設定') {
            if (!newxp.set.si_msg) return await interaction.reply({ content: '你還沒有購買此功能, 先去商城購買吧', ephemeral: true });

            let msg = '功能說明: 若在晚上6點及隔日凌晨0(12)點前未簽到將會在消息區tag你提醒你簽到\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫';

            if (newxp.set.si_msg === 1) msg += `\n🔸 開啟提醒\n🔹 關閉提醒`;
            else if (newxp.set.si_msg === 2) msg += `\n🔹 開啟提醒\n🔸 關閉提醒`;

            msg += `\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n🔸: 表示正在使用中的設定\n點擊下方按鈕🔄進行變更`;

            const embed = new MessageEmbed()
                .setTitle(`簽到提醒功能設定`)
                .setDescription(msg)
                .setColor("BLUE");

            msg += `\n❌取消變更`;

            const embed2 = new MessageEmbed()
                .setTitle(`簽到提醒功能設定`)
                .setDescription(msg)
                .setColor("RED");

            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('變更設定')
                        .setLabel('變更設定')
                        .setEmoji('🔄')
                        .setStyle('PRIMARY'),
                )
                .addComponents(
                    new MessageButton()
                        .setCustomId('取消變更')
                        .setLabel('取消變更')
                        .setEmoji('❌')
                        .setStyle('PRIMARY'),
                );

            await interaction.reply({ embeds: [embed], ephemeral: true, components: [row] });

            const filter = i => {
                return ['變更設定', '取消變更'].includes(i.customId) && i.user.id === interaction.user.id;
            };

            interaction.channel.awaitMessageComponent({ filter, time: 30000 })
                .then(async i => {

                    if (i.customId === '變更設定') {
                        if (newxp.set.si_msg === 1) newxp.set.si_msg = 2;
                        else newxp.set.si_msg = 1;
                        newxp.set.reply_mode = !newxp.set.reply_mode;
                        msg = '功能說明: 若在晚上6點及隔日凌晨0(12)點前未簽到將會在消息區tag你提醒你簽到\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫';
                        if (newxp.set.si_msg === 1) msg += `\n🔸 開啟提醒\n🔹 關閉提醒`;
                        else if (newxp.set.si_msg === 2) msg += `\n🔹 開啟提醒\n🔸 關閉提醒`;
                        msg += `\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n✅變更成功`;

                        const embed3 = new MessageEmbed()
                            .setTitle(`快速回應優先回覆設定`)
                            .setDescription(msg)
                            .setColor("GREEN");

                        await i.update({ embeds: [embed3], ephemeral: true, components: [] });
                        fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                            if (err) console.log(err);
                        });
                    } else if (i.customId === '取消變更') await i.update({ embeds: [embed2], ephemeral: true, components: [] });
                })
                .catch(async () => {
                    await interaction.editReply({ embeds: [embed2], ephemeral: true, components: [] });
                });

        } else if (string === '名字顏色設定') {
            if (newxp.level < 1) return await interaction.reply({ content: '此功能需要等級達到 Lv.1 後才可設定', ephemeral: true });

            let row_options = [];
            let color = ['紅色', '白色', '天藍色', '深藍色', '綠色', '黃色', '紫色', '櫻色'];
            let remove_color = '';
            let msg = '▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫';
            for (let i = 0; i < color.length; i++) {
                if (interaction.member.roles.cache.some(role => role.name === color[i])) {
                    msg += `\n🔸 ${color[i]}`;
                    remove_color = color[i];
                } else {
                    msg += `\n🔹 ${color[i]}`;
                    row_options.push({
                        label: `🔹 ${color[i]}`,
                        description: ``,
                        value: color[i],
                    });
                }
            }
            msg += `\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n🔸: 表示正在使用中的顏色\n於下方選單選擇你想使用的顏色`;

            const embed = new MessageEmbed()
                .setTitle(`名字顏色設定`)
                .setDescription(msg)
                .setColor("BLUE");

            msg += `\n❌操作超時`;

            const embed2 = new MessageEmbed()
                .setTitle(`名字顏色設定`)
                .setDescription(msg)
                .setColor("RED");


            const row = new MessageActionRow()
                .addComponents(
                    new MessageSelectMenu()
                        .setCustomId('名字顏色設定')
                        .setPlaceholder('選擇你想使用的顏色')
                        .addOptions(row_options),
                )

            await interaction.reply({ embeds: [embed], ephemeral: true, components: [row] });

            const filter = i => {
                return ['名字顏色設定'].includes(i.customId) && i.user.id === interaction.user.id;
            };

            interaction.channel.awaitMessageComponent({ filter, time: 30000 })
                .then(async i => {

                    await interaction.member.roles.remove(interaction.guild.roles.cache.find(r => r.name === remove_color));
                    await interaction.member.roles.add(interaction.guild.roles.cache.find(r => r.name === i.values[0]));

                    msg = '▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫';
                    for (let o = 0; o < color.length; o++) {
                        if (interaction.member.roles.cache.some(role => role.name === color[o])) msg += `\n🔸 ${color[o]}`;
                        else msg += `\n🔹 ${color[o]}`;
                    }
                    msg += `\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n✅顏色變更成功`;

                    const embed3 = new MessageEmbed()
                        .setTitle(`名字顏色設定`)
                        .setDescription(msg)
                        .setColor("GREEN");

                    await i.update({ embeds: [embed3], ephemeral: true, components: [] })
                })
                .catch(async () => {
                    await interaction.editReply({ embeds: [embed2], ephemeral: true, components: [] })
                });
        }

    }
};
