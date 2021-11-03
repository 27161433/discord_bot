const { SlashCommandBuilder } = require('@discordjs/builders');
const {
    MessageActionRow,
    MessageEmbed,
    MessageButton,
} = require('discord.js');
const fs = require("fs");
const xp = require('../../path/user_log/xp.json');
const guild_activity = require('../../path/system_log/guild_activity.json');
const { dev } = require("../../config.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user_info')
        .setDefaultPermission(!dev)
        .setDescription('個人信息')
        .addUserOption(option =>
            option.setName('用戶')
                .setDescription('用戶')),
    async run(client, interaction) {

        const member = interaction.options.getMember('用戶');

        if (member) {
            if (member.user.bot) return await interaction.reply({ content: '無法查詢機器人的個人信息', ephemeral: true });

            const newxp = xp.find(m => m.id === member.user.id);
            if (!newxp) return await interaction.reply({ content: '找不到此人的個人信息', ephemeral: true });
            const useravatarurl = member.user.displayAvatarURL({
                format: 'png',
                dynamic: true,
                size: 4096
            });

            const embed = new MessageEmbed()
                .setTitle(member.displayName)
                .setDescription(user_data(newxp, member, true))
                .setThumbnail(useravatarurl)
                .setColor("RANDOM");

            await interaction.reply({ embeds: [embed], ephemeral: false });

        } else {
            const newxp = xp.find(m => m.id === interaction.user.id);
            const useravatarurl = interaction.user.displayAvatarURL({
                format: 'png',
                dynamic: true,
                size: 4096
            });
            let msg = user_data(newxp, interaction);

            let level_up_xp = 1000 + newxp.level * 1000 - newxp.xp;
            if (level_up_xp < 0 && newxp.coin > newxp.level * 100 + 100) msg += `▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n你已達成升等條件, 可以點擊下方按鈕花費鳴鈴幣升等\n\n升1等花費: **${newxp.level * 100 + 100}**`;
            let level_up_coin_5 = 0;
            let level_up_coin_full = 0;
            let level_up_full = Math.ceil(- (1000 + newxp.level * 1000 - newxp.xp) / 1000);

            for (let i = 0; i < 5; i++) level_up_coin_5 = level_up_coin_5 + ((newxp.level + i) * 100 + 100);

            for (let i = 0; i < level_up_full; i++) {
                level_up_coin_full = level_up_coin_full + ((newxp.level + i) * 100 + 100);
                if (newxp.coin < level_up_coin_full) {
                    level_up_coin_full = level_up_coin_full - ((newxp.level + i) * 100 + 100);
                    level_up_full = i;
                    break;
                }
            }
            if (1000 + newxp.level * 1000 - newxp.xp < - 5000 && newxp.coin > level_up_coin_5) msg += `\n\n升5等花費: **${level_up_coin_5}**`;
            if (level_up_xp < 0 && newxp.coin > newxp.level * 100 + 100) msg += `\n\n直接幹滿花費: **${level_up_coin_full}** (可升到 **${level_up_full + newxp.level} 等**)`;

            const embed = new MessageEmbed()
                .setTitle(interaction.member.displayName)
                .setDescription(msg)
                .setThumbnail(useravatarurl)
                .setColor("RANDOM");

            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('升1等')
                        .setLabel('升1等')
                        .setEmoji('▶')
                        .setStyle('PRIMARY'),
                )
                .addComponents(
                    new MessageButton()
                        .setCustomId('升5等')
                        .setLabel('升5等')
                        .setEmoji('⏩')
                        .setStyle('PRIMARY'),
                )
                .addComponents(
                    new MessageButton()
                        .setCustomId('直接幹滿')
                        .setLabel('直接幹滿')
                        .setEmoji('<:catwtf:735199917861240883>')
                        .setStyle('DANGER'),
                )
                .addComponents(
                    new MessageButton()
                        .setCustomId('取消')
                        .setLabel('取消')
                        .setEmoji('❌')
                        .setStyle('PRIMARY'),
                );

            if (level_up_xp < 0 && newxp.coin > newxp.level * 100 + 100) {
                await interaction.reply({ embeds: [embed], ephemeral: false, components: [row] });
                levelup(level_up_coin_5, level_up_coin_full, level_up_full);
            } else await interaction.reply({ embeds: [embed], ephemeral: false, components: [] });

        }

        function user_data(newxp, m, m2) {
            let msg = '';

            let msg_act = 0;
            let photo_act = 0;
            let voice_act = 0;
            let ss = 0;
            let mm = 0;
            let hh = 0;
            let p = '0';
            let nga = guild_activity.find(a => a.id === newxp.id);
            if (nga) {
                if (nga.text[0]) nga.text.forEach(t => msg_act = msg_act + t.n);
                if (nga.photo[0]) nga.photo.forEach(p => photo_act = photo_act + p.n);
                if (nga.voice[0]) nga.voice.forEach(v => voice_act = voice_act + v.n);

                ss = voice_act;
                p = `${ss}秒`;

                if (ss > 60) {
                    mm = Math.ceil(ss / 60);
                    ss = ss % 60;
                    p = `${mm}分 ${ss}秒`
                }
                if (mm > 60) {
                    hh = Math.ceil(mm / 60);
                    mm = mm % 60;
                    p = `${hh}時 ${mm}分 ${ss}秒`
                }
            }

            let joinedAt = 0;
            if (m2) joinedAt = m.joinedAt;
            else joinedAt = m.member.joinedAt;

            const d = new Date(joinedAt);
            const join_date = [
                d.getFullYear().toString().padStart(4, '0'),
                (d.getMonth() + 1).toString().padStart(2, '0'),
                d.getDate().toString().padStart(2, '0')
            ].join('/') + ' ' + [
                d.getHours().toString().padStart(2, '0'),
                d.getMinutes().toString().padStart(2, '0'),
                d.getSeconds().toString().padStart(2, '0')
            ].join(':');
            const d2 = new Date(m.user.createdAt);
            const created_date = [
                d2.getFullYear().toString().padStart(4, '0'),
                (d2.getMonth() + 1).toString().padStart(2, '0'),
                d2.getDate().toString().padStart(2, '0')
            ].join('/') + ' ' + [
                d2.getHours().toString().padStart(2, '0'),
                d2.getMinutes().toString().padStart(2, '0'),
                d2.getSeconds().toString().padStart(2, '0')
            ].join(':');

            let level_up_xp = 1000 + newxp.level * 1000 - newxp.xp;
            if (1000 + newxp.level * 1000 - newxp.xp < 0) level_up_xp = 0;
            let si_msg = '未簽到';
            if (newxp.sign_in.si) si_msg = '已簽到';
            if (!newxp.old_activity) newxp.old_activity = {
                text: 0,
                photo: 0,
                voice: '00:00:00'
            }

            msg += `▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n`;
            msg += `🔰 等級: **${newxp.level}**\n`;
            msg += `📊 經驗值: **${newxp.xp}**\n`;
            msg += `⏳ 距離可升等還缺少的經驗值: **${level_up_xp}**\n`;
            msg += `💸 升等所需鳴鈴幣: **${newxp.level * 100 + 100}**\n\n`;

            msg += `💰 鳴鈴幣: **${newxp.coin}**\n\n`;

            msg += `❤️ 本日是否簽到: **${si_msg}**\n`;
            msg += `💞 累計簽到天數: **${newxp.sign_in.si_day}**\n\n`;

            msg += `🖊️ 本日發訊息數: **${msg_act}**\n`;
            msg += `🌄 本日發圖數: **${photo_act}**\n`;
            msg += `🔊 本日語音時間: **${p}**\n\n`;

            msg += `🖊️ 昨日發訊息數: **${newxp.old_activity.text}**\n`;
            msg += `🌄 昨日發圖數: **${newxp.old_activity.photo}**\n`;
            msg += `🔊 昨日語音時間: **${newxp.old_activity.voice}**\n\n`;

            msg += `🕒 進群時間: **${join_date}**\n`;
            msg += `🕤 帳號建立時間: **${created_date}**\n\n`;

            return msg;
        }

        function levelup() {
            const newxp = xp.find(m => m.id === interaction.user.id);
            const useravatarurl = interaction.user.displayAvatarURL({
                format: 'png',
                dynamic: true,
                size: 4096
            });

            let level_up_coin_5 = 0;
            let level_up_coin_full = 0;
            let level_up_full = Math.ceil(- (1000 + newxp.level * 1000 - newxp.xp) / 1000);

            for (let i = 0; i < 5; i++) level_up_coin_5 = level_up_coin_5 + ((newxp.level + i) * 100 + 100);

            for (let i = 0; i < level_up_full; i++) {
                level_up_coin_full = level_up_coin_full + ((newxp.level + i) * 100 + 100);
                if (newxp.coin < level_up_coin_full) {
                    level_up_coin_full = level_up_coin_full - ((newxp.level + i) * 100 + 100);
                    level_up_full = i;
                    break;
                }
            }

            const filter = i => {
                return ['升1等', '升5等', '直接幹滿', '取消'].includes(i.customId) && i.user.id === interaction.user.id;
            };

            interaction.channel.awaitMessageComponent({ filter, time: 30000 })
                .then(async i => {

                    if (i.customId === '升1等') {

                        newxp.level = newxp.level + 1;
                        newxp.coin = newxp.coin - (newxp.level * 100 + 100);
                        fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                            if (err) console.log(err);
                        });

                        let msg = user_data(newxp, interaction);
                        let level_up_xp = 1000 + newxp.level * 1000 - newxp.xp;
                        if (level_up_xp < 0 && newxp.coin > newxp.level * 100 + 100) msg += `▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n升1等花費: **${newxp.level * 100 + 100}**`;
                        if (1000 + newxp.level * 1000 - newxp.xp < - 5000 && newxp.coin > level_up_coin_5) msg += `\n升5等花費: **${level_up_coin_5}**`;
                        if (level_up_xp < 0 && newxp.coin > newxp.level * 100 + 100) msg += `\n直接幹滿花費: **${level_up_coin_full}** (可升到 **${level_up_full + newxp.level} 等**)\n\n`;
                        msg += `▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n✅成功`;
                        if (level_up_xp < 0 && newxp.coin > newxp.level * 100 + 100) msg += `\n\n你還可以繼續升等`;

                        const embed = new MessageEmbed()
                            .setTitle(interaction.member.displayName)
                            .setDescription(msg)
                            .setThumbnail(useravatarurl)
                            .setColor("RANDOM");

                        if (level_up_xp < 0 && newxp.coin > newxp.level * 100 + 100) {
                            await i.update({ embeds: [embed], ephemeral: false });
                            levelup();
                        } else await i.update({ embeds: [embed], ephemeral: false, components: [] });

                    } else if (i.customId === '升5等') {

                        if (!(1000 + newxp.level * 1000 - newxp.xp < - 5000 && newxp.coin > level_up_coin_5)) {

                            let msg = user_data(newxp, interaction);
                            let level_up_xp = 1000 + newxp.level * 1000 - newxp.xp;
                            if (level_up_xp < 0 && newxp.coin > newxp.level * 100 + 100) msg += `▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n升1等花費: **${newxp.level * 100 + 100}**`;
                            if (1000 + newxp.level * 1000 - newxp.xp < - 5000 && newxp.coin > level_up_coin_5) msg += `\n升5等花費: **${level_up_coin_5}**`;
                            if (level_up_xp < 0 && newxp.coin > newxp.level * 100 + 100) msg += `\n直接幹滿花費: **${level_up_coin_full}** (可升到 **${level_up_full + newxp.level} 等**)\n\n`;
                            msg += `▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n⚠你無法一次升5等`;
                            if (level_up_xp < 0 && newxp.coin > newxp.level * 100 + 100) msg += `\n\n你還可以繼續升等`;

                            const embed = new MessageEmbed()
                                .setTitle(interaction.member.displayName)
                                .setDescription(msg)
                                .setThumbnail(useravatarurl)
                                .setColor("YELLOW");

                            await i.update({ embeds: [embed], ephemeral: false });
                            levelup();
                        } else {
                            newxp.level = newxp.level + 5;
                            newxp.coin = newxp.coin - level_up_coin_5;
                            fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                                if (err) console.log(err);
                            });
                            let level_up_xp = 1000 + newxp.level * 1000 - newxp.xp;
                            let msg = user_data(newxp, interaction);
                            if (level_up_xp < 0 && newxp.coin > newxp.level * 100 + 100) msg += `▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n升1等花費: **${newxp.level * 100 + 100}**`;
                            if (1000 + newxp.level * 1000 - newxp.xp < - 5000 && newxp.coin > level_up_coin_5) msg += `\n升5等花費: **${level_up_coin_5}**`;
                            if (level_up_xp < 0 && newxp.coin > newxp.level * 100 + 100) msg += `\n直接幹滿花費: **${level_up_coin_full}** (可升到 **${level_up_full + newxp.level} 等**)\n\n`;
                            msg += `▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n✅成功`;
                            if (level_up_xp < 0 && newxp.coin > newxp.level * 100 + 100) msg += `\n\n你還可以繼續升等`;

                            const embed = new MessageEmbed()
                                .setTitle(interaction.member.displayName)
                                .setDescription(msg)
                                .setThumbnail(useravatarurl)
                                .setColor("RANDOM");

                            if (level_up_xp < 0 && newxp.coin > newxp.level * 100 + 100) {
                                await i.update({ embeds: [embed], ephemeral: false });
                                levelup();
                            } else await i.update({ embeds: [embed], ephemeral: false, components: [] });
                        }

                    } else if (i.customId === '直接幹滿') {

                        newxp.level = newxp.level + level_up_full;
                        newxp.coin = newxp.coin - level_up_coin_full;
                        fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                            if (err) console.log(err);
                        });

                        let msg = user_data(newxp, interaction);
                        msg += `▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n✅成功幹滿`;

                        const embed = new MessageEmbed()
                            .setTitle(interaction.member.displayName)
                            .setDescription(msg)
                            .setThumbnail(useravatarurl)
                            .setColor("RANDOM");

                        await i.update({ embeds: [embed], ephemeral: false, components: [] });

                    } else if (i.customId === '取消') {
                        const embed = new MessageEmbed()
                            .setTitle(interaction.member.displayName)
                            .setDescription(user_data(newxp, interaction))
                            .setThumbnail(useravatarurl)
                            .setColor("RANDOM");

                        await i.update({ embeds: [embed], ephemeral: false, components: [] });
                    }
                })
                .catch(async () => {
                    const embed = new MessageEmbed()
                        .setTitle(interaction.member.displayName)
                        .setDescription(user_data(newxp, interaction))
                        .setThumbnail(useravatarurl)
                        .setColor("RANDOM");

                    await interaction.editReply({ embeds: [embed], ephemeral: true, components: [] });
                });
        }
    }
};
