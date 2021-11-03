const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const guildlog = require("../../path/system_log/guildlog.json");
const guild_channel = require("../../path/system_log/guild_channel.json");
const { dev } = require("../../config.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDefaultPermission(!dev)
        .setDescription('進群密碼')
        .addStringOption(option =>
            option.setName('密碼')
                .setDescription('密碼')
                .setRequired(true)),

    async run(client, interaction) {

        const string = interaction.options.getString('密碼');

        const embed = new MessageEmbed()
            .setTitle('❌密碼錯誤')
            .setDescription('請在檢查一次哦')
            .setColor("RED");

        const embed2 = new MessageEmbed()
            .setTitle('✅密碼正確')
            .setDescription('恭喜進群, 和大家一起開心的聊天吧')
            .setColor("GREEN");

        const embed4 = new MessageEmbed()
            .setTitle('⚠你已經在群內了')
            .setDescription('不需要一直進群的吧?')
            .setColor("YELLOW");


        const useravatarurl = interaction.user.displayAvatarURL({
            format: 'png',
            dynamic: true,
            size: 4096
        });

        const channel = interaction.guild.channels.cache.find(ch => ch.id === guild_channel.join_log_channel.id);
        const channel2 = interaction.guild.channels.cache.find(ch => ch.id === guild_channel.join_leave_log_channel.id);
        const channel3 = interaction.guild.channels.cache.find(ch => ch.id === guild_channel.bak_channel.id);

        if (string === guildlog.join_key) {
            if (interaction.member.roles.cache.some(role => role.name === '鳴鈴的窩')) return interaction.reply({ embeds: [embed4], ephemeral: true });
            const role = interaction.guild.roles.cache.find(r => r.name === '鳴鈴的窩');
            interaction.member.roles.add(role);
            interaction.reply({ embeds: [embed2], ephemeral: true });

            const embed3 = new MessageEmbed()
                .setTitle('進群提示')
                .setThumbnail(useravatarurl)
                .setDescription(interaction.user.toString())
                .addField('分區位置', '鳴鈴的窩')
                .setColor('#feb6ff');

            channel3.send(`+-+join${useravatarurl},${interaction.user.id},1`);
            channel.send({ embeds: [embed3] });
            channel2.send({ embeds: [embed3] });

        } else if (string === guildlog.join_key3) {
            if (interaction.member.roles.cache.some(role => role.name === '自治1區')) return interaction.reply({ embeds: [embed4], ephemeral: true });
            const role = interaction.guild.roles.cache.find(r => r.name === '自治1區');
            interaction.member.roles.add(role);
            interaction.reply({ embeds: [embed2], ephemeral: true });

            const embed3 = new MessageEmbed()
                .setTitle('進群提示')
                .setThumbnail(useravatarurl)
                .setDescription(interaction.user.toString())
                .addField('分區位置', '自治1區')
                .setColor('#ffdf00');

            channel3.send(`+-+join${useravatarurl},${interaction.user.id},3`);
            channel.send({ embeds: [embed3] });
            channel2.send({ embeds: [embed3] });

        } else interaction.reply({ embeds: [embed], ephemeral: true });

    }
}
