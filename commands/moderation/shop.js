const { SlashCommandBuilder } = require('@discordjs/builders');
const {
    MessageActionRow,
    MessageEmbed,
    MessageButton,

} = require('discord.js');
const fs = require("fs");
const xp = require('../../path/user_log/xp.json');
const filetype = require('file-type');
const got = require('got');
const guild_channel = require("../../path/system_log/guild_channel.json");
const { dev } = require("../../config.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDefaultPermission(!dev)
        .setDescription('商城')
        .addStringOption(option =>
            option.setName('販售物品一覽')
                .setDescription('販售物品一覽')
                .setRequired(true)
                .addChoice('🔹 個人經驗值', '個人經驗值')
                .addChoice('🔹 快速回應角色', '快速回應角色')
                .addChoice('🔹 蘿生門門票', '蘿生門門票')
                .addChoice('🔹 簽到提醒功能', '簽到提醒功能')),

    async run(client, interaction) {

        const string = interaction.options.getString('販售物品一覽');

        if (string === '個人經驗值') {
            let price = 50;
            let exp_pack = 100;
            const newxp = xp.find(m => m.id === interaction.user.id);
            let n = 0;
            const embed = new MessageEmbed()
                .setTitle(`購買經驗值`)
                .setDescription(`經驗包每包含量為 **${exp_pack}xp** 售價為 **${price}** 鳴鈴幣\n已有經驗值: **${newxp.xp}**\n現在等級: **${newxp.level}**`)
                .setColor("BLUE");

            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('1')
                        .setLabel('買1包')
                        .setEmoji('1️⃣')
                        .setStyle('PRIMARY'),
                )
                .addComponents(
                    new MessageButton()
                        .setCustomId('10')
                        .setLabel('買10包')
                        .setEmoji('🔟')
                        .setStyle('PRIMARY'),
                )
                .addComponents(
                    new MessageButton()
                        .setCustomId('結束購買')
                        .setLabel('結束購買')
                        .setEmoji('❌')
                        .setStyle('PRIMARY'),
                );

            await interaction.reply({ embeds: [embed], ephemeral: false, components: [row] });
            exp_pack_list(price, exp_pack, n);

        } else if (string === '快速回應角色') {
            if (interaction.channel.isThread()) return await interaction.reply({ content: '此功能無法於討論串中使用', ephemeral: true });
            const newxp = xp.find(m => m.id === interaction.user.id);
            let msg = '';
            let price = 300 + 300 * newxp.gf.length;

            if (newxp.level < 3) msg = '\n\n❌購買失敗\n原因: 等級不足';
            if (newxp.coin < price) msg = '\n\n❌購買失敗\n原因: 鳴鈴幣不足';

            const embed = new MessageEmbed()
                .setTitle(`購買快速回應角色`)
                .setDescription(`快速回應角色每次購買金額皆不同,購買越多價格也越貴\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n已擁有角色數量: **${newxp.gf.length}** \n本次購買需要的鳴鈴幣: **${price}**\n現在等級: **${newxp.level}**\n剩餘鳴鈴幣: **${newxp.coin}**${msg}`)
                .setColor("BLUE");

            if (newxp.level < 3 || newxp.coin < price) return await interaction.reply({ embeds: [embed], ephemeral: false });

            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('確認購買')
                        .setLabel('確認購買')
                        .setEmoji('✅')
                        .setStyle('PRIMARY'),
                )
                .addComponents(
                    new MessageButton()
                        .setCustomId('取消購買')
                        .setLabel('取消購買')
                        .setEmoji('❌')
                        .setStyle('PRIMARY'),
                );

            await interaction.reply({ embeds: [embed], ephemeral: false, components: [row] });

            const filter = i => {
                return ['確認購買', '取消購買'].includes(i.customId) && i.user.id === interaction.user.id;
            };

            const embed2 = new MessageEmbed()
                .setTitle(`購買快速回應角色`)
                .setDescription(`快速回應角色每次購買金額皆不同,購買越多價格也越貴\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n已擁有角色數量: **${newxp.gf.length}** \n本次購買需要的鳴鈴幣: **${price}**\n現在等級: **${newxp.level}**\n剩餘鳴鈴幣: **${newxp.coin}**\n\n❌取消購買`)
                .setColor("BLUE");


            interaction.channel.awaitMessageComponent({ filter, time: 30000 })
                .then(async i => {

                    if (i.customId === '確認購買') {
                        let n = 0;
                        const embed3 = new MessageEmbed()
                            .setTitle(`購買快速回應角色`)
                            .setDescription(`快速回應角色每次購買金額皆不同,購買越多價格也越貴\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n已擁有角色數量: **${newxp.gf.length}** \n本次購買需要的鳴鈴幣: **${price}**\n現在等級: **${newxp.level}**\n剩餘鳴鈴幣: **${newxp.coin}**\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n1️⃣請於60秒內輸入自定義角色的名稱\n輸入 **x** 可取消購買`)
                            .setColor("BLUE");

                        await i.update({ embeds: [embed3], ephemeral: true, components: [] });
                        let gf = {};
                        client.user_list[interaction.user.id] = true;
                        gf_add_list(price, n, gf);
                    } else if (i.customId === '取消購買') await i.update({ embeds: [embed2], ephemeral: false });
                })
                .catch(async (e) => {
                    console.log(e);
                    await interaction.editReply({ embeds: [embed2], ephemeral: false });
                });

        } else if (string === '蘿生門門票') {
            if (interaction.member.roles.cache.some(role => role.name === '蘿生門')) return await interaction.reply({ content: '你已擁有此門票, 無法再次購買', ephemeral: false });

            const newxp = xp.find(m => m.id === interaction.user.id);

            const embed = new MessageEmbed()
                .setTitle(`購買蘿生門門票`)
                .setDescription(`此門票免費, 但僅限10等以上且連續簽到超過14天以上用戶購買\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n現在等級: **${newxp.level}**\n累計簽到天數: **${newxp.sign_in.si_day}**\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n⚠購買失敗\n原因: 等級或連續簽到天數未達標準`)
                .setColor("YELLOW");

            if (newxp.level < 10 || newxp.sign_in.si_day < 14) return await interaction.reply({ embeds: [embed], ephemeral: false });

            const role = interaction.guild.roles.cache.find(r => r.name === '蘿生門');
            interaction.member.roles.add(role);
            const embed2 = new MessageEmbed()
                .setTitle(`購買蘿生門門票`)
                .setDescription(`此門票免費, 但僅限10等以上且連續簽到超過14天以上用戶購買\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n現在等級: **${newxp.level}**\n累計簽到天數: **${newxp.sign_in.si_day}**\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n✅購買成功`)
                .setColor("GREEN");

            await interaction.reply({ embeds: [embed2], ephemeral: false });

        } else if (string === '簽到提醒功能') {
            const newxp = xp.find(m => m.id === interaction.user.id);
            if (newxp.set.si_msg) return await interaction.reply({ content: '你已擁有此功能, 無法再次購買', ephemeral: false });

            let price = 500;

            const embed = new MessageEmbed()
                .setTitle(`購買簽到提醒功能`)
                .setDescription(`功能說明: 若你在晚上6點及隔日凌晨0(12)點前未簽到將會在消息區tag你提醒你簽到\n價格: **${price}**\n購買限制: **Lv.1**\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n現在等級: **${newxp.level}**\n剩餘鳴鈴幣: **${newxp.coin}**\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n⚠購買失敗\n原因: 等級或鳴鈴幣不足`)
                .setColor("YELLOW");

            if (newxp.level < 1 || newxp.coin < price) return await interaction.reply({ embeds: [embed], ephemeral: false });

            const embed2 = new MessageEmbed()
                .setTitle(`購買簽到提醒功能`)
                .setDescription(`功能說明: 若你在晚上6點及隔日凌晨0(12)點前未簽到將會在消息區tag你提醒你簽到\n價格: **${price}**\n購買限制: **Lv.1**\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n現在等級: **${newxp.level}**\n剩餘鳴鈴幣: **${newxp.coin}**\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n是否確認購買?`)
                .setColor("BLUE");

            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('確認購買')
                        .setLabel('確認購買')
                        .setEmoji('✅')
                        .setStyle('PRIMARY'),
                )
                .addComponents(
                    new MessageButton()
                        .setCustomId('取消購買')
                        .setLabel('取消購買')
                        .setEmoji('❌')
                        .setStyle('PRIMARY'),
                );

            await interaction.reply({ embeds: [embed2], ephemeral: false, components: [row] });

            const filter = i => {
                return ['確認購買', '取消購買'].includes(i.customId) && i.user.id === interaction.user.id;
            };
            const embed3 = new MessageEmbed()
                .setTitle(`購買簽到提醒功能`)
                .setDescription(`功能說明: 若你在晚上6點及隔日凌晨0(12)點前未簽到將會在消息區tag你提醒你簽到\n價格: **${price}**\n購買限制: **Lv.1**\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n現在等級: **${newxp.level}**\n剩餘鳴鈴幣: **${newxp.coin}**\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n❌取消購買`)
                .setColor("BLUE");


            interaction.channel.awaitMessageComponent({ filter, time: 30000 })
                .then(async i => {

                    if (i.customId === '確認購買') {
                        const embed4 = new MessageEmbed()
                            .setTitle(`購買簽到提醒功能`)
                            .setDescription(`功能說明: 若你在晚上6點及隔日凌晨0(12)點前未簽到將會在消息區tag你提醒你簽到\n價格: **${price}**\n購買限制: **Lv.1**\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n現在等級: **${newxp.level}**\n剩餘鳴鈴幣: **${newxp.coin}**\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n✅購買完成`)
                            .setColor("GREEN");
                        newxp.coin = newxp.coin - price;
                        newxp.set.si_msg = 1;
                        fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                            if (err) console.log(err);
                        });

                        await i.update({ embeds: [embed4], ephemeral: true, components: [] });
                    } else if (i.customId === '取消購買') await i.update({ embeds: [embed3], ephemeral: false });
                })
                .catch(async () => {
                    await interaction.editReply({ embeds: [embed3], ephemeral: false });
                });
        }

        function exp_pack_list(price, exp_pack, n) {
            const filter = i => {
                return ['1', '10', '結束購買'].includes(i.customId) && i.user.id === interaction.user.id;
            };
            const newxp = xp.find(m => m.id === interaction.user.id);
            interaction.channel.awaitMessageComponent({ filter, time: 45000 })
                .then(async i => {

                    if (i.customId === '結束購買') {
                        const embed = new MessageEmbed()
                            .setTitle(`購買經驗值`)
                            .setDescription(`經驗包每包含量為 **${exp_pack}xp** 售價為 **${price}** 鳴鈴幣\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n剩餘鳴鈴幣: **${newxp.coin}**\n已有經驗值: **${newxp.xp}**\n現在等級: **${newxp.level}**\n本次累計購買: **${n}**\n\n🧾已結束購買, 歡迎下次光臨`)
                            .setColor("GREEN");
                        return await i.update({ embeds: [embed], ephemeral: false, components: [] });
                    } else {
                        let times = parseInt(i.customId);

                        if (newxp.coin < price * times) {
                            const embed = new MessageEmbed()
                                .setTitle(`購買經驗值`)
                                .setTitle(`經驗包每包含量為 **${exp_pack}xp** 售價為 **${price}** 鳴鈴幣\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n剩餘鳴鈴幣: **${newxp.coin}**\n已有經驗值: **${newxp.xp}**\n現在等級: **${newxp.level}**\n購買包數: **${times}**\n本次累計購買: **${n}**\n\n⚠鳴鈴幣不足`)
                                .setColor("RED");

                            await i.update({ embeds: [embed], ephemeral: false });
                        } else {
                            newxp.coin = newxp.coin - price * times;
                            newxp.xp = newxp.xp + exp_pack * times;
                            n = n + times;

                            const embed = new MessageEmbed()
                                .setTitle(`購買經驗值`)
                                .setDescription(`經驗包每包含量為 **${exp_pack}xp** 售價為 **${price}** 鳴鈴幣\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n剩餘鳴鈴幣: **${newxp.coin}**\n已有經驗值: **${newxp.xp}**\n現在等級: **${newxp.level}**\n購買包數: **${times}**\n本次累計購買: **${n}**\n\n✅購買成功`)
                                .setColor("GREEN");
                            await i.update({ embeds: [embed], ephemeral: false });
                        }
                    }
                    fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                        if (err) console.log(err);
                    });

                    exp_pack_list(price, exp_pack, n);
                })
                .catch(async () => {
                    const embed = new MessageEmbed()
                        .setTitle(`購買經驗值`)
                        .setDescription(`經驗包每包含量為 **${exp_pack}xp** 售價為 **${price}** 鳴鈴幣\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n剩餘鳴鈴幣: **${newxp.coin}**\n已有經驗值: **${newxp.xp}**\n現在等級: **${newxp.level}**\n本次累計購買: **${n}**\n\n🧾長時間未動作, 已自動結束購買, 歡迎下次光臨`)
                        .setColor("GREEN");
                    await interaction.editReply({ embeds: [embed], ephemeral: false, components: [] });
                })

        }

        function gf_add_list(price, n, gf) {
            const filter = m => m.author.id === interaction.user.id;
            const newxp = xp.find(m => m.id === interaction.user.id);
            let msg = `快速回應角色每次購買金額皆不同,購買越多價格也越貴\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n已擁有角色數量: **${newxp.gf.length}** \n本次購買需要的鳴鈴幣: **${price}**\n現在等級: **${newxp.level}**\n剩餘鳴鈴幣: **${newxp.coin}**\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫`
            const func = {
                0: async (message) => {
                    if (!message.content) {
                        const embed = new MessageEmbed()
                            .setTitle(`購買快速回應角色`)
                            .setDescription(`${msg}\n⚠沒有找到名稱, 請重新輸入\n輸入 **x** 可取消購買`)
                            .setColor("RED");
                        n--;
                        message.delete();
                        return await interaction.editReply({ embeds: [embed], ephemeral: true });
                    }
                    if (newxp.gf.find(g => g.name === message.content)) {
                        const embed = new MessageEmbed()
                            .setTitle(`購買快速回應角色`)
                            .setDescription(`${msg}\n⚠無法使用已有的角色名稱, 請重新輸入\n輸入 **x** 可取消購買`)
                            .setColor("RED");
                        n--;
                        message.delete();
                        return await interaction.editReply({ embeds: [embed], ephemeral: true });
                    }
                    const embed = new MessageEmbed()
                        .setTitle(`購買快速回應角色`)
                        .setDescription(`${msg}\n2️⃣請於60秒內上傳自定義角色的頭像或直接輸入圖片網址\n輸入 **x** 可取消購買`)
                        .setColor("AQUA");

                    gf.name = message.content;
                    message.delete();
                    await interaction.editReply({ embeds: [embed], ephemeral: true });
                },
                1: async (message) => {
                    const row = new MessageActionRow()
                        .addComponents(
                            new MessageButton()
                                .setCustomId('確認購買')
                                .setLabel('確認購買')
                                .setEmoji('✔')
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
                                .setCustomId('取消購買')
                                .setLabel('取消購買')
                                .setEmoji('❌')
                                .setStyle('PRIMARY'),
                        );

                    if (message.content.startsWith('https')) {

                        try {
                            let att = await filetype.fromStream(got.stream(message.content));
                            if (!att.mime.startsWith('image')) return;
                            else {
                                gf.photo = message.content;
                                const embed = new MessageEmbed()
                                    .setTitle(`購買快速回應角色`)
                                    .setDescription(`${msg}\n以下為範例\n是否確認購買`)
                                    .setColor("ORANGE");

                                await interaction.editReply({ embeds: [embed], ephemeral: true, components: [row] });
                                client.functions.get("sendwebhook").run(message, '這是範例哦~', gf.name, gf.photo);
                                message.delete();
                                func.button();
                            }

                        } catch {
                            const embed = new MessageEmbed()
                                .setTitle(`購買快速回應角色`)
                                .setDescription(`${msg}\n⚠沒有在這個網址中找到圖片, 請重新輸入\n輸入 **x** 可取消購買`)
                                .setColor("RED");

                            n--;
                            message.delete();
                            gf_add_list(price, n, gf);
                            await interaction.editReply({ embeds: [embed], ephemeral: true });
                        }

                    } else {
                        const embed = new MessageEmbed()
                            .setTitle(`購買快速回應角色`)
                            .setDescription(`${msg}\n⚠沒有找到圖片或圖片大小超過8MB, 請重新輸入\n輸入 **x** 可取消購買`)
                            .setColor("RED");

                        if (!message.attachments.first() || message.attachments.first().size > 8388608 || message.attachments.first().height === null) {
                            n--;
                            message.delete();
                            gf_add_list(price, n, gf);
                            return await interaction.editReply({ embeds: [embed], ephemeral: true });
                        }

                        const bakupchannel = message.guild.channels.cache.find(c => c.name === guild_channel.bak_channel.name);
                        const embed2 = new MessageEmbed()
                            .setTitle(`購買快速回應角色`)
                            .setDescription(`${msg}\n製作約需5秒, 請稍後...`)
                            .setColor("GREEN");

                        await interaction.editReply({ embeds: [embed2], ephemeral: true });
                        bakupchannel.send({
                            files: [message.attachments.first().url]
                        }).then(async m => {
                            gf.photo = m.attachments.first().url;
                            message.delete();
                            const embed = new MessageEmbed()
                                .setTitle(`購買快速回應角色`)
                                .setDescription(`${msg}\n以下為範例\n是否確認購買`)
                                .setColor("ORANGE");

                            await interaction.editReply({ embeds: [embed], ephemeral: true, components: [row] });
                            client.functions.get("sendwebhook").run(message, '這是範例哦~', gf.name, gf.photo);
                            func.button();
                        });

                    }
                },
                button: async () => {
                    const filter = i => {
                        return ['確認購買', '重新編輯', '取消購買'].includes(i.customId) && i.user.id === interaction.user.id;
                    };

                    interaction.channel.awaitMessageComponent({ filter, time: 30000 })
                        .then(async i => {

                            if (i.customId === '確認購買') {
                                const embed = new MessageEmbed()
                                    .setTitle(`購買快速回應角色`)
                                    .setDescription(`${msg}\n✅購買完成\n已設定為預設角色`)
                                    .setColor("GREEN");

                                gf.use = true;
                                newxp.gf.forEach(m => m.use = false);
                                newxp.gf.push(gf);
                                fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                                    if (err) console.log(err);
                                });
                                await i.update({ embeds: [embed], ephemeral: true, components: [] });
                            } else if (i.customId === '重新編輯') {
                                const embed = new MessageEmbed()
                                    .setTitle(`購買快速回應角色`)
                                    .setDescription(`${msg}\n1️⃣請於60秒內輸入自定義角色的名稱\n輸入 **x** 可取消購買`)
                                    .setColor("BLUE");

                                n = 0;
                                client.user_list[interaction.user.id] = true;
                                await i.update({ embeds: [embed], ephemeral: true, components: [] });
                                gf_add_list(price, n, gf);
                            } else if (i.customId === '取消購買') {
                                const embed = new MessageEmbed()
                                    .setTitle(`購買快速回應角色`)
                                    .setDescription(`${msg}\n❌取消購買`)
                                    .setColor("RED");
                                await i.update({ embeds: [embed], ephemeral: true, components: [] });
                            }
                        })
                        .catch(async (e) => {
                            console.log(e);
                            const embed = new MessageEmbed()
                                .setTitle(`購買快速回應角色`)
                                .setDescription(`${msg}\n❌操作時間超時`)
                                .setColor("RED");

                            await interaction.editReply({ embeds: [embed], ephemeral: true, components: [] });
                        });

                }
            }

            interaction.channel.awaitMessages({ filter, max: 1, time: 180000, errors: ['time'] })
                .then(async collected => {
                    if (collected.first().content === 'x') {
                        delete client.user_list[interaction.user.id];
                        const embed = new MessageEmbed()
                            .setTitle(`購買快速回應角色`)
                            .setDescription(`${msg}\n❌取消購買`)
                            .setColor("RED");
                        await interaction.editReply({ embeds: [embed], ephemeral: true });

                    } else {
                        func[n](collected.first())
                        n++
                        if (n > 1) return delete client.user_list[interaction.user.id];
                        gf_add_list(price, n, gf);
                    }
                })
                .catch(async (e) => {
                    console.log(e);
                    delete client.user_list[interaction.user.id];
                    const embed = new MessageEmbed()
                        .setTitle(`購買快速回應角色`)
                        .setDescription(`${msg}\n❌操作時間超時`)
                        .setColor("RED");

                    await interaction.editReply({ embeds: [embed], ephemeral: true });
                })
        }

    }
};
