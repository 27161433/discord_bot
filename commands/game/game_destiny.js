const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require("discord.js");
const { dev } = require("../../config.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('game_destiny')
        .setDefaultPermission(!dev)
        .setDescription('抽卡運氣測試\n說明:不花費鳴鈴幣\n也不會獲得獎勵\n測運氣用\n可指定抽卡機率與保底次數\n不指定則預設機率2%與保底200抽\n機率最大99.9最小0.1\n保底最大次數1000最小2')
        .addNumberOption(option =>
            option.setName('機率')
                .setDescription('預設2%\n輸入數字即可(省略%)\n機率最大99.9最小0.1'))
        .addNumberOption(option =>
            option.setName('保底次數')
                .setDescription('預設200抽\n輸入數字即可\n保底最大次數1000最小2')),
    async run(client, interaction) {

        const num1 = interaction.options.getNumber('機率');
        const num2 = interaction.options.getNumber('保底次數');

        let percent = 2 * 0.01;
        let number = 200;

        if (num1) percent = Math.floor(num1 * 100) / 100 * 0.01;
        if (num2) number = num2;

        if (percent > 99.9 * 0.01) return await interaction.reply({ content: '超過機率上限(最大機率99.9)', ephemeral: true });
        if (percent < 0.1 * 0.01) return await interaction.reply({ content: '低於機率下限(最低機率0.1)', ephemeral: true });
        if (number > 1000) return await interaction.reply({ content: '超過保底次數上限(最大次數1000)', ephemeral: true });
        if (number < 2) return await interaction.reply({ content: '低於保底次數下限(最小次數2)', ephemeral: true });

        let result = '保底';

        for (let i = 0; i < number; i++) {
            if (Math.random() < percent) {
                result = (i + 1).toString();
                break;
            }
        }

        let msg = `設定機率: ${percent * 100}%\n保底次數: ${number}次\n抽取到限定角色的次數: ${result}`;

        const embed = new MessageEmbed()
            .setTitle('🎉抽取結果')
            .setDescription(msg)
            .setColor("RANDOM");

        await interaction.reply({ embeds: [embed], ephemeral: false });

    }
};
