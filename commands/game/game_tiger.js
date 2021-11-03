const fs = require("fs");
const xp = require('../.././path/user_log/xp.json');
const { MessageEmbed } = require("discord.js");
const { SlashCommandBuilder } = require('@discordjs/builders');
const { dev } = require("../../config.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('game_tiger')
        .setDefaultPermission(!dev)
        .setDescription('拉霸機 \n說明:1次花費20鳴鈴幣\n0個圖案相同:5鳴鈴幣\n2個圖案相同:15鳴鈴幣\n3個圖案相同:250鳴鈴幣')
        .addStringOption(option =>
            option.setName('次數')
                .setDescription('拉霸機')
                .setRequired(true)
                .addChoice('🔹 拉1次', '1')
                .addChoice('🔹 拉10次', '10')),

    async run(client, interaction) {

        const newxp = xp.find(u => u.id === interaction.user.id);

        const string = interaction.options.getString('次數');

        let gtc = 20;
        if (string === '10') gtc = 200

        const fail_embed = new MessageEmbed()
            .setTitle('❌失敗')
            .setDescription(`原因: 鳴鈴幣不足 **${gtc}** `)
            .setColor('RED');

        if (newxp.coin < gtc) return await interaction.reply({ embeds: [fail_embed], ephemeral: true });

        newxp.coin = newxp.coin - gtc;

        let msg = '';
        let award = 0;
        let random_icon = [':apple:', ':pear:', ':peach:', ':cherries:', ':grapes:', ':cherry_blossom:'];

        let icon01 = random_icon[Math.floor(Math.random() * 6)];
        let icon02 = random_icon[Math.floor(Math.random() * 6)];
        let icon03 = random_icon[Math.floor(Math.random() * 6)];

        msg += icon01 + icon02 + icon03 + '\n'

        if (icon01 === icon02 && icon01 === icon03) award = 250
        else if ((icon01 === icon02 && icon01 !== icon03) || (icon01 === icon03 && icon01 !== icon02)) award = 15
        else award = 5

        if (string === '1') {
            newxp.coin = newxp.coin + award;
            fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                if (err) console.log(err);
            });
            return await interaction.reply({ content: msg += `恭喜你獲得 **${award}** 鳴鈴幣`, ephemeral: true });
        }

        for (let i = 0; i < 9; i++) {

            icon01 = random_icon[Math.floor(Math.random() * 6)];
            icon02 = random_icon[Math.floor(Math.random() * 6)];
            icon03 = random_icon[Math.floor(Math.random() * 6)];

            msg += icon01 + icon02 + icon03 + '\n'

            if (icon01 === icon02 && icon01 === icon03) award = award + 250
            else if ((icon01 === icon02 && icon01 !== icon03) || (icon01 === icon03 && icon01 !== icon02)) award = award + 15
            else award = award + 5
        }

        newxp.coin = newxp.coin + award;
        await interaction.reply({ content: msg += `恭喜你獲得 **${award}** 鳴鈴幣`, ephemeral: true });

        fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
            if (err) console.log(err);
        });

    }
};
