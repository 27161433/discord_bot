const game_wish = require('../../path/system_log/wish_data.json');
const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require("fs");
const xp = require('../.././path/user_log/xp.json');
const { MessageEmbed } = require("discord.js");
const guild_channel = require("../../path/system_log/guild_channel.json");
const wait = require('util').promisify(setTimeout);
const { dev } = require("../../config.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('game_wish')
        .setDefaultPermission(!dev)
        .setDescription('抽卡 \n說明:不花費鳴鈴幣\n也不會獲得獎勵\n測運氣用\n抽卡概率比照原神UP池:\n5⭐: 0.6%\n4⭐: 5.1%\n3⭐: 94.3%\n10連保底4⭐一張\n每90抽保底5⭐一張\n本期UP池: 雷電將軍')
        .addStringOption(option =>
            option.setName('次數')
                .setDescription('抽卡')
                .setRequired(true)
                .addChoice('🔹 抽1次', '1')
                .addChoice('🔹 抽10次', '10')),
    async run(client, interaction) {

        let output = [];
        const string = interaction.options.getString('次數');
        const newxp = xp.find(m => m.id === interaction.user.id);
        let embed_color = "BLUE";

        if (!newxp.wish) newxp.wish = {
            s: 0,
            l: 0,
            xs: false,
            xl: false
        };

        wish_function();

        if (string === '1') {

            fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                if (err) console.log(err);
            });

            let msg = '';

            if (!newxp.wish.xl) msg += `距離5星小保底還有 ${90 - newxp.wish.l} 抽\n`;
            else msg += `距離5星大保底還有 ${90 - newxp.wish.l} 抽\n`;

            if (!newxp.wish.xs) msg += `距離4星小保底還有 ${10 - newxp.wish.s} 抽`;
            else msg += `距離4星大保底還有 ${10 - newxp.wish.s} 抽`;

            const embed = new MessageEmbed()
                .setTitle(`恭喜你抽中 ${output[0].type} ${output[0].name}`)
                .setDescription(msg)
                .setImage(output[0].photo)
                .setColor(embed_color);

            return await interaction.reply({ embeds: [embed], ephemeral: false });
        }

        for (let i = 0; i < 9; i++) wish_function();

        fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
            if (err) console.log(err);
        });

        let msg = '';

        if (!newxp.wish.xl) msg += `距離5星小保底還有 ${90 - newxp.wish.l} 抽\n`;
        else msg += `距離5星大保底還有 ${90 - newxp.wish.l} 抽\n`;

        if (!newxp.wish.xs) msg += `距離4星小保底還有 ${10 - newxp.wish.s} 抽`;
        else msg += `距離4星大保底還有 ${10 - newxp.wish.s} 抽`;

        output.push(interaction.user.id.toString());

        let p = 'a01';
        for (let i = 0; i < 10; i++) p += `${output[i].icon},${output[i].name},${output[i].type}<$!$>`;

        p += output[10];

        client.channels.cache.get(guild_channel.bak_channel.id).send({ content: p });

        await interaction.deferReply();
        let o = 0;

        photo_service(o);

        async function photo_service(o) {
            o++;
            if (o > 8) return await interaction.editReply({ content: 'photo_service回應超時(err: 32)', ephemeral: false });
            await wait(500);

            const post = client.wish.find(w => w.id === interaction.user.id);
            if (!post) return photo_service(o)

            const embed = new MessageEmbed()
                .setDescription(msg)
                .setImage(post.url)
                .setColor("PURPLE");

            client.wish.find((w, i) => {
                if (w.id === interaction.user.id) return client.wish.splice(i, 1);
            })

            await interaction.editReply({ embeds: [embed], ephemeral: false });
        }

        function wish_function() {
            let wish = Math.random();
            let wish_up = Math.random();

            newxp.wish.s = newxp.wish.s + 1;
            newxp.wish.l = newxp.wish.l + 1;

            if (newxp.wish.l >= 90) {
                if (wish_up > 0.5 || newxp.wish.xl) {
                    output.push(game_wish["5s"].up[0]);
                    newxp.wish.xl = false;
                } else {
                    output.push(game_wish["5s"].normal[Math.floor(Math.random() * (game_wish["5s"].normal.length - 1))]);
                    newxp.wish.xl = true;
                }
                embed_color = "YELLOW";
                newxp.wish.l = 0;
                return;
            } else if (newxp.wish.s >= 10) {
                if (wish_up > 0.5 || newxp.wish.xs) {
                    output.push(game_wish["4s"].up[Math.floor(Math.random() * (game_wish["4s"].up.length - 1))]);
                    newxp.wish.xs = false;
                } else {
                    output.push(game_wish["4s"].normal[Math.floor(Math.random() * (game_wish["4s"].normal.length - 1))]);
                    newxp.wish.xs = true;
                }
                embed_color = "PURPLE";
                newxp.wish.s = 0;
                return;
            }

            if (wish < 0.006) {
                if (wish_up > 0.5 || newxp.wish.xl) {
                    output.push(game_wish["5s"].up[0]);
                    newxp.wish.xl = false;
                } else {
                    output.push(game_wish["5s"].normal[Math.floor(Math.random() * (game_wish["5s"].normal.length - 1))]);
                    newxp.wish.xl = true;
                }
                embed_color = "YELLOW";
                newxp.wish.l = 0;
            } else if (wish < 0.051) {
                if (wish_up > 0.5 || newxp.wish.xs) {
                    output.push(game_wish["4s"].up[Math.floor(Math.random() * (game_wish["4s"].up.length - 1))]);
                    newxp.wish.xs = false;
                } else {
                    output.push(game_wish["4s"].normal[Math.floor(Math.random() * (game_wish["4s"].normal.length - 1))]);
                    newxp.wish.xs = true;
                }
                embed_color = "PURPLE";
                newxp.wish.s = 0;
            } else output.push(game_wish["3s"].normal[Math.floor(Math.random() * (game_wish["3s"].normal.length - 1))]);


        }


    }
};
