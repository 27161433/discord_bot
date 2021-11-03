const fs = require("fs");
const AsciiTable = require("ascii-table");
const diversion = require('./path/system_log/diversion.json');

module.exports = {
    reload: (client) => {

        delete require.cache[require.resolve('./functions.js')]
        const f = require("./functions.js");

        client.commands.clear();
        client.aliases.clear();
        client.functions.clear();
        delete client.user_list;
        client.user_list = {};

        f.forEach(fun => {
            client.functions.set(fun.name, fun);
        });

        let table = new AsciiTable("Commands");
        table.setHeading("Command", "Load status");

        fs.readdirSync("./commands/").forEach(dir => {
            const commands = fs.readdirSync(`./commands/${dir}/`).filter(file => file.endsWith(".js"));

            for (let file of commands) {
                delete require.cache[require.resolve(`./commands/${dir}/${file}`)]

                let pull = require(`./commands/${dir}/${file}`);

                if (pull.name) {
                    client.commands.set(pull.name, pull);
                    table.addRow(file, '\x1b[32mOK\x1b[30m✔✔✔✔✔✔✔✔✔✔✔✔✔✔\x1b[0m');
                } else {
                    table.addRow(file, `\x1b[31mERR\x1b[30m❌❌❌❌❌❌❌❌❌❌❌❌❌❌\x1b[0m`);
                    continue;
                }

                if (pull.aliases && Array.isArray(pull.aliases)) pull.aliases.forEach(alias => client.aliases.set(alias, pull.name));
            }
        });
        console.log(table.toString());

        diversion.forEach(d => {
            setTimeout(() => {
                d.reload = true;
            }, 9000);
            const channel = client.channels.cache.get(d.cid);
            const member = client.guilds.cache.get('725983149259227156').members.cache.get(d.uid);
            const role1 = member.guild.roles.cache.find(r => r.name === `管理員`);
            channel.send(`由於剛才系統執行了熱更新,你目前的進程為舊版進程,功能已不相容目前最新版本\n10秒後將自動退出進程\n若你正在走進群流程請重新再走一次流程\n若你正使用選單系統請重新輸入指令\n造成你的不便深感抱歉`);
            channel.permissionOverwrites.set([
                {
                    id: member.guild.roles.everyone,
                    deny: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                },
                {
                    id: d.uid,
                    allow: ['VIEW_CHANNEL'],
                    deny: ['SEND_MESSAGES']
                },
                {
                    id: role1.id,
                    allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                }
            ])
        });


        console.log('Reload Completed');

    }
}