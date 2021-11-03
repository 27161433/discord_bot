const fs = require("fs");
const {
    MessageEmbed,
    WebhookClient,
    Collection
} = require("discord.js");
const banmsg = {};
const ban = require('./path/user_log/ban.json');
const read = {};
let pphoto = "";
const xp = require('./path/user_log/xp.json');



const diversion = require('./path/system_log/diversion.json');
const memberaddlog = require(`./path/system_log/memberaddlog.json`);
let atkphoto = new Collection();
const webhookcache = require('./path/system_log/webhookcache.json');
const invitecode = require("./path/system_log/invitecode.json");
const guildlog = require("./path/system_log/guildlog.json");
const guild_channel = require("./path/system_log/guild_channel.json");
const photobak = require('./path/system_log/photobak.json');
const txtadd = require('./path/txtadd.json');
const guild_activity = require('./path/system_log/guild_activity.json');
const mailjs = require('./path/system_log/mail.json');
const filetype = require('file-type');
const got = require('got');
const {
    reload
} = require("./reload.js");

//pixiv相關
const PixivApi = require('pixiv-api-client');
const pixiv = new PixivApi();
const pixiv_image = require('./path/system_log/pixiv_image.json');
const pixiv_login = require('./path/system_log/pixiv_login.json');
const request = require('request');

module.exports = [
    {
        name: "getMember",
        run: (message, toFind = '') => {
            toFind = toFind.toLowerCase();

            let target = message.guild.members.cache.get(toFind);

            if (!target && message.mentions.members)
                target = message.mentions.members.first();

            if (!target && toFind) {
                target = message.guild.members.cache.find(member => {
                    return member.displayName.toLowerCase().includes(toFind) ||
                        member.user.tag.toLowerCase().includes(toFind)
                });
            }

            if (!target)
                target = message.member;

            return target;
        }
    },
    {
        name: "sign_in",
        run: (reaction, user) => {

            if (reaction.message.id === guildlog.sign_msg_id && reaction._emoji.name === '❤️') {
                for (let i = 0; i < xp.length; i++) {
                    if (xp[i].id === user.id) {
                        if (!xp[i].sign_in) xp[i].sign_in = {
                            si: 0,
                            si_day: 0
                        }

                        if (xp[i].sign_in.si === 1) return reaction.message.channel.send(`${user.toString()}, 你今天已經簽到過了哦 \n你目前的累計簽到天數: **${xp[i].sign_in.si_day}**`).then(m => setTimeout(() => m.delete(), 5000));

                        xp[i].sign_in.si = 1;
                        xp[i].sign_in.si_day = xp[i].sign_in.si_day + 1;
                        let coin = xp[i].sign_in.si_day * 5;
                        if (coin >= 100) coin = 100;
                        xp[i].coin = xp[i].coin + coin;

                        fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                            if (err) console.log(err)
                        });

                        const channel = reaction.message.guild.channels.cache.find(c => c.id === guild_channel.sign_in_log_channel.id);
                        const useravatarurl = user.displayAvatarURL({
                            format: 'png',
                            dynamic: true,
                            size: 4096
                        });
                        const embed = new MessageEmbed()
                            .setTitle('簽到完成紀錄')
                            .setThumbnail(useravatarurl)
                            .setDescription(user.toString())
                            .setTimestamp()
                            .setColor("GREEN");

                        channel.send({ embeds: [embed] });

                        reaction.message.channel.send(`${user.toString()}, 簽到成功 \n你獲得了 **${coin}** 鳴鈴幣 \n你目前的累計簽到天數: **${xp[i].sign_in.si_day}**`).then(m => setTimeout(() => m.delete(), 5000));
                        break;
                    }
                }
            }

        }
    },
    {
        name: "gate_join",
        run: (reaction, user) => {

            if (reaction.message.id !== guildlog.gate) return;

            reaction.message.guild.members.fetch(user.id).then(member => {

                if (reaction._emoji.name === '🎰') {
                    const role = reaction.message.guild.roles.cache.find(r => r.name === `小遊戲區`);
                    member.roles.add(role);
                    reaction.message.channel.send(`${member}, 已為你打開通往 **${role.name}** 的大門`).then(m => setTimeout(() => m.delete(), 5000));
                } else if (reaction._emoji.name === '🩸') {
                    const role = reaction.message.guild.roles.cache.find(r => r.name === `重口區`);
                    member.roles.add(role);
                    reaction.message.channel.send(`${member}, 已為你打開通往 **${role.name}** 的大門`).then(m => setTimeout(() => m.delete(), 5000));
                }

            });
        },
    },
    {
        name: "gate_leave",
        run: (reaction, user) => {

            if (reaction.message.id !== guildlog.gate) return;

            reaction.message.guild.members.fetch(user.id).then(member => {

                if (reaction._emoji.name === '🎰') {
                    const role = reaction.message.guild.roles.cache.find(r => r.name === `小遊戲區`);
                    member.roles.remove(role);
                    reaction.message.channel.send(`${member}, 已為你關閉通往 **${role.name}** 的大門`).then(m => setTimeout(() => m.delete(), 5000));
                } else if (reaction._emoji.name === '🩸') {
                    const role = reaction.message.guild.roles.cache.find(r => r.name === `重口區`);
                    member.roles.remove(role);
                    reaction.message.channel.send(`${member}, 已為你關閉通往 **${role.name}** 的大門`).then(m => setTimeout(() => m.delete(), 5000));
                }

            });
        },
    },
    {
        name: "memberadd",
        run: async (client, member) => {

            const useravatarurl = member.user.displayAvatarURL({
                format: 'png',
                dynamic: true,
                size: 2048
            });

            let newxp = xp.find(m => m.id === member.id);

            if (!newxp)
                xp[xp.length] = {
                    id: member.id,
                    xp: 10,
                    level: 0,
                    coin: 0
                };

            fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                if (err) console.log(err)
            });

            let category = member.guild.channels.cache.find(c => c.name == "💠分流器" && c.type == "GUILD_CATEGORY")

            const role1 = member.guild.roles.cache.find(r => r.name === `管理員`);
            const role2 = member.guild.roles.cache.find(r => r.name === `💠發言解鎖`);

            if (category) {
                await member.guild.channels.create('💠分流', {
                    type: 'text',
                    permissionOverwrites: [
                        {
                            id: member.guild.roles.everyone,
                            deny: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                        },
                        {
                            id: member.id,
                            allow: ['VIEW_CHANNEL']
                        },
                        {
                            id: role1.id,
                            allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                        },
                        {
                            id: role2.id,
                            allow: ['SEND_MESSAGES']
                        }
                    ],
                    parent: category.id
                }).then(c => {
                    const d = new Date();
                    diversion[diversion.length] = {
                        math: 0,
                        uid: member.id,
                        cid: c.id,
                        time: d
                    };
                    const channel = member.guild.channels.cache.find(ch => ch.id === c.id);
                    channel.send(`歡迎 <@${member.id}> \n接下來會請你回答一些問題 \n回答完成後即可進群 \n⚠ **輸入過快可能導致被禁言(懲罰時間60分鐘)** ⚠ \n⚠ **從現在起計時閒置超過60分鐘將自動停止進群** ⚠ \n ** 理解後請輸入 ** 1 ** 進行下一步 ** \n輸入 ** 0 ** 來取消進群流程`);

                });
            } else {
                await member.guild.channels.create('💠分流器', {
                    type: 'category',
                    permissionOverwrites: [
                        {
                            id: member.guild.roles.everyone,
                            deny: ['VIEW_CHANNEL']
                        },
                        {
                            id: role1.id,
                            allow: ['VIEW_CHANNEL']
                        }
                    ],
                    position: 0
                });
                category = member.guild.channels.cache.find(c => c.name == "💠分流器" && c.type == "GUILD_CATEGORY");

                await member.guild.channels.create('💠分流', {
                    type: 'text',
                    permissionOverwrites: [
                        {
                            id: member.guild.roles.everyone,
                            deny: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                        },
                        {
                            id: member.id,
                            allow: ['VIEW_CHANNEL']
                        },
                        {
                            id: role1.id,
                            allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                        },
                        {
                            id: role2.id,
                            allow: ['SEND_MESSAGES']
                        }
                    ],
                    parent: category.id
                }).then(c => {
                    const d = new Date();
                    diversion[diversion.length] = {
                        math: 0,
                        uid: member.id,
                        cid: c.id,
                        time: d
                    };
                    const channel = member.guild.channels.cache.find(ch => ch.id === c.id);
                    channel.send(`歡迎 <@${member.id}> \n接下來會請你回答一些問題 \n回答完成後即可進群 \n⚠ **輸入過快可能導致被禁言(懲罰時間60分鐘)** ⚠ \n⚠ **從現在起計時閒置超過60分鐘將自動停止進群** ⚠ \n ** 理解後請輸入 ** 1 ** 進行下一步 ** \n輸入 ** 0 ** 來取消進群流程`);
                });
            }

            fs.writeFile("./path/system_log/diversion.json", JSON.stringify(diversion, null, 4), (err) => {
                if (err) console.log(err)
            });

            member.roles.add(role2);

            const embed = new MessageEmbed()
                .setTitle('人員開始進群流程提示')
                .setThumbnail(useravatarurl)
                .setDescription(member.user.toString())
                .setColor("#00ff77");

            const channel = member.guild.channels.cache.find(ch => ch.id === guild_channel.join_log_channel.id);
            channel.send({ embeds: [embed] });

        },
    },
    {
        name: "initialization",
        run: (client) => {

            const d1 = new Date();

            for (let i = 0; i < guild_activity.length; i++) {
                for (let v = 0; v < guild_activity[i].voice.length; v++) {
                    if (guild_activity[i].voice[v].start_time !== 0) {
                        guild_activity[i].voice[v].start_time = 0;
                    }
                }
            }

            client.guilds.cache.get('725983149259227156').members.cache.forEach(member => {

                if (member.user.bot) return;

                if (member.voice.channel && !member.voice.mute) {

                    if (!guild_activity.find(a => a.id === member.user.id)) guild_activity[guild_activity.length] = {
                        id: member.user.id,
                        text: [],
                        photo: [],
                        voice: []
                    }

                    for (let i = 0; i < guild_activity.length; i++) {

                        if (guild_activity[i].id === member.user.id) {

                            if (!guild_activity[i].voice.find(t => t.cid === member.voice.channel.id)) guild_activity[i].voice[guild_activity[i].voice.length] = {
                                cid: member.voice.channel.id,
                                n: 0,
                                start_time: d1
                            }
                            else {
                                for (let v = 0; v < guild_activity[i].voice.length; v++) {
                                    if (guild_activity[i].voice[v].cid === member.voice.channel.id) {
                                        guild_activity[i].voice[v].start_time = d1;
                                        break;
                                    }
                                }
                            }
                            break;
                        }
                    }
                }
            });

            fs.writeFile("./path/system_log/guild_activity.json", JSON.stringify(guild_activity, null, 4), (err) => {
                if (err) console.log(err)
            });
        },
    },
    {
        name: "timeout",
        run: async (client) => {

            const avatar_url = client.user.displayAvatarURL({
                format: 'png',
                dynamic: true,
                size: 4096
            });
/*
            
            for (const i of xp) {
                if (!i.sign_in) i.sign_in = {
                    si: 0,
                    si_day: 0
                }
                let x = xp1.find(u => i.id === u.id);
                if (!x) return;
                if (i.sign_in.si === 0) i.sign_in.si_day = x.sign_in.si_day + 14;
                i.sign_in.si = 1;
    
    
                fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                    if (err) console.log(err)
                });
            }        
    */

            setInterval(() => {
                const d = new Date();

                let yy = d.getFullYear();
                let mon = d.getMonth() + 1;
                let dd = d.getDate();
                let hh = d.getHours();
                let mm = d.getMinutes();
                let ss = d.getSeconds();

                //簽到重置系統
                sign_timeout(d);

                //簽到提醒系統
                sign_msg(d);

                //每日圖系統
                dayphoto_timeout(d);

                //活躍度系統
                activity_timeout(d);

                //禁言懲罰結束
                ban_timeout(d);

                //進群超時系統
                join_timeout(d);

            }, 1000);


            //簽到重置系統
            function sign_timeout(d) {
                let hh = d.getHours();
                let mm = d.getMinutes();
                let ss = d.getSeconds();

                if (hh === 5 && mm === 0 && ss === 0) {

                    for (let i = 0; i < xp.length; i++) {
                        if (!xp[i].sign_in) xp[i].sign_in = {
                            si: 0,
                            si_day: 0
                        }

                        if (xp[i].sign_in.si === 0) xp[i].sign_in.si_day = 0;

                        xp[i].sign_in.si = 0;
                        fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                            if (err) console.log(err)
                        });
                    }
                }
            }

            //簽到提醒系統
            function sign_msg(d) {
                let hh = d.getHours();
                let mm = d.getMinutes();
                let ss = d.getSeconds();

                if ((hh === 18 && mm === 0 && ss === 0) || (hh === 0 && mm === 0 && ss === 0)) {

                    let msg = '';

                    xp.forEach(m => {
                        if (!m.set) m.set = {};
                        if (m.set.si_msg && m.set.si_msg === 1 && m.sign_in.si === 0) msg += `<@${m.id}>`;
                    });
                    const newxp = xp.find(m => m.set.si_msg && m.set.si_msg === 1 && m.sign_in.si === 0);

                    msg += `\n--------------------\n記得簽到哦`;
                    if (newxp) client.channels.cache.get(guild_channel.lin_log_channel.id).send(msg);
                }
            }

            //每日圖系統
            function dayphoto_timeout(d) {
                let hh = d.getHours();
                let mm = d.getMinutes();
                let ss = d.getSeconds();

                if (hh === 5 && mm === 0 && ss === 0) {
                    if (!pixiv_image[0]) client.channels.cache.get(guild_channel.lin_log_channel.id).send(`主人每日一圖庫存已經沒有了,請盡快幫我補充庫存哦 \n<@725742928907206769>`);
                    else {
                        if (pixiv_image.length < 10) client.channels.cache.get(guild_channel.lin_log_channel.id).send(`主人每日一圖庫存僅剩 ${pixiv_image.length - 1} 張,有空請幫我補充庫存哦 \n<@725742928907206769>`);
                        pixiv.refreshAccessToken(pixiv_login.token).then(() => photo_send());
                    }
                }
            }

            //活躍度系統
            function activity_timeout(d) {

                let hh = d.getHours();
                let mm = d.getMinutes();
                let ss = d.getSeconds();

                if (hh === 5 && mm === 0 && ss === 0) {

                    let nweactivity = [];
                    let top_activity = {
                        topid: "0",
                        topt: 0,
                        topp: 0,
                        topv: 0,
                        tid: "0",
                        t: 0,
                        pid: "0",
                        p: 0,
                        vid: "0",
                        v: 0,
                        tt: 0,
                        tp: 0,
                        tv: 0,
                        ttid: "0",
                        ttn: 0,
                        ttch: [],
                        tpid: "0",
                        tpn: 0,
                        tpch: [],
                        ts: "秒",
                        ts2: "秒",
                        vs: "秒",
                        vs2: "秒"
                    }

                    for (const a of guild_activity) {

                        if (!nweactivity.find(o => o.id === a.id)) nweactivity[nweactivity.length] = {
                            id: a.id,
                            t: 0,
                            tid: "0",
                            tn: 0,
                            p: 0,
                            pid: "0",
                            pn: 0,
                            v: 0,
                            vid: "0",
                            vn: 0
                        }

                        for (const t of a.text) {
                            for (const o of nweactivity) {
                                if (o.id === a.id) {
                                    o.t = o.t + t.n;
                                    if (o.tid !== a.id && t.n > o.tn) {
                                        o.tid = t.cid;
                                        o.tn = t.n;
                                    }
                                }
                            }
                            if (!top_activity.ttch.find(ch => ch.id === t.cid)) top_activity.ttch[top_activity.ttch.length] = {
                                id: t.cid,
                                n: 0
                            }
                            for (const ch of top_activity.ttch) if (ch.id === t.cid) ch.n = ch.n + 1;
                        }

                        for (const p of a.photo) {
                            for (const o of nweactivity) {
                                if (o.id === a.id) {
                                    o.p = o.p + p.n;
                                    if (o.pid !== a.id && p.n > o.pn) {
                                        o.pid = p.cid;
                                        o.pn = p.n;
                                    }
                                }
                            }
                            if (!top_activity.tpch.find(ch => ch.id === p.cid)) top_activity.tpch[top_activity.tpch.length] = {
                                id: p.cid,
                                n: 0
                            }
                            for (const ch of top_activity.tpch) if (ch.id === p.cid) ch.n = ch.n + 1;
                        }

                        for (const v of a.voice) {
                            if (v.start_time !== 0) {
                                const d2 = new Date(v.start_time);
                                v.n = v.n + Math.floor((d - d2) / 1000);
                                v.start_time = 0;
                                const newxp = xp.find(m => m.id === a.id);
                                newxp.xp = newxp.xp + Math.floor((d - d2) / 1000 / 20);
                                fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                                    if (err) console.log(err)
                                });
                            }

                            for (const o of nweactivity) {
                                if (o.id === a.id) {
                                    o.v = o.v + v.n;
                                    if (o.vid !== a.id && v.n > o.vn) {
                                        o.vid = v.cid;
                                        o.vn = v.n;
                                    }
                                }
                            }
                        }
                    }

                    for (const i of nweactivity) {
                        if (i.t + (i.p * 2) + Math.floor(i.v / 60) > top_activity.topt + (top_activity.topp * 2) + Math.floor(top_activity.topv / 60)) {
                            top_activity.topid = i.id;
                            top_activity.topt = i.t;
                            top_activity.topp = i.p;
                            top_activity.topv = i.v;
                        }
                        if (i.t > top_activity.t) {
                            top_activity.tid = i.id;
                            top_activity.t = i.t;
                        }
                        if (i.p > top_activity.p) {
                            top_activity.pid = i.id;
                            top_activity.p = i.p;
                        }
                        if (i.v > top_activity.v) {
                            top_activity.vid = i.id;
                            top_activity.v = i.v;
                        }
                        top_activity.tt = top_activity.tt + i.t;
                        top_activity.tp = top_activity.tp + i.p;
                        top_activity.tv = top_activity.tv + i.v;
                    }

                    for (const i of top_activity.ttch)
                        if (i.n > top_activity.ttn) {
                            top_activity.ttn = i.n;
                            top_activity.ttid = i.id;
                        }

                    for (const i of top_activity.tpch)
                        if (i.n > top_activity.tpn) {
                            top_activity.tpn = i.n;
                            top_activity.tpid = i.id;
                        }

                    const total_top = nweactivity.find(a => a.id === top_activity.topid);
                    const t_top = nweactivity.find(a => a.id === top_activity.tid);
                    const p_top = nweactivity.find(a => a.id === top_activity.pid);
                    const v_top = nweactivity.find(a => a.id === top_activity.vid);

                    let embsd_msg = {
                        ttt: "昨天沒有總活躍度第一",
                        t: "昨天沒人",
                        p: "昨天沒人",
                        v: "昨天沒人",
                        tt: "0",
                        tp: "0"
                    }

                    if (total_top && total_top.v >= 60) {
                        total_top.v = Math.floor(total_top.v / 60);
                        top_activity.ts = '分鐘';
                        if (total_top.v >= 60) {
                            total_top.v = Math.floor(total_top.v / 60);
                            top_activity.ts = '個多小時';
                        }
                    }

                    if (total_top && total_top.vn >= 60) {
                        total_top.vn = Math.floor(total_top.vn / 60);
                        top_activity.ts2 = '分鐘';
                        if (total_top.vn >= 60) {
                            total_top.vn = Math.floor(total_top.vn / 60);
                            top_activity.ts2 = '個多小時';
                        }
                    }

                    if (v_top && v_top.v >= 60) {
                        v_top.v = Math.floor(v_top.v / 60);
                        top_activity.vs = '分鐘';
                        if (v_top.v >= 60) {
                            v_top.v = Math.floor(v_top.v / 60);
                            top_activity.vs = '個多小時';
                        }
                    }

                    if (v_top && v_top.vn >= 60) {
                        v_top.vn = Math.floor(v_top.vn / 60);
                        top_activity.vs2 = '分鐘';
                        if (v_top.vn >= 60) {
                            v_top.vn = Math.floor(v_top.vn / 60);
                            top_activity.vs2 = '個多小時';
                        }
                    }

                    if (total_top && v_top && total_top.id === v_top.id) {
                        top_activity.vs = top_activity.ts;
                        top_activity.vs2 = top_activity.ts2;
                    }

                    let user_p_id = '725985700130062369'

                    if (total_top) user_p_id = total_top.id;


                    const user_p = client.users.cache.find(u => u.id === user_p_id).displayAvatarURL({
                        format: 'png',
                        dynamic: true,
                        size: 4096
                    });

                    if (total_top) {
                        embsd_msg.ttt = `<@${total_top.id}>\n總訊息數: **${total_top.t}**\n總發圖數: **${total_top.p}**\n在語音頻道的時長: **${total_top.v}** ${top_activity.ts}`;
                        if (total_top.t !== 0) embsd_msg.ttt += `\n最活躍的聊天頻道: <#${total_top.tid}> (**${total_top.tn}** 則訊息)`;
                        if (total_top.p !== 0) embsd_msg.ttt += `\n發最多圖的頻道: <#${total_top.pid}> (**${total_top.pn}** 張圖)`;
                        if (total_top.v !== 0) embsd_msg.ttt += `\n最活躍的語音頻道: <#${total_top.vid}> (**${total_top.vn}** ${top_activity.ts2})`
                    }

                    if (t_top) embsd_msg.t = `<@${t_top.id}>\n總訊息數: **${t_top.t}**\n最活躍的聊天頻道: <#${t_top.tid}> (**${t_top.tn}** 則訊息)`;
                    if (p_top) embsd_msg.p = `<@${p_top.id}>\n總發圖數: **${p_top.p}**\n發最多圖的頻道: <#${p_top.pid}> (**${p_top.pn}** 張圖)`;
                    if (v_top) embsd_msg.v = `<@${v_top.id}>\n在語音頻道的時長: **${v_top.v}** ${top_activity.vs}\n最活躍的語音頻道: <#${v_top.vid}> (**${v_top.vn}** ${top_activity.vs2})`;
                    if (t_top) embsd_msg.tt = `**${top_activity.tt}**\n最活躍的聊天頻道: <#${top_activity.ttid}>\n在此聊天的人數: **${top_activity.ttn}**`;
                    if (p_top) embsd_msg.tp = `**${top_activity.tp}**\n發最多圖的頻道: <#${top_activity.tpid}>\n在此發圖的人數: **${top_activity.tpn}**`;
                    const embed = new MessageEmbed()
                        .setTitle(`昨日群組活躍度一覽`)
                        .setThumbnail(user_p)
                        .addField('-------------------------\n總活躍度第一', embsd_msg.ttt)
                        .addField('-------------------------\n聊天第一', embsd_msg.t)
                        .addField('-------------------------\n發圖第一', embsd_msg.p)
                        .addField('-------------------------\n語音第一', embsd_msg.v)
                        .addField('-------------------------\n群內訊息總數', embsd_msg.tt)
                        .addField('-------------------------\n群內發圖總數', embsd_msg.tp)
                        .setColor("BLUE");

                    client.channels.cache.get(guild_channel.activity_log_channel.id).send({ embeds: [embed] });

                    let x = guild_activity.length
                    for (let i = 0; i < x; i++) guild_activity.shift();

                    client.guilds.cache.get('725983149259227156').members.cache.forEach(member => {

                        if (member.user.bot) return;

                        if (member.voice.channel && !member.voice.mute) {

                            if (!guild_activity.find(a => a.id === member.user.id)) guild_activity[guild_activity.length] = {
                                id: member.user.id,
                                text: [],
                                photo: [],
                                voice: []
                            }

                            for (let i = 0; i < guild_activity.length; i++) {

                                if (guild_activity[i].id === member.user.id) {

                                    if (!guild_activity[i].voice.find(t => t.cid === member.voice.channel.id)) guild_activity[i].voice[guild_activity[i].voice.length] = {
                                        cid: member.voice.channel.id,
                                        n: 0,
                                        start_time: d
                                    }
                                    else {
                                        for (let v = 0; v < guild_activity[i].voice.length; v++) {
                                            if (guild_activity[i].voice[v].cid === member.voice.channel.id) {
                                                guild_activity[i].voice[v].start_time = d;
                                                break;
                                            }
                                        }
                                    }
                                    break;
                                }
                            }
                        }
                    });

                    fs.writeFile("./path/system_log/guild_activity.json", JSON.stringify(guild_activity, null, 4), (err) => {
                        if (err) console.log(err)
                    });
                }


            }

            //禁言懲罰結束
            function ban_timeout(d) {
                if (ban[0]) {
                    for (let i = 0; i < ban.length; i++) {
                        const d2 = new Date(ban[i].time);
                        if (d - d2 > 3600000) {
                            client.guilds.cache.get('725983149259227156').members.fetch(ban[i].uid).then(member => {
                                const roleban = client.guilds.cache.get('725983149259227156').roles.cache.find(x => x.name === '禁言');
                                member.roles.remove(roleban);
                                client.channels.cache.get(guild_channel.lin_log_channel.id).send(`<@${member.user.id}>於一個小時前的刷版處罰已結束`);
                                ban.splice(i);
                                fs.writeFile("./path/user_log/ban.json", JSON.stringify(ban, null, 4), (err) => {
                                    if (err) console.log(err)
                                });
                            });
                        }
                    }
                }
            }

            //進群超時系統
            function join_timeout(d) {
                const new_diversion = diversion.find(div => {
                    const d2 = new Date(div.time);
                    if (d - d2 > 3600000) return div;
                    else if (div.reload) return div;
                });
                if (new_diversion) {

                    const d2 = new Date(new_diversion.time);
                    const dformat = [
                        d2.getFullYear().toString().padStart(4, '0'),
                        (d2.getMonth() + 1).toString().padStart(2, '0'),
                        d2.getDate().toString().padStart(2, '0')
                    ].join('/') + ' ' + [
                        d2.getHours().toString().padStart(2, '0'),
                        d2.getMinutes().toString().padStart(2, '0'),
                        d2.getSeconds().toString().padStart(2, '0')
                    ].join(':');

                    if (client.users.fetch(new_diversion.uid) && !new_diversion.reload) client.users.fetch(new_diversion.uid).then(user => user.send(`你在 **台北時間(GMT+8) ${dformat}** 開始入群流程後因為太久沒動靜所以我先將你所在的分流關閉啦 \n等你有空時再重新進群哦 \n如果你對進群流程有任何疑問可以詢問任何一位管理員哦`));

                    client.guilds.cache.get('725983149259227156').members.fetch(new_diversion.uid).then(member => {
                        const role = client.guilds.cache.get('725983149259227156').roles.cache.find(x => x.name === '💠發言解鎖');

                        const useravatarurl = member.user.displayAvatarURL({
                            format: 'png',
                            dynamic: true,
                            size: 4096
                        });

                        const embed = new MessageEmbed()
                            .setTitle('進群流程超時提示')
                            .setThumbnail(useravatarurl)
                            .setDescription(member.user.toString())
                            .setColor("#ff0000"); //紅色

                        client.channels.cache.get(guild_channel.join_log_channel.id).send({ embeds: [embed] });
                        member.roles.remove(role);
                        if (client.channels.cache.get(new_diversion.cid)) client.channels.cache.get(new_diversion.cid).delete();
                        div_delete(member.id);
                    });
                }
            }

            //pixiv發圖模塊
            async function photo_send() {
                await pixiv.illustDetail(pixiv_image[0].pid).then(json => {

                    const photoinfo = {
                        filename: json.illust.title + '.jpg',
                        picture: json.illust.image_urls.large,
                        imagetitle: json.illust.title,
                        username: json.illust.user.name,
                        userid: `${json.illust.user.id}`
                    }
                    request.get({
                        url: photoinfo.picture,
                        headers: {
                            "Referer": "http://www.pixiv.net/"
                        },
                        encoding: null
                    }, (res, err, picture) => {
                        request.post({
                            url: pixiv_login.discord_webhook,
                            formData: {
                                content: `${photoinfo.username}<?!>https://www.pixiv.net/users/${photoinfo.userid}<?!>${photoinfo.imagetitle}<?!>https://www.pixiv.net/artworks/${pixiv_image[0].pid}`,
                                username: `每日圖`,
                                avatar_url: avatar_url,
                                embeds: [{
                                    value: picture,
                                    options: {
                                        filename: photoinfo.filename,
                                        contentType: 'image/jpeg'
                                    }
                                }]
                            }
                        }, () => {
                            pixiv_image[0].args = `${photoinfo.username}<?!>https://www.pixiv.net/users/${photoinfo.userid}<?!>${photoinfo.imagetitle}<?!>https://www.pixiv.net/artworks/${pixiv_image[0].pid}`
                            fs.writeFile("./path/system_log/pixiv_image.json", JSON.stringify(pixiv_image, null, 4), (err) => {
                                if (err) console.log(err)
                            });
                            avatar_send(photoinfo.userid);
                        });

                    });
                });
            }
            async function avatar_send(pid) {
                await pixiv.userDetail(pid).then(json => {

                    const photoinfo = {
                        filename: json.user.title + '.jpg',
                        picture: json.user.profile_image_urls.medium,
                    }

                    request.head(photoinfo.picture, () => {
                        request.get({
                            url: photoinfo.picture,
                            headers: {
                                "Referer": "http://www.pixiv.net/"
                            },
                            encoding: null
                        }, (res, err, picture) => {
                            request.post({
                                url: pixiv_login.discord_webhook,
                                formData: {
                                    content: 'icon000',
                                    username: `每日圖`,
                                    avatar_url: avatar_url,
                                    embeds: [{
                                        value: picture,
                                        options: {
                                            filename: photoinfo.filename,
                                            contentType: 'image/jpeg'
                                        }
                                    }]
                                }
                            });
                        });
                    });
                });
            }

        },
    },
    {
        name: "memberaddQ",
        run: async (client, message, prefix) => {


            const new_diversion = diversion.find(m => m.uid === message.author.id);
            if (message.channel.name === '💠分流' && !new_diversion) message.channel.send('此進程(分流)可能已經故障,若需要強制停止可以輸入 **0**');

            if (message.channel.name === '💠分流' && !new_diversion && message.content === '0') {

                const member = client.guilds.cache.get('725983149259227156').members.cache.get(message.author.id);
                const role1 = member.guild.roles.cache.find(r => r.name === `管理員`);
                message.channel.send('將於3秒後強制關閉');
                message.channel.permissionOverwrites.set([
                    {
                        id: member.guild.roles.everyone,
                        deny: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                    },
                    {
                        id: message.author.id,
                        allow: ['VIEW_CHANNEL'],
                        deny: ['SEND_MESSAGES']
                    },
                    {
                        id: role1.id,
                        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                    }
                ])

                setTimeout(() => {
                    diversion[diversion.length] = {
                        math: 0,
                        uid: message.author.id,
                        cid: message.channel.id,
                        reload: true
                    };
                    if (client.user_list[message.author.id]) delete client.user_list[message.author.id];
                }, 3000);
            }

            if (message.channel === message.guild.channels.cache.find(c => c.name === `📝協議書`) && !message.content.startsWith('*say')) message.delete();
            if (client.user_list[message.author.id]) return;
            if (!new_diversion) return;
            if (new_diversion.reload) return;
            if (message.content.startsWith(prefix)) return message.channel.send('進群流程中無法使用其他指令,如果要使用其他指令請先退出或完成進群流程');

            const useravatarurl = message.author.displayAvatarURL({
                format: 'png',
                dynamic: true,
                size: 4096
            });

            if (message.channel.id === new_diversion.cid) memberaddQ_A();

            //進群問答超時時進行數據刪除
            function timeout(err) {
                let new_diversion = diversion.find(m => m.uid === message.author.id);
                const embed = new MessageEmbed()
                    .setTitle('進群流程手動停止提示')
                    .setThumbnail(useravatarurl)
                    .setDescription(message.author.toString())
                    .addField('超時原因', err)
                    .setColor("#ff0000"); //紅色

                const rolex = message.guild.roles.cache.find(r => r.name === '💠發言解鎖');
                message.member.roles.remove(rolex);

                const channel = message.guild.channels.cache.find(ch => ch.id === guild_channel.join_log_channel.id);
                channel.send({ embeds: [embed] });

                if (client.users.fetch(message.author.id)) client.users.fetch(message.author.id).then(user => user.send(err));

                message.guild.channels.cache.find(c => c.id === new_diversion.cid).delete();
                div_delete(message.author.id);
            }

            //使問答進入下一個階段
            function mathp(m) {
                new_diversion.math = new_diversion.math + m;
                fs.writeFile("./path/system_log/diversion.json", JSON.stringify(diversion, null, 4), (err) => {
                    if (err) console.log(err)
                });
            }

            //進群提示
            function clear(arg) {

                const rolex = message.guild.roles.cache.find(r => r.name === '💠發言解鎖');
                message.member.roles.remove(rolex);
                let tr = '';
                let color = '';
                switch (new_diversion.chtype) {
                    case 1:
                        tr = '鳴鈴的窩';
                        color = '#feb6ff';
                        break;
                    case 2:
                        tr = '遊戲交流區';
                        color = '#00df88';
                        break;
                    case 3:
                        tr = '自治1區';
                        color = '#ffdf00';
                        break;
                    case 4:
                        tr = '運作工廠';
                        color = '#00b2ff';
                        break;
                    default:
                        tr = '鳴鈴的窩';
                        color = '#feb6ff';
                }

                const role = message.guild.roles.cache.find(r => r.name === tr);
                message.member.roles.add(role);
                const channel = message.guild.channels.cache.find(ch => ch.id === guild_channel.join_log_channel.id);

                if (new_diversion.chtype <= 2) {
                    const embed = new MessageEmbed()
                        .setTitle('進群提示')
                        .setThumbnail(useravatarurl)
                        .setDescription(message.author.toString())
                        .addField('分區位置', tr, true)
                        .setColor(color);

                    channel.send({ embeds: [embed] });

                } else if (new_diversion.chtype >= 3) {
                    for (let i = 0; i < invitecode.length; i++) {
                        if (invitecode[i].key === arg) {
                            invitecode[i].t = invitecode[i].t - 1;
                            const embed = new MessageEmbed()
                                .setTitle('進群提示')
                                .setThumbnail(useravatarurl)
                                .setDescription(message.author.toString())
                                .addField('分區位置', tr, true)
                                .addField('使用邀請碼', arg, true)
                                .addField('邀請碼創建者', `<@${invitecode[i].creat_id}>`, true)
                                .addField('邀請碼剩餘使用次數', `${invitecode[i].t}`, true)
                                .setColor(color); //綠色

                            channel.send({ embeds: [embed] });

                            if (invitecode[i].t === 0) invitecode.splice(i);
                            break;
                        }
                    }
                    fs.writeFile("./path/system_log/invitecode.json", JSON.stringify(invitecode, null, 4), (err) => {
                        if (err) console.log(err)
                    });
                }

                const embed = new MessageEmbed()
                    .setTitle('進群提示')
                    .setThumbnail(useravatarurl)
                    .setDescription(message.author.toString())
                    .addField('分區位置', tr, true)
                    .setColor(color);

                const channel2 = message.guild.channels.cache.find(ch => ch.id === guild_channel.join_leave_log_channel.id);
                channel2.send({ embeds: [embed] });

                const channel3 = message.guild.channels.cache.find(ch => ch.id === guild_channel.bak_channel.id);
                channel3.send(`+-+join${useravatarurl},${message.author.id},${new_diversion.chtype}`);

                const channel4 = message.guild.channels.cache.find(ch => ch.id === new_diversion.cid);
                channel4.send(`<@${message.author.id}> \n歡迎進群 \n10秒後將關閉此分流`);

                setTimeout(() => {
                    message.guild.channels.cache.find(c => c.id === new_diversion.cid).delete();
                    div_delete(message.author.id);
                }, 10000)
            }


            //進行問答
            function memberaddQ_A() {

                if (message.content === '0') timeout('手動取消進群');
                else {
                    if (new_diversion.math === 0) {
                        if (message.content === '1') {
                            message.channel.send(memberaddlog[new_diversion.math].Q);
                            mathp(1);
                        } else message.channel.send(`請輸入 **1** 進行下一步\n輸入 **0** 來取消進群流程`);
                    } else if (new_diversion.math === 1) {
                        for (let i = 0; i < diversion.length; i++) {
                            if (diversion[i].uid === message.author.id) {
                                diversion[i].chtype = Math.floor(message.content);
                                fs.writeFile("./path/system_log/diversion.json", JSON.stringify(diversion, null, 4), (err) => {
                                    if (err) console.log(err)
                                });
                                break;
                            }
                        }
                        switch (message.content) {
                            case '1':
                                if (message.member.roles.cache.some(r => ["鳴鈴的窩"].includes(r.name))) return message.channel.send(`你已經在 **鳴鈴的窩** 裡面了哦`);
                                message.channel.send(memberaddlog[new_diversion.chtype].Q[new_diversion.math].q);
                                break;
                            case '2':
                                if (message.member.roles.cache.some(r => ["遊戲交流區"].includes(r.name))) return message.channel.send(`你已經在 **遊戲交流區** 裡面了哦`);
                                message.channel.send(memberaddlog[new_diversion.chtype].Q[new_diversion.math].q);
                                break;
                            case '3':
                                if (message.member.roles.cache.some(r => ["自治區成員"].includes(r.name))) return message.channel.send(`你已經在 **自治聊天區** 裡面了哦`);
                                message.channel.send(memberaddlog[new_diversion.chtype].Q[new_diversion.math].q);
                                break;
                            case '4':
                                if (message.member.roles.cache.some(r => ["運作工廠"].includes(r.name))) return message.channel.send(`你已經在 **小鈴運作工廠** 裡面了哦`);
                                message.channel.send(memberaddlog[new_diversion.chtype].Q[new_diversion.math].q);
                                break;
                            default:
                                return message.channel.send(`請輸入數字 0 或 1 或 2 或 3 或 4`);
                        }
                        mathp(1);

                    } else if (new_diversion.math === 2) {

                        if (new_diversion.chtype === 1 || new_diversion.chtype === 2) {
                            switch (message.content) {
                                case '1':
                                    message.channel.send(memberaddlog[new_diversion.chtype].Q[new_diversion.math].q);
                                    mathp(1);
                                    break;
                                case '2':
                                    mathp(-new_diversion.math + 1);
                                    message.channel.send(`已返回第一個選項`);
                                    message.channel.send(memberaddlog[0].Q);
                                    break;
                                default:
                                    message.channel.send(`請輸入數字 0 或 1 或 2`);
                            }

                        } else if (new_diversion.chtype === 3 || new_diversion.chtype === 4) {
                            const invite_key = invitecode.find(i => i.key === message.content);

                            if ((invite_key && invite_key.ch === 3) || (invite_key && invite_key.ch === 4)) {
                                clear(message.content);
                            } else if (message.content === '2') {
                                mathp(-new_diversion.math + 1);
                                message.channel.send(`已返回第一個選項`);
                                message.channel.send(memberaddlog[0].Q);
                            } else {
                                message.channel.send(`輸入錯誤 \n請再檢查一次哦`);
                            }

                        }

                    } else if (new_diversion.math >= 3) {

                        if (!memberaddlog[new_diversion.chtype].Q[new_diversion.math]) return clear();

                        switch (message.content) {
                            case '1':
                                message.channel.send(memberaddlog[new_diversion.chtype].Q[new_diversion.math].q);
                                mathp(1);
                                break;
                            case '2':
                                mathp(-new_diversion.math + 1);
                                message.channel.send(`已返回第一個選項`);
                                message.channel.send(memberaddlog[0].Q);
                                break;
                            default:
                                message.channel.send(`請輸入數字 0 或 1 或 2`);
                        }
                    }
                }

            }



        },
    },
    {
        name: "sendwebhook",
        run: (message, msg, username, avatarURL, deletesec) => {
            sendwebhook(message, msg, username, avatarURL, deletesec);
        },
    },
    {
        name: "exp",
        run: (message, prefix) => {

            let newxp = xp.find(m => m.id === message.author.id);

            if (!newxp)
                xp[xp.length] = {
                    id: message.author.id,
                    xp: 10,
                    level: 0,
                    coin: 0
                };

            if (message.content.startsWith(prefix)) return;
            newxp.xp = newxp.xp + 1;

            fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                if (err) console.log(err)
            });
        },
    },
    {
        name: "cmds",
        run: async (message, prefix, client) => {

            const useravatarurl = message.author.displayAvatarURL({
                format: 'png',
                dynamic: true,
                size: 4096
            });

            if (!message.content) return;

            if (message.content.startsWith(prefix)) {

                const args = message.content.slice(prefix.length).trim().split(/ +/g);
                const cmd = args.shift().toLowerCase();
                const embed = new MessageEmbed()
                    .setTitle('使用指令提示')
                    .setDescription(message.author.toString())
                    .setThumbnail(useravatarurl)
                    .addField('使用的指令', cmd)
                    .addField('使用的頻道位置', `${message.channel} [詳細位置](https://discordapp.com/channels/${message.guild.id}/${message.channel.id}/${message.id})`)
                    .setColor("#60b9ff");

                if (cmd.length === 0) return;
                let command = client.commands.get(cmd);
                if (!command) command = client.commands.get(client.aliases.get(cmd));

                if (command) {
                    const new_diversion = diversion.find(m => m.uid === message.author.id);
                    if (client.user_list[message.author.id] && cmd !== 'a') return message.channel.send('你目前正在使用選單系統,請先退出選單後再使用指令\n如果確定已退出選單但卻還是跳出此訊息請通知開發者處理');
                    if (new_diversion) return;
                    const channel = message.guild.channels.cache.find(ch => ch.id === guild_channel.cmd_log_channel.id);
                    if (cmd !== 'gt') channel.send({ embeds: [embed] });
                    command.run(client, message, args);
                }
            }
        },
    },
    {
        name: "reward",
        run: (message) => {
            if (!message.attachments.first()) return;

            let mathxp = Math.floor(Math.random() * 10000) + 1;
            let mathc = Math.floor(Math.random() * 10000) + 1;
            let math = Math.floor(Math.random() * 25) + 1;

            if (message.channel === message.guild.channels.cache.find(c => c.name === "✨自治區聊天室")) return;

            for (let i = 0; i < xp.length; i++) {
                if (xp[i].id === message.author.id) {
                    if (mathxp <= 100) {
                        xp[i].coin = xp[i].coin + math;
                        message.channel.send(`小鈴認為你的圖不錯 \n於是把 ${math} 鳴鈴幣偷偷地塞進你的口袋 \n${message.author}你現在有 ${xp[i].coin} 鳴鈴幣`);
                    }
                    if (mathc <= 100) {
                        xp[i].xp = xp[i].xp + math;
                        message.channel.send(`小鈴認為你的圖不錯 \n於是把 ${math} 點經驗偷偷地塞進你的口袋 \n${message.author}你現在有 ${xp[i].xp} 點經驗`);
                    }
                    fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                        if (err) console.log(err)
                    });
                    break;
                }
            }
        },
    },
    {
        name: "ban",
        run: (message, prefix, client) => {
            const useravatarurl = message.author.displayAvatarURL({
                format: 'png',
                dynamic: true,
                size: 4096
            });
            const roleban = message.guild.roles.cache.find(x => x.name === '禁言');
            const d = new Date

            if (client.user_list[message.author.id] && message.channel === message.guild.channels.cache.find(ch => ch.name === `💠分流`)) return;
            if (message.content.startsWith(prefix)) return;
            if (message.content.startsWith('*')) return;
            if (message.channel === message.guild.channels.cache.find(c => c.name === "✨自治區聊天室")) return;
            if (message.attachments.first()) return;
            if (!banmsg[message.author.id]) {
                banmsg[message.author.id] = {
                    msg: 0
                };
            }
            if (banmsg[message.author.id].msg === 3) {
                banmsg[message.author.id].msg = 0;
                message.member.roles.add(roleban);
                message.reply('你有刷版嫌疑,將你禁言1小時');

                const embed = new MessageEmbed()
                    .setTitle('刷版懲罰提示')
                    .setDescription(message.author.toString())
                    .setThumbnail(useravatarurl)
                    .addField('刷版的頻道位置', `${message.channel} [詳細位置](https://discordapp.com/channels/${message.guild.id}/${message.channel.id}/${message.id})`)
                    .setColor("RED");

                const channel = message.guild.channels.cache.find(ch => ch.id === guild_channel.lin_log_channel.id);
                channel.send({ embeds: [embed] });

                const new_ban = ban.find(b => b.uid === message.author.id);
                if (!new_ban)
                    ban[ban.length] = {
                        uid: message.author.id,
                        time: d
                    }

                fs.writeFile("./path/user_log/ban.json", JSON.stringify(ban, null, 4), (err) => {
                    if (err) console.log(err)
                });

                return;
            }
            banmsg[message.author.id].msg = banmsg[message.author.id].msg + 1;
            if (banmsg[message.author.id].msg > 1) return;
            setTimeout(() => {
                banmsg[message.author.id].msg = 0;
            }, 4000);
        },
    },
    {
        name: "dayphoto",
        run: (message) => {

            if (!message.webhookId) return;

            const dayphotochannel = message.guild.channels.cache.find(c => c.name === "📆每日推薦");
            const channel = message.guild.channels.cache.find(ch => ch.id === guild_channel.lin_log_channel.id);
            if (message.channel !== message.guild.channels.cache.find(c => c.name === guild_channel.bak_channel.name)) return;
            if (message.content !== "icon000") return pphoto = message.attachments.first().url;

            const args = pixiv_image[0].args.trim().split('<?!>');
            const embed = new MessageEmbed()
                .setAuthor(args[0], null, args[1])
                .setThumbnail(message.attachments.first().url)
                .setTitle(args[2])
                .setURL(args[3])
                .setImage(pphoto)
                .setColor('RANDOM');

            const embed2 = new MessageEmbed()
                .setTitle('已成功發送每日圖')
                .setThumbnail(pphoto)
                .setDescription(`[${args[2]}](${args[3]})`)
                .setColor('GREEN');

            dayphotochannel.send({ embeds: [embed] }).then(m => {
                m.react('❤️');
                guildlog.sign_msg_id = m.id;
                fs.writeFile("./path/system_log/guildlog.json", JSON.stringify(guildlog, null, 4), (err) => {
                    if (err) console.log(err)
                });
            }).catch(err => console.log(err));

            channel.send({ embeds: [embed2] });

            pixiv_image.shift();
            fs.writeFile("./path/system_log/pixiv_image.json", JSON.stringify(pixiv_image, null, 4), (err) => {
                if (err) console.log(err)
            });

        },
    },
    {
        name: "photobakup",
        run: async (message, client) => {

            if (!message.attachments.first()) return;
            if (client.user_list[message.author.id]) return;
            if (message.channel === message.guild.channels.cache.find(c => c.name === guild_channel.gate_channel.name)) return;
            const bakupchannel = message.guild.channels.cache.find(c => c.name === guild_channel.bak_channel.name);
            const linchannel = message.guild.channels.cache.find(c => c.name === guild_channel.lin_log_channel.name);
            const useravatarurl = message.author.displayAvatarURL({
                format: 'png',
                dynamic: true,
                size: 4096
            });

            message.attachments.forEach(async attachment => {

                const embed = new MessageEmbed()
                    .setTitle('圖片備份失敗提示')
                    .setDescription(message.author.toString())
                    .setThumbnail(useravatarurl)
                    .addField('失敗原因:', '檔案超過8MB')
                    .addField('失敗位置', `${message.channel} [詳細位置](https://discordapp.com/channels/${message.guild.id}/${message.channel.id}/${message.id})`)
                    .setColor("RED");

                //單位換算: http://tw.bestconverter.org/unitconverter_number.php
                if (attachment.size > 8388608) return linchannel.send({ embeds: [embed] });
                //let att = await filetype.fromStream(got.stream(attachment.url));
                //if (!att.mime.startsWith('image')) return;
                if (attachment.height === null) return;

                bakupchannel.send({
                    files: [attachment.url]
                }).then(m => {
                    photobak[photobak.length] = {
                        mid: message.id,
                        bmid: m.id,
                        plink: m.attachments.first().url
                    }
                    fs.writeFile("./path/system_log/photobak.json", JSON.stringify(photobak, null, 4), (err) => {
                        if (err) console.log(err)
                    });
                });
            });

        },
    },
    {
        name: "msglog",
        run: (message) => {

            if (!guild_activity.find(a => a.id === message.author.id)) guild_activity[guild_activity.length] = {
                id: message.author.id,
                text: [],
                photo: [],
                voice: []
            }

            for (let i = 0; i < guild_activity.length; i++) {
                if (guild_activity[i].id === message.author.id) {

                    if (!guild_activity[i].text.find(t => t.cid === message.channel.id)) guild_activity[i].text[guild_activity[i].text.length] = {
                        cid: message.channel.id,
                        n: 0
                    }

                    if (message.attachments.first()) {
                        if (!guild_activity[i].photo.find(p => p.cid === message.channel.id)) guild_activity[i].photo[guild_activity[i].photo.length] = {
                            cid: message.channel.id,
                            n: 0
                        }

                        for (let p = 0; p < guild_activity[i].photo.length; p++) {
                            if (guild_activity[i].photo[p].cid === message.channel.id) {
                                guild_activity[i].photo[p].n = guild_activity[i].photo[p].n + message.attachments.size;
                                break;
                            }
                        }
                    } else
                        for (let t = 0; t < guild_activity[i].text.length; t++) {
                            if (guild_activity[i].text[t].cid === message.channel.id) {
                                guild_activity[i].text[t].n = guild_activity[i].text[t].n + 1;
                                break;
                            }
                        }
                }
            }
            fs.writeFile("./path/system_log/guild_activity.json", JSON.stringify(guild_activity, null, 4), (err) => {
                if (err) console.log(err)
            });
        },
    },
    {
        name: "voice_activity",
        run: (newState, oldState) => {

            if (newState.member.user.bot) return;
            const d1 = new Date();

            if ((newState.mute && oldState.mute) && newState.channel === oldState.channel) return;

            if (newState.mute && newState.channel !== oldState.channel) return;

            const newxp = xp.find(m => m.id === oldState.id);
            if (!newxp)
                xp[xp.length] = {
                    id: oldState.id,
                    xp: 10,
                    level: 0,
                    coin: 0,
                    story: 0
                };

            if ((!newState.channel && oldState.channel) || (newState.mute && newState.channel === oldState.channel)) {
                stop();
            } else if (!newState.mute && !oldState.mute && newState.channel !== oldState.channel && oldState.channel) {
                stop();
                start();
            } else {
                start();
            }

            fs.writeFile("./path/system_log/guild_activity.json", JSON.stringify(guild_activity, null, 4), (err) => {
                if (err) console.log(err)
            });
            fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                if (err) console.log(err)
            });


            function stop() {
                for (let i = 0; i < guild_activity.length; i++) {

                    if (guild_activity[i].id === oldState.id) {

                        for (let v = 0; v < guild_activity[i].voice.length; v++) {
                            if (guild_activity[i].voice[v].cid === oldState.channel.id) {
                                const d2 = new Date(guild_activity[i].voice[v].start_time);
                                guild_activity[i].voice[v].n = guild_activity[i].voice[v].n + Math.floor((d1 - d2) / 1000);
                                guild_activity[i].voice[v].start_time = 0;
                                newxp.xp = newxp.xp + Math.floor((d1 - d2) / 1000 / 20);
                                break;
                            }
                        }
                        break;
                    }
                }
            }

            function start() {
                if (!guild_activity.find(a => a.id === newState.id)) guild_activity[guild_activity.length] = {
                    id: newState.id,
                    text: [],
                    photo: [],
                    voice: []
                }

                for (let i = 0; i < guild_activity.length; i++) {

                    if (guild_activity[i].id === newState.id) {

                        if (!guild_activity[i].voice.find(t => t.cid === newState.channel.id)) guild_activity[i].voice[guild_activity[i].voice.length] = {
                            cid: newState.channel.id,
                            n: 0,
                            start_time: d1
                        }
                        else
                            for (let v = 0; v < guild_activity[i].voice.length; v++) {
                                if (guild_activity[i].voice[v].cid === newState.channel.id) {
                                    guild_activity[i].voice[v].start_time = d1;
                                    break;
                                }
                            }
                        break;
                    }
                }
            }

        },
    },
    {
        name: "record_atkphoto",
        run: (message) => {
            if (message.author.id === '743361367125524490' && message.content.includes("atk.png")) atkphoto[message.channel.id] = message;
            if (message.author.id === '743361367125524490' && message.content.includes("set")) atkphoto[message.content] = message;
        },
    },
    {
        name: "xpcard",
        run: (message, client, guildinfo) => {

            if (message.author.id === guildinfo.authors.lin4) client.channels.cache.get(message.content).send(message.attachments.first().url);
        },
    },
    {
        name: "txtmsg",
        run: (message, client, dev) => {

            const newxp = xp.find(m => m.id === message.author.id);
            const newtxtadd = txtadd.find(m => m.msg === message.content);

            if (!newtxtadd) return;
            if (client.user_list[message.author.id]) return;
            if (dev && message.author.id !== '725742928907206769') return;

            newtxtadd.use = newtxtadd.use + 1;
            fs.writeFile("./path/txtadd.json", JSON.stringify(txtadd, null, 4), (err) => {
                if (err) console.log(err);
            });

            if (!newxp.gf) newxp.gf = [];
            if (!newxp.set) newxp.set = {};

            const gf = newxp.gf.find(gf => gf.use);

            //txt_reply_mode數值說明
            //1.優先使用自己設定的詞
            //2.隨機使用

            let math = 0;
            if (!newxp.set.txt_reply_mode) newxp.set.txt_reply_mode = 2;
            let r_txt = newtxtadd.reply.filter(m => m.id === message.author.id);
            let r_check = r_txt.find(m => m.id === message.author.id);
            if (newxp.set.txt_reply_mode === 1 && r_check) {
                math = Math.floor(Math.random() * r_txt.length);
                t_send(r_txt[math].rep, r_txt[math].embed);
            }
            else {
                math = Math.floor(Math.random() * newtxtadd.reply.length);
                t_send(newtxtadd.reply[math].rep, newtxtadd.reply[math].embed);
            }
            fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                if (err) console.log(err)
            });

            function t_send(rep, eb) {
                const embed = new MessageEmbed()
                    .setImage(rep);

                if (!gf) {
                    if (eb) message.channel.send({ embeds: [embed] });
                    else message.channel.send(rep);
                } else {
                    if (eb) sendwebhook(message, '', gf.name, gf.photo, embed);
                    else sendwebhook(message, rep, gf.name, gf.photo);
                }
            }

        },
    },
    {
        name: "mail_msg",
        run: (message, prefix, client, dev) => {

            if (message.content.startsWith('*')) return;
            if (message.content.startsWith(prefix)) return;
            if (client.user_list[message.author.id]) return;
            if (dev && message.author.id !== '725742928907206769') return;
            const newxp = xp.find(m => m.id === message.author.id);
            if (!newxp.mail) return;
            if (!read[message.author.id]) read[message.author.id] = {};
            if (read[message.author.id].read === 1) return;
            if (newxp.mail[0]) {
                message.reply('您有未讀郵件 \n輸入 `*m` 查看')
                read[message.author.id].read = 1;
                setTimeout(() => {
                    read[message.author.id].read = 0;
                }, 600000);
            }
        },
    },
    {
        name: "list",
        run: (client, uid, ch_id, msg, api) => {
            list(client, uid, ch_id, msg, api);
        }
    }];

function sendwebhook(message, msg, username, avatarURL, embed, deletesec) {

    let cmd = webhookcache[message.channel.id];

    let msg_options = {
        content: msg,
        username: username,
        avatarURL: avatarURL
    };

    if (embed) msg_options = {
        username: username,
        avatarURL: avatarURL,
        embeds: [embed]
    };

    try {
        if (cmd) {
            const webhookClient = new WebhookClient({ id: cmd.webhookid, token: cmd.webhooktoken });

            if (embed) webhookClient.send(msg_options).then(m => {
                if (!deletesec) return;
                message.channel.messages.fetch(m.id).then(msg => setTimeout(() => msg.delete(), deletesec)).catch(e => console.log(e));
            });
            else webhookClient.send(msg_options).then(m => {
                if (!deletesec) return;
                message.channel.messages.fetch(m.id).then(msg => setTimeout(() => msg.delete(), deletesec)).catch(e => console.log(e));
            });

        } else {

            message.channel.send('為提高每次對話的響應速度 \n首次使用將建立快取檔案').then(async m => {

                let webhooks = await m.channel.fetchWebhooks();
                let webhook = webhooks.first();
                if (!webhook) await m.channel.createWebhook('小鈴', {
                    avatar: 'https://cdn.discordapp.com/attachments/741943716360486925/753220891965522060/1596266683100_2.png',
                }).then(async () => {
                    webhooks = await m.channel.fetchWebhooks();
                    webhook = webhooks.first();
                }).catch(console.error);

                let x = {
                    webhookid: webhook.id,
                    webhooktoken: webhook.token
                }
                webhookcache[message.channel.id] = x;

                fs.writeFile("./path/system_log/webhookcache.json", JSON.stringify(webhookcache, null, 4), (err) => {
                    if (err) console.log(err)
                });

                const webhookClient = new WebhookClient({ id: x.webhookid, token: x.webhooktoken });

                setTimeout(() => m.delete(), 3000);

                await m.channel.send('完成').then(m => setTimeout(() => m.delete(), 3000));

                if (embed) webhookClient.send(msg_options).then(m => {
                    if (!deletesec) return;
                    message.channel.messages.fetch(m.id).then(msg => setTimeout(() => msg.delete(), deletesec)).catch(e => console.log(e));
                });
                else webhookClient.send(msg_options).then(m => {
                    if (!deletesec) return;
                    message.channel.messages.fetch(m.id).then(msg => setTimeout(() => msg.delete(), deletesec)).catch(e => console.log(e));
                });

            });
        }
    } catch (e) {
        console.error('webhook err:', e);
    }

}

function div_delete(uid) {
    for (let i = 0; i < diversion.length; i++) {
        if (diversion[i].uid === uid) {
            diversion.splice(i);
            fs.writeFile("./path/system_log/diversion.json", JSON.stringify(diversion, null, 4), (err) => {
                if (err) console.log(err)
            });
            break;
        }
    }
}

async function list(client, uid, ch_id, api) {

    const member = client.guilds.cache.get('725983149259227156').members.cache.get(uid);

    let category = member.guild.channels.cache.find(c => c.name == "💠分流器" && c.type == "GUILD_CATEGORY")
    const role1 = member.guild.roles.cache.find(r => r.name === `管理員`);
    const crole1 = member.guild.roles.cache.find(r => r.name === `紅色`);
    const crole2 = member.guild.roles.cache.find(r => r.name === `白色`);
    const crole3 = member.guild.roles.cache.find(r => r.name === `天藍色`);
    const crole4 = member.guild.roles.cache.find(r => r.name === `深藍色`);
    const crole5 = member.guild.roles.cache.find(r => r.name === `綠色`);
    const crole6 = member.guild.roles.cache.find(r => r.name === `黃色`);
    const crole7 = member.guild.roles.cache.find(r => r.name === `紫色`);
    const crole8 = member.guild.roles.cache.find(r => r.name === `櫻色`);

    let page = [];
    client.user_list[uid] = {};

    if (category) {
        await member.guild.channels.create('💠分流', {
            type: 'text',
            permissionOverwrites: [
                {
                    id: member.guild.roles.everyone,
                    deny: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                },
                {
                    id: member.id,
                    allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                },
                {
                    id: role1.id,
                    allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                }
            ],
            parent: category.id
        }).then(c => {
            const d = new Date();
            diversion[diversion.length] = {
                math: 0,
                uid: member.id,
                cid: c.id,
                time: d
            };
            fs.writeFile("./path/system_log/diversion.json", JSON.stringify(diversion, null, 4), (err) => {
                if (err) console.log(err)
            });
            client.channels.cache.get(c.id).send({ content: `<@${uid}>`, embeds: [msg(uid)] }).then(m => {
                client.user_list[uid].m = 0;
                awaitmsg(m);
            });

        });
    } else {
        await member.guild.channels.create('💠分流器', {
            type: 'category',
            permissionOverwrites: [
                {
                    id: member.guild.roles.everyone,
                    deny: ['VIEW_CHANNEL']
                },
                {
                    id: role1.id,
                    allow: ['VIEW_CHANNEL']
                }
            ],
            position: 0
        });
        category = member.guild.channels.cache.find(c => c.name == "💠分流器" && c.type == "GUILD_CATEGORY");

        await member.guild.channels.create('💠分流', {
            type: 'text',
            permissionOverwrites: [
                {
                    id: member.guild.roles.everyone,
                    deny: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                },
                {
                    id: member.id,
                    allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                },
                {
                    id: role1.id,
                    allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                }
            ],
            parent: category.id
        }).then(c => {
            const d = new Date();
            diversion[diversion.length] = {
                math: 0,
                uid: member.id,
                cid: c.id,
                time: d
            };
            fs.writeFile("./path/system_log/diversion.json", JSON.stringify(diversion, null, 4), (err) => {
                if (err) console.log(err)
            });
            client.channels.cache.get(c.id).send({ content: `<@${uid}>`, embeds: [msg(uid)] }).then(m => {
                client.user_list[uid].m = 0;
                awaitmsg(m);
            });
        });
    }

    let xh_msg = '\n--------------------\n輸入 **h** 回到首頁\n輸入 **x** 離開選單';

    function awaitmsg(m) {
        let new_diversion = diversion.find(m => m.uid === uid);
        const filter = m => m.author.id === uid;

        m.channel.awaitMessages({ filter, max: 1, time: 300000, errors: ['time'] })
            .then(collected => {
                
                if (collected.first().content.startsWith('*')) {
                    awaitmsg(m);
                } else if (collected.first().content.toLowerCase() === 'x') {
                    delete client.user_list[uid];
                    client.channels.cache.get(new_diversion.cid).delete();
                    div_delete(member.id);
                } else if (collected.first().content.toLowerCase() === 'h') {
                    client.user_list[uid].m = 0;
                    m.channel.send({ embeds: [msg(uid)] });
                    awaitmsg(m);
                } else {
                    if (new_diversion.reload) return;
                    if (api === 'set') set(collected.first());
                    else if (api === 'shop') shop(collected.first());
                    else if (api === 'txtinfo') txtinfo(collected.first());
                    else if (api === 'mail') mail(collected.first());
                    else if (api === 'admin') admin(collected.first());
                    awaitmsg(m);
                }
            }).catch((e) => {
                new_diversion = diversion.find(m => m.uid === uid);
                if (!new_diversion) return;
                console.log(e);
                delete client.user_list[uid];
                client.channels.cache.get(new_diversion.cid).delete();
                div_delete(member.id);
            });

    }

    function msg(uid) {

        let msg = '';

        if (api === 'set') {
            msg += `歡迎使用個人設定\n請輸入你想進行設定的選項前方數字以進行設定\n輸入 **x** 即可退出個人設定\n--------------------`;
            msg += `\n1.快速回應功能角色設定`;
            msg += `\n2.抽卡排版顯示樣式設定`;
            msg += `\n3.快速回應功能覆蓋(刪除)許可權設定`;
            msg += `\n4.拉霸機相關顯示設定`;
            msg += `\n5.快速功能回應設定`
            msg += `\n6.簽到提醒功能`
            msg += `\n7.名字顏色設定`
            //msg += `\n.選單背景樣式設定`;
        } else if (api === 'shop') {
            msg += `歡迎來到商城\n請輸入你想購買的物品前方數字以進行購買\n輸入 **x** 即可退出個人設定\n--------------------`;
            msg += `\n1.角色經驗值`;
            msg += `\n2.快速回應角色`;
            msg += `\n3.蘿生門門票`;
            msg += `\n4.簽到提醒功能`;
        } else if (api === 'txtinfo') {
            for (let i = 0; i < Math.ceil(txtadd.length / 10); i++) {
                page[i] = {
                    txt: []
                }
                for (let t = 0; t < txtadd.length; t++) {
                    if (t < (i + 1) * 10 && t >= i * 10) page[i].txt[t - i * 10] = txtadd[t];
                }
            }
            for (let i = 0; i < page[0].txt.length; i++) {
                msg += `${i + 1}.**${page[0].txt[i].msg}**\n`;
            }
            msg += `--------------------\n(1/${page.length})\n輸入 **g + 頁數** 到指定頁數\n輸入 **+** 去下一頁\n輸入 **-** 回上一頁\n輸入 **x** 退出選單`;

        } else if (api === 'mail') {
            const newxp = xp.find(m => m.id === uid);
            if (!newxp.mail) newxp.mail = [];

            if (newxp.mail.length === 0) msg += `<@${uid}>, 你目前沒有任何未讀信件\n--------------------\n輸入 **x** 退出選單`
            for (let i = 0; i < newxp.mail.length; i++) {
                msg += `${i + 1}.**${mailjs[newxp.mail[i].num].title}**(未讀)\n`
            }
            if (newxp.mail.length !== 0) msg += `--------------------\n輸入 **前方數字** 打開郵件\n輸入 **x** 退出選單`

        } else if (api === 'admin') {
            msg += `歡迎使用管理員選單\n請輸入你想設定的目標前方數字調整設定\n輸入 **x** 即可退出選單\n--------------------`;
            msg += `\n1.發送全服信件`;
            msg += `\n2.查看/解除正在被禁言的用戶`;
            msg += `\n3.重啟進程(熱重啟)`;
        }

        client.user_list[uid].msg = msg;

        const embed = new MessageEmbed()
            .setDescription(msg)
            .setColor('BLUE');

        return embed;
    }

    function set(message) {
        let newxp = xp.find(u => u.id === uid);

        if (!newxp.set) newxp.set = {};
        let m1 = '';
        let m2 = '';
        let m3 = '';
        let m4 = '';
        let m5 = '';
        let m6 = '';
        let m7 = '';
        let m8 = '';

        let msg = '';

        if (client.user_list[uid].m === 0) {
            switch (message.content) {
                case '1': {
                    client.user_list[uid].m = 1;
                    let gf = '\n0.小鈴(預設)';
                    if (!newxp.gf) newxp.gf = [];
                    const newgf = newxp.gf.find(gf => gf.use);
                    if (newxp.gf.length === 0 || !newgf) gf += '✅'
                    for (let i = 0; i < newxp.gf.length; i++) {
                        if (newxp.gf[i].use) gf += `\n${i + 1}.${newxp.gf[i].name}✅`
                        else gf += `\n${i + 1}.${newxp.gf[i].name}`
                    }
                    msg = `請輸入前方數字選擇你想使用的角色${gf}${xh_msg}`;
                    break;
                }
                case '2': {
                    client.user_list[uid].m = 2;
                    if (!newxp.set.wish_style) newxp.set.wish_style = 2;
                    if (newxp.set.wish_style === 1) m1 = '✅';
                    else if (newxp.set.wish_style === 2) m2 = '✅';
                    msg = `請輸入前方數字選擇你想調整的設定\n--------------------\n1.抽卡結果僅顯示總計${m1}\n2.抽卡結果全部顯示(預設)${m2}${xh_msg}`;
                    break;
                }
                case '3': {
                    client.user_list[uid].m = 3;
                    if (!newxp.set.txt_permission) m1 = '✅';
                    else if (newxp.set.txt_permission === 1) m2 = '✅';
                    msg = `請輸入前方數字選擇你想調整的設定\n--------------------\n1.僅允許管理員覆蓋(刪除)你的回應(預設)${m1}\n2.允許所有人覆蓋(刪除)你的回應${m2}${xh_msg}`;
                    break;
                }
                case '4': {
                    client.user_list[uid].m = 4;
                    if (!newxp.set.gt_style) newxp.set.gt_style = 1;
                    if (!newxp.set.gt_check) newxp.set.gt_check = 2;
                    if (newxp.set.gt_style === 2) m1 = '(顯示中)';
                    else if (newxp.set.gt_style === 1) m1 = '(不顯示)';
                    if (newxp.set.gt_check === 2) m2 = '(顯示中)';
                    else if (newxp.set.gt_check === 1) m2 = '(不顯示)';
                    msg = `請輸入前方數字選擇你想調整的設定\n--------------------\n1.顯示拉霸機遊戲規則說明${m1}\n2.顯示拉霸機遊玩確認${m2}${xh_msg}`;
                    break;
                }
                case '5': {
                    client.user_list[uid].m = 5;
                    if (!newxp.set.txt_reply_mode) newxp.set.txt_reply_mode = 2;
                    if (newxp.set.txt_reply_mode === 1) m1 = '✅';
                    else if (newxp.set.txt_reply_mode === 2) m2 = '✅';
                    msg = `請輸入前方數字選擇你想調整的設定\n--------------------\n1.優先使用自己設定的詞${m1}\n2.隨機使用(預設)${m2}${xh_msg}`;
                    break;
                }
                case '6': {
                    if (!newxp.set.si_msg) msg = `你尚未購買此功能,無法進行設定${xh_msg}`;
                    else {
                        if (newxp.set.si_msg === 1) m1 = '✅';
                        else if (newxp.set.si_msg === 2) m2 = '✅';
                        msg = `請輸入前方數字選擇你想調整的設定\n--------------------\n功能說明: 若在晚上6點及隔日凌晨0(12)點前未簽到將會在消息區tag你體醒你簽到\n--------------------\n1.開啟提醒${m1}\n2.關閉提醒${m2}${xh_msg}`;
                        client.user_list[uid].m = 6;
                    }
                    break;
                }
                case '7': {
                    if (newxp.level < 1) msg = `此你現在的等級為${newxp.level}, 此功能需要等級 **1** 以上才可使用${xh_msg}`;
                    else {
                        if (message.member.roles.cache.some(role => role.name === '紅色')) m1 = '✅';
                        else if (message.member.roles.cache.some(role => role.name === '白色')) m2 = '✅';
                        else if (message.member.roles.cache.some(role => role.name === '天藍色')) m3 = '✅';
                        else if (message.member.roles.cache.some(role => role.name === '深藍色')) m4 = '✅';
                        else if (message.member.roles.cache.some(role => role.name === '綠色')) m5 = '✅';
                        else if (message.member.roles.cache.some(role => role.name === '黃色')) m6 = '✅';
                        else if (message.member.roles.cache.some(role => role.name === '紫色')) m7 = '✅';
                        else if (message.member.roles.cache.some(role => role.name === '櫻色')) m8 = '✅';

                        msg = `請輸入前方數字選擇你想調整的設定\n--------------------\n1.紅色${m1}\n2.白色${m2}\n3.天藍色${m3}\n4.深藍色${m4}\n5.綠色${m5}\n6.黃色${m6}\n7.紫色${m7}\n8.櫻色${m8}${xh_msg}`;
                        client.user_list[uid].m = 7;
                    }
                    break;
                }
                default: msg = `請輸入前方數字${xh_msg}`;
            }
        } else if (client.user_list[uid].m === 1) {
            if (message.content === '0') {
                for (const i of newxp.gf) i.use = false;
                msg = `已回復預設值${xh_msg}`;
            } else {
                for (let i = 0; i < newxp.gf.length; i++) {
                    if (message.content === `${i + 1}`) {
                        for (const i of newxp.gf) i.use = false;
                        newxp.gf[i].use = true;
                        msg = `設置完成${xh_msg}`;
                        break;
                    }
                    else if (i === newxp.gf.length - 1) msg = `找不到所選角色${xh_msg}`;
                }
            }
        } else if (client.user_list[uid].m === 2) {
            if (message.content === '1') {
                newxp.set.wish_style = 1;
                msg = `設置完成${xh_msg}`;
            } else if (message.content === '2') {
                newxp.set.wish_style = 2;
                msg = `設置完成${xh_msg}`;
            } else msg = `找不到選項${xh_msg}`;

        } else if (client.user_list[uid].m === 3) {
            if (message.content === '1') {
                newxp.set.txt_permission = 0;
                msg = `設置完成${xh_msg}`;
            } else if (message.content === '2') {
                newxp.set.txt_permission = 1;
                msg = `設置完成${xh_msg}`;
            } else msg = `找不到選項${xh_msg}`;

        } else if (client.user_list[uid].m === 4) {
            if (message.content === '1') {
                client.user_list[uid].m = 41;
                msg = `是否顯示拉霸機遊戲規則說明\n--------------------\n顯示請輸入 **1** \n不顯示請輸入 **2**\n輸入 **h** 回到首頁\n輸入 **x** 離開選單`;
            } else if (message.content === '2') {
                client.user_list[uid].m = 42;
                msg = `是否顯示拉霸機遊玩確認\n--------------------\n顯示請輸入 **1** \n不顯示請輸入 **2**\n輸入 **h** 回到首頁\n輸入 **x** 離開選單`;
            } else msg = `找不到選項${xh_msg}`;

        } else if (client.user_list[uid].m === 41) {
            if (message.content === '1') {
                client.user_list[uid].m = 4;
                newxp.set.gt_style = 2;
                if (newxp.set.gt_style === 2) m1 = '(顯示中)';
                else if (newxp.set.gt_style === 1) m1 = '(不顯示)';
                if (newxp.set.gt_check === 2) m2 = '(顯示中)';
                else if (newxp.set.gt_check === 1) m2 = '(不顯示)';
                msg = `設置完成,自動回到上一頁\n--------------------\n`;
                msg += `請輸入前方數字選擇你想調整的設定\n--------------------\n1.顯示拉霸機遊戲規則說明${m1}\n2.顯示拉霸機遊玩確認${m2}${xh_msg}`;
            } else if (message.content === '2') {
                client.user_list[uid].m = 4;
                newxp.set.gt_style = 1;
                if (newxp.set.gt_style === 2) m1 = '(顯示中)';
                else if (newxp.set.gt_style === 1) m1 = '(不顯示)';
                if (newxp.set.gt_check === 2) m2 = '(顯示中)';
                else if (newxp.set.gt_check === 1) m2 = '(不顯示)';
                msg = `設置完成,自動回到上一頁\n--------------------\n`;
                msg += `請輸入前方數字選擇你想調整的設定\n--------------------\n1.顯示拉霸機遊戲規則說明${m1}\n2.顯示拉霸機遊玩確認${m2}${xh_msg}`;
            } else msg = `找不到選項\n--------------------\n輸入 **h** 回到設定首頁\n輸入 **x** 離開選單`;

        } else if (client.user_list[uid].m === 42) {
            if (message.content === '1') {
                client.user_list[uid].m = 4;
                newxp.set.gt_check = 2;
                if (newxp.set.gt_style === 2) m1 = '(顯示中)';
                else if (newxp.set.gt_style === 1) m1 = '(不顯示)';
                if (newxp.set.gt_check === 2) m2 = '(顯示中)';
                else if (newxp.set.gt_check === 1) m2 = '(不顯示)';
                msg = `設置完成,自動回到上一頁\n--------------------\n`;
                msg += `請輸入前方數字選擇你想調整的設定\n--------------------\n1.顯示拉霸機遊戲規則說明${m1}\n2.顯示拉霸機遊玩確認${m2}${xh_msg}`;
            } else if (message.content === '2') {
                client.user_list[uid].m = 4;
                newxp.set.gt_check = 1;
                if (newxp.set.gt_style === 2) m1 = '(顯示中)';
                else if (newxp.set.gt_style === 1) m1 = '(不顯示)';
                if (newxp.set.gt_check === 2) m2 = '(顯示中)';
                else if (newxp.set.gt_check === 1) m2 = '(不顯示)';
                msg = `設置完成,自動回到上一頁\n--------------------\n`;
                msg += `請輸入前方數字選擇你想調整的設定\n--------------------\n1.顯示拉霸機遊戲規則說明${m1}\n2.顯示拉霸機遊玩確認${m2}${xh_msg}`;
            } else msg = `找不到選項${xh_msg}`;

        } else if (client.user_list[uid].m === 5) {
            if (message.content === '1') {
                newxp.set.txt_reply_mode = 1;
                msg = `設置完成${xh_msg}`;
            } else if (message.content === '2') {
                newxp.set.txt_reply_mode = 2;
                msg = `設置完成${xh_msg}`;
            } else msg = `找不到選項${xh_msg}`;

        } else if (client.user_list[uid].m === 6) {
            if (message.content === '1') {
                newxp.set.si_msg = 1;
                if (newxp.set.si_msg === 1) m1 = '✅';
                else if (newxp.set.si_msg === 2) m2 = '✅';
                msg = `設置完成\n--------------------`;
                msg = `請輸入前方數字選擇你想調整的設定\n--------------------\n功能說明: 若在晚上6點及隔日凌晨0(12)點前未簽到將會在消息區tag你體醒你簽到\n--------------------\n1.開啟提醒${m1}\n2.關閉提醒${m2}${xh_msg}`;
            } else if (message.content === '2') {
                newxp.set.si_msg = 2;
                if (newxp.set.si_msg === 1) m1 = '✅';
                else if (newxp.set.si_msg === 2) m2 = '✅';
                msg = `設置完成\n--------------------`;
                msg = `請輸入前方數字選擇你想調整的設定\n--------------------\n功能說明: 若在晚上6點及隔日凌晨0(12)點前未簽到將會在消息區tag你體醒你簽到\n--------------------\n1.開啟提醒${m1}\n2.關閉提醒${m2}${xh_msg}`;
            } else msg = `找不到選項${xh_msg}`;

        } else if (client.user_list[uid].m === 7) {
            if (message.content === '1' || message.content === '2' || message.content === '3' || message.content === '4' || message.content === '5' || message.content === '6' || message.content === '7' || message.content === '8') {
                if (message.member.roles.cache.some(role => role.name === '紅色')) message.member.roles.remove(crole1);
                else if (message.member.roles.cache.some(role => role.name === '白色')) message.member.roles.remove(crole2);
                else if (message.member.roles.cache.some(role => role.name === '天藍色')) message.member.roles.remove(crole3);
                else if (message.member.roles.cache.some(role => role.name === '深藍色')) message.member.roles.remove(crole4);
                else if (message.member.roles.cache.some(role => role.name === '綠色')) message.member.roles.remove(crole5);
                else if (message.member.roles.cache.some(role => role.name === '黃色')) message.member.roles.remove(crole6);
                else if (message.member.roles.cache.some(role => role.name === '紫色')) message.member.roles.remove(crole7);
                else if (message.member.roles.cache.some(role => role.name === '櫻色')) message.member.roles.remove(crole8);
            }
            if (message.content === '1') {
                message.member.roles.add(crole1);
                msg = `設置完成\n--------------------`;
                msg = `請輸入前方數字選擇你想調整的設定\n--------------------\n1.紅色✅\n2.白色\n3.天藍色\n4.深藍色\n5.綠色\n6.黃色\n7.紫色\n8.櫻色${xh_msg}`;
            } else if (message.content === '2') {
                message.member.roles.add(crole2);
                msg = `設置完成\n--------------------`;
                msg = `請輸入前方數字選擇你想調整的設定\n--------------------\n1.紅色\n2.白色✅\n3.天藍色\n4.深藍色\n5.綠色\n6.黃色\n7.紫色\n8.櫻色${xh_msg}`;
            } else if (message.content === '3') {
                message.member.roles.add(crole3);
                msg = `設置完成\n--------------------`;
                msg = `請輸入前方數字選擇你想調整的設定\n--------------------\n1.紅色\n2.白色\n3.天藍色✅\n4.深藍色\n5.綠色\n6.黃色\n7.紫色\n8.櫻色${xh_msg}`;
            } else if (message.content === '4') {
                message.member.roles.add(crole4);
                msg = `設置完成\n--------------------`;
                msg = `請輸入前方數字選擇你想調整的設定\n--------------------\n1.紅色\n2.白色\n3.天藍色\n4.深藍色✅\n5.綠色\n6.黃色\n7.紫色\n8.櫻色${xh_msg}`;
            } else if (message.content === '5') {
                message.member.roles.add(crole5);
                msg = `設置完成\n--------------------`;
                msg = `請輸入前方數字選擇你想調整的設定\n--------------------\n1.紅色\n2.白色\n3.天藍色\n4.深藍色\n5.綠色✅\n6.黃色\n7.紫色\n8.櫻色${xh_msg}`;
            } else if (message.content === '6') {
                message.member.roles.add(crole6);
                msg = `設置完成\n--------------------`;
                msg = `請輸入前方數字選擇你想調整的設定\n--------------------\n1.紅色\n2.白色\n3.天藍色\n4.深藍色\n5.綠色\n6.黃色✅\n7.紫色\n8.櫻色${xh_msg}`;
            } else if (message.content === '7') {
                message.member.roles.add(crole7);
                msg = `設置完成\n--------------------`;
                msg = `請輸入前方數字選擇你想調整的設定\n--------------------\n1.紅色\n2.白色\n3.天藍色\n4.深藍色\n5.綠色\n6.黃色\n7.紫色✅\n8.櫻色${xh_msg}`;
            } else if (message.content === '8') {
                message.member.roles.add(crole8);
                msg = `設置完成\n--------------------`;
                msg = `請輸入前方數字選擇你想調整的設定\n--------------------\n1.紅色\n2.白色\n3.天藍色\n4.深藍色\n5.綠色\n6.黃色\n7.紫色\n8.櫻色✅${xh_msg}`;
            } else msg = `找不到選項${xh_msg}`;

        }

        const embed = new MessageEmbed()
            .setDescription(msg)
            .setColor('BLUE');
        message.channel.send({ embeds: [embed] });
        fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
            if (err) console.log(err);
        });
    }

    async function shop(message) {

        let newxp = xp.find(u => u.id === uid);
        let msg = '';
        if (!newxp.bag) newxp.bag = {};

        if (client.user_list[uid].m === 0) {
            switch (message.content) {
                case '1': {
                    client.user_list[uid].m = 1;
                    msg = `經驗包每包含量為 **100xp** 售價為 **50** 鳴鈴幣\n請以 **包** 為單位輸入你想購買的量(阿拉伯數字)${xh_msg}`;
                    break;
                }
                case '2': {
                    if (newxp.level < 3) msg = `此功能僅限3等以上用戶購買${xh_msg}`;
                    else {
                        client.user_list[uid].m = 2;
                        msg = `快速回應角色每次購買金額皆不同,購買越多價格也越貴\n你已擁有 **${newxp.gf.length}** 個角色\n故本次購買需要的鳴鈴幣為 **${300 + 300 * newxp.gf.length}**\n--------------------\n確認購買請輸入 **1**\n取消請輸入 **h**\n輸入 **x** 離開選單`;
                    }
                    break;
                }
                case '3': {
                    if (newxp.level < 10 || newxp.sign_in.si_day < 14) msg = `此門票僅限10等以上且連續簽到超過14天以上用戶購買\n你現在的等級為${newxp.level}, 累計簽到天數為${newxp.sign_in.si_day}${xh_msg}`;
                    else {
                        if (message.member.roles.cache.some(role => role.name === '蘿生門')) msg = `你已經擁有此門票,無法重複購買\n--------------------\n${client.user_list[uid].msg}`;
                        else {
                            const role = message.guild.roles.cache.find(r => r.name === '蘿生門');
                            message.member.roles.add(role);
                            msg = `此門票 **免費**\n已購買完成,歡迎下次光臨${xh_msg}`;
                        }
                    }
                    break;
                }
                case '4': {
                    if (newxp.level < 1) msg = `此功能僅限1等以上用戶購買\n你現在的等級為${newxp.level}, 無法購買此產品`;
                    else if (newxp.coin < 500) msg = `你現在的鳴鈴幣餘額為${newxp.coin}\n餘額不足 **500** , 無法購買此產品`;
                    else {
                        if (newxp.set.si_msg) msg = `你已經擁有此功能,無法重複購買\n--------------------\n${client.user_list[uid].msg}`;
                        else {
                            client.user_list[uid].m = 4;
                            msg = `是否確認花費 **500** 鳴鈴幣購買簽到提醒功能\n--------------------\n確認請輸入 **1**\n取消請輸入 **h**\n輸入 **x** 離開選單`;
                        }
                    }
                    break;
                }
                default: msg = `請輸入前方數字${xh_msg}`;
            }
        } else if (client.user_list[uid].m === 1) {
            if (isNaN(Math.floor(message.content))) {
                msg = `請確認輸入的是正確的半形阿拉伯數字${xh_msg}`;
            } else if (newxp.coin < Math.floor(message.content) * 50) {
                msg = `你所擁有的鳴鈴幣不足以購買 **${message.content}** 包經驗包${xh_msg}`;
            } else {
                client.user_list[uid].m = 11;
                client.user_list[uid].shop_xp = Math.floor(message.content);
                msg = `是否確認購買 **${message.content}** 包經驗包\n此次購買須扣除 **${message.content} * 50 = ${Math.floor(message.content) * 50}** 鳴鈴幣\n--------------------\n確認購買請輸入 **1** \n取消請輸入 **2**\n輸入 **h** 回到設定首頁\n輸入 **x** 離開選單`;
            }

        } else if (client.user_list[uid].m === 11) {
            if (message.content === '1') {
                newxp.coin = newxp.coin - (client.user_list[uid].shop_xp * 50);
                newxp.xp = newxp.xp + (client.user_list[uid].shop_xp * 100);
                msg = `購買完成,歡迎下次光臨,自動返回上一選項\n--------------------\n`;
                client.user_list[uid].m = 1;
                msg += `經驗包每包含量為 **100xp** 售價為50鳴鈴幣\n請以 **包** 為單位輸入你想購買的量(阿拉伯數字)${xh_msg}`;
            } else if (message.content === '2') {
                msg = `取消購買,自動返回上一選項\n--------------------\n`;
                client.user_list[uid].m = 1;
                msg += `經驗包每包含量為 **100xp** 售價為50鳴鈴幣\n請以 **包** 為單位輸入你想購買的量(阿拉伯數字)${xh_msg}`;
            } else msg = `找不到選項${xh_msg}`;

        } else if (client.user_list[uid].m === 2) {
            if (message.content === '1') {
                if (newxp.coin < (300 + 300 * newxp.gf.length)) {
                    msg = `你目前擁有 **${newxp.coin}** 鳴鈴幣,還不夠購買此項物品喔${xh_msg}`;
                } else {
                    client.user_list[uid].m = 21;
                    msg = `請輸入角色名稱\n--------------------\n當前還未扣款,若想取消請輸入 **h**\n輸入 **x** 離開選單`;
                }
            } else msg = `找不到選項${xh_msg}`;

        } else if (client.user_list[uid].m === 21) {
            client.user_list[uid].shop_c_name = message.content;
            client.user_list[uid].m = 22;
            msg = `請上傳角色圖片或輸入圖片網址(推薦比例為1:1且解析度大於500*500)\n(圖片網址僅支援jpg,png)\n❗上傳圖片僅支援8M以下,若需要設置8M以上的圖片請使用圖片網址\n--------------------\n當前還未扣款,若想取消請輸入 **h**\n輸入 **h** 回到設定首頁\n輸入 **x** 離開選單`;
        } else if (client.user_list[uid].m === 22) {

            if (message.content.startsWith('https')) {

                try {

                    let att = await filetype.fromStream(got.stream(message.content));
                    if (!att.mime.startsWith('image')) return;
                    else {
                        client.user_list[uid].shop_c_photo = message.content;
                        client.user_list[uid].m = 23;
                        const embedx = new MessageEmbed()
                            .setDescription(`以下為範例\n--------------------\n確認購買請輸入 **1**\n重新更改請輸入 **2**\n取消請輸入 **h**\n輸入 **x** 離開選單`)
                            .setColor('BLUE');

                        message.channel.send({ embeds: [embedx] }).then(() => {
                            sendwebhook(message, '這是範例哦~', client.user_list[uid].shop_c_name, client.user_list[uid].shop_c_photo);
                        });
                    }

                } finally {
                    msg = `沒有在這個網址中找到圖片,請確認網址輸入正確${xh_msg}`;
                }

            } else {

                if (!message.attachments.first()) msg = `沒有找到圖片,請重新上傳${xh_msg}`;
                else {

                    if (message.attachments.first().size > 8388608) return msg = `你的圖片超過8MB,請重新上傳檔案大小低於8MB的圖片\n若需要設置8M以上的圖片請使用圖片網址${xh_msg}`;
                    if (message.attachments.first().height === null) return msg = `你上傳的似乎不是圖片,請重新上傳${xh_msg}`;

                    const bakupchannel = message.guild.channels.cache.find(c => c.name === guild_channel.bak_channel.name);
                    msg = `製作中,約需5秒,請稍後`;
                    bakupchannel.send({
                        files: [message.attachments.first().url]
                    }).then(m => {
                        client.user_list[uid].shop_c_photo = m.attachments.first().url;
                        client.user_list[uid].m = 23;
                        const embedx = new MessageEmbed()
                            .setDescription(`以下為範例\n--------------------\n確認購買請輸入 **1**\n重新更改請輸入 **2**\n取消請輸入 **h**\n輸入 **x** 離開選單`)
                            .setColor('BLUE');

                        message.channel.send({ embeds: [embedx] }).then(() => {
                            sendwebhook(message, '這是範例哦~', client.user_list[uid].shop_c_name, client.user_list[uid].shop_c_photo);
                        });
                    });
                }
            }

        } else if (client.user_list[uid].m === 23) {

            if (message.content === '1') {
                if (!newxp.gf) newxp.gf = [];
                newxp.coin = newxp.coin - (300 + 300 * newxp.gf.length);
                for (const i of newxp.gf) i.use = false;
                newxp.gf[newxp.gf.length] = {
                    name: client.user_list[uid].shop_c_name,
                    photo: client.user_list[uid].shop_c_photo,
                    use: true
                }
                msg = `購買完成,歡迎下次光臨,已自動啟用此角色,自動返回上一選項\n--------------------\n`;
                client.user_list[uid].m = 2;
                msg += `快速回應角色每次購買金額皆不同,購買越多價格也越貴 \n你本次購買需要的鳴鈴幣為 **${300 + 300 * newxp.gf.length}**\n--------------------\n確認購買請輸入 **1**\n取消請輸入 **h**\n輸入 **x** 離開選單`;
            } else if (message.content === '2') {
                client.user_list[uid].m = 21;
                msg = `請輸入角色名稱\n--------------------\n當前還未扣款,若想取消請輸入 **h**\n輸入 **x** 離開選單`;
            } else msg = `找不到選項${xh_msg}`;
        } else if (client.user_list[uid].m === 4) {
            if (message.content === '1') {
                newxp.coin = newxp.coin - 500;
                newxp.set.si_msg = 1;
                msg = `購買完成,已自動啟用該功能(若想關閉功能可在個人設定中設定)\n若在晚上6點及隔日凌晨0(12)點前未簽到將會在消息區tag你體醒你簽到\n歡迎下次光臨,自動返回首頁\n--------------------\n`;
                client.user_list[uid].m = 0;
                msg += client.user_list[uid].msg;
            } else msg = `找不到選項${xh_msg}`;
        }
        const embed = new MessageEmbed()
            .setDescription(msg)
            .setColor('BLUE');
        message.channel.send({ embeds: [embed] });

        fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
            if (err) console.log(err);
        });

    }

    function txtinfo(message) {
        let msg = '';

        if (client.user_list[uid].m === 10000000000) {

            if (message.content.toLowerCase() === `b`) {
                client.user_list[uid].m = client.user_list[uid].old_m;
                for (let i = 0; i < page[client.user_list[uid].old_m].txt.length; i++) {
                    msg += `${i + 1}.**${page[client.user_list[uid].m].txt[i].msg}**\n`;
                }
                msg += `--------------------\n(${client.user_list[uid].m + 1}/${page.length})\n輸入 **g(頁數)** 到指定頁數\n輸入 **+** 去下一頁\n輸入 **-** 回上一頁\n輸入 **x** 退出選單`;
                if (client.user_list[uid].c) delete client.user_list[uid].c;
                if (client.user_list[uid].cr) delete client.user_list[uid].cr;
            } else if (client.user_list[uid].c) {

                if (message.content === '1') {
                    let newtxtadd = txtadd.find(m => m.msg === client.user_list[uid].c);
                    const useravatarurl = message.author.displayAvatarURL({
                        format: 'png',
                        dynamic: true,
                        size: 4096
                    });
                    let m = newtxtadd.reply[client.user_list[uid].cr].rep;
                    let mr = m.split('');
                    if (mr.length > 400) {
                        mr.splice(400);
                        m = mr.join('') + '...(字數過長無法完全展開)';
                    }

                    const channel = message.guild.channels.cache.find(ch => ch.id === '860792818518982667');
                    const embed = new MessageEmbed()
                        .setTitle('快速回應刪除紀錄')
                        .setDescription(message.author.toString() + `(${message.author.id})`)
                        .setThumbnail(useravatarurl)
                        .addField('刪除回應', m)
                        .addField('使用的頻道位置', `使用選單系統刪除`)
                        .setColor("RED");

                    channel.send({ embeds: [embed] });

                    newtxtadd.reply.splice(client.user_list[uid].cr, 1);
                    if (newtxtadd.reply.length === 0)
                        for (let a = 0; a < txtadd.length; a++) {
                            if (txtadd[a].msg === client.user_list[uid].c) {
                                txtadd.splice(a, 1);
                                break;
                            }
                        }
                    fs.writeFile("./path/txtadd.json", JSON.stringify(txtadd, null, 4), (err) => {
                        if (err) console.log(err);
                    });
                    for (let i = 0; i < Math.ceil(txtadd.length / 10); i++) {
                        page[i] = {
                            txt: []
                        }
                        for (let t = 0; t < txtadd.length; t++)
                            if (t < (i + 1) * 10 && t >= i * 10) page[i].txt[t - i * 10] = txtadd[t];

                    }
                    msg += '刪除完成\n--------------------\n'
                    msg += `**${client.user_list[uid].c}**\n`
                    if (txtadd.find(m => m.msg === client.user_list[uid].c)) {
                        for (let i = 0; i < page[client.user_list[uid].old_m].txt[client.user_list[uid].r].reply.length; i++) {
                            let m = page[client.user_list[uid].old_m].txt[client.user_list[uid].r].reply[i].rep;
                            let mr = m.split('');
                            if (mr.length > 100) {
                                mr.splice(100);
                                m = mr.join('') + '...(字數過長無法完全展開)';
                            }

                            msg += `--------------------\n${i + 1}. **${m}}**\n創建人: <@${page[client.user_list[uid].old_m].txt[client.user_list[uid].r].reply[i].id}>\n創建時間: ${page[client.user_list[uid].old_m].txt[client.user_list[uid].r].reply[i].date}\n`
                        }
                        msg += `--------------------\n輸入 **b** 回上一頁\n輸入 **-(回應前方數字)** 刪除所選回應 \n輸入 **x** 退出選單`;
                    } else {
                        client.user_list[uid].m = client.user_list[uid].old_m;
                        for (let i = 0; i < page[client.user_list[uid].old_m].txt.length; i++) {
                            msg += `${i + 1}.**${page[client.user_list[uid].m].txt[i].msg}**\n`;
                        }
                        msg += `--------------------\n(${client.user_list[uid].m + 1}/${page.length})\n輸入 **g(頁數)** 到指定頁數\n輸入 **+** 去下一頁\n輸入 **-** 回上一頁\n輸入 **x** 退出選單`;
                    }
                    if (client.user_list[uid].c) delete client.user_list[uid].c;
                    if (client.user_list[uid].cr) delete client.user_list[uid].cr;
                } else if (message.content === '2') {
                    msg += '已取消\n--------------------\n'
                    msg += `**${client.client.user_list[uid].c}**\n`
                    for (let i = 0; i < page[client.user_list[uid].old_m].txt[client.user_list[uid].r].reply.length; i++) {
                        msg += `--------------------\n${i + 1}. **${page[client.user_list[uid].old_m].txt[client.user_list[uid].r].reply[i].rep}**\n創建人: <@${page[client.user_list[uid].old_m].txt[client.user_list[uid].r].reply[i].id}>\n創建時間: ${page[client.user_list[uid].old_m].txt[client.user_list[uid].r].reply[i].date}\n`
                    }
                    msg += `--------------------\n輸入 **b** 回上一頁\n輸入 **-(回應前方數字)** 刪除所選回應 \n輸入 **x** 退出選單`;
                    if (client.user_list[uid].c) delete client.user_list[uid].c;
                    if (client.user_list[uid].cr) delete client.user_list[uid].cr;
                } else msg = `找不到數字,請輸入前方數字`;

            } else if (message.content.toLowerCase().startsWith('-')) {
                let math = Math.floor(message.content.trim().slice(1)) - 1;
                if (isNaN(math)) msg = `找不到數字,請輸入前方數字`;
                else if (!page[client.user_list[uid].old_m].txt[client.user_list[uid].r].reply[math]) msg = `找不到此項,請確認輸入正確`;
                else {
                    const txtxp = xp.find(u => u.id === page[client.user_list[uid].old_m].txt[client.user_list[uid].r].reply[math].id);

                    if (message.member.roles.cache.some(role => role.name === '管理員')) {
                        msg = `此回應為 <@${page[client.user_list[uid].old_m].txt[client.user_list[uid].r].reply[math].id}> 所創建 \n您有管理員權限可更改或移除此觸發詞,是否確定刪除?\n--------------------\n刪除請輸入 **1** \n取消請輸入 **2**\n輸入 **b** 回上一頁\n輸入 **x** 離開選單`
                        client.user_list[uid].c = page[client.user_list[uid].old_m].txt[client.user_list[uid].r].msg;
                        client.user_list[uid].cr = math;
                    }
                    else if (page[client.user_list[uid].old_m].txt[client.user_list[uid].r].reply[math].id === uid) {
                        msg = '是否確定刪除?\n--------------------\n刪除請輸入 **1** \n取消請輸入 **2**\n輸入 **b** 回上一頁\n輸入 **x** 離開選單';
                        client.user_list[uid].c = page[client.user_list[uid].old_m].txt[client.user_list[uid].r].msg;
                        client.user_list[uid].cr = math;
                    }
                    else if (page[client.user_list[uid].old_m].txt[client.user_list[uid].r].reply[math].id !== uid && txtxp.set.txt_permission === 0) {
                        msg = `此回應為 <@${page[client.user_list[uid].old_m].txt[client.user_list[uid].r].reply[math].id}> 所創建\n<@${page[client.user_list[uid].old_m].txt[client.user_list[uid].r].reply[math].id}>允許他人更改或移除此觸發詞,是否確定刪除?\n--------------------\n刪除請輸入 **1** \n取消請輸入 **2**\n輸入 **b** 回上一頁\n輸入 **x** 離開選單`;
                        client.user_list[uid].c = page[client.user_list[uid].old_m].txt[client.user_list[uid].r].msg;
                        client.user_list[uid].cr = math;
                    }
                    else msg = `此回應為 <@${page[client.user_list[uid].old_m].txt[client.user_list[uid].r].reply[math].id}> 所創建 \n若要覆蓋需要本人或具有管理員權限的人才可操作`

                }
            } else msg = '輸入 **b** 回上一頁\n輸入 **x** 退出選單';

        } else {

            if (message.content === `+`) {
                client.user_list[uid].m = client.user_list[uid].m + 1;
                if (client.user_list[uid].m === page.length) client.user_list[uid].m = 0
                for (let i = 0; i < page[client.user_list[uid].m].txt.length; i++) {
                    msg += `${i + 1}.**${page[client.user_list[uid].m].txt[i].msg}**\n`;
                }
                msg += `--------------------\n(${client.user_list[uid].m + 1}/${page.length})\n輸入 **g(頁數)** 到指定頁數\n輸入 **+** 去下一頁\n輸入 **-** 回上一頁\n輸入 **x** 退出選單`;
            } else if (message.content === `-`) {
                client.user_list[uid].m = client.user_list[uid].m - 1;
                if (client.user_list[uid].m < 0) client.user_list[uid].m = page.length - 1;
                for (let i = 0; i < page[client.user_list[uid].m].txt.length; i++) {
                    msg += `${i + 1}.**${page[client.user_list[uid].m].txt[i].msg}**\n`;
                }
                msg += `--------------------\n(${client.user_list[uid].m + 1}/${page.length})\n輸入 **g(頁數)** 到指定頁數\n輸入 **+** 去下一頁\n輸入 **-** 回上一頁\n輸入 **x** 退出選單`;
            } else if (message.content.toLowerCase().startsWith('g')) {
                let math = Math.floor(message.content.trim().slice(1)) - 1;
                if (isNaN(math)) msg = `找不到數字,請輸入前方數字`;
                else if (math >= page.length || math < 0) msg = `找不到此頁,請確認頁數輸入正確`;
                else {
                    client.user_list[uid].m = math;
                    for (let i = 0; i < page[math].txt.length; i++) msg += `${i + 1}.**${page[math].txt[i].msg}**\n`;
                    msg += `--------------------\n(${client.user_list[uid].m + 1}/${page.length})\n輸入 **g(頁數)** 到指定頁數\n輸入 **+** 去下一頁\n輸入 **-** 回上一頁\n輸入 **x** 退出選單`;
                }
            } else {

                for (let r = 0; r < page[client.user_list[uid].m].txt.length; r++) {
                    if (message.content === `${r + 1}`) {
                        client.user_list[uid].old_m = client.user_list[uid].m;
                        msg += `**${page[client.user_list[uid].m].txt[r].msg}**\n`
                        for (let i = 0; i < page[client.user_list[uid].m].txt[r].reply.length; i++) {
                            let m = page[client.user_list[uid].m].txt[r].reply[i].rep;
                            let mr = m.split('');
                            if (mr.length > 100) {
                                mr.splice(100);
                                m = mr.join('') + '...(字數過長無法完全展開)';
                            }
                            msg += `--------------------\n${i + 1}. **${m}**\n創建人: <@${page[client.user_list[uid].m].txt[r].reply[i].id}>\n創建時間: ${page[client.user_list[uid].m].txt[r].reply[i].date}\n`
                        }
                        msg += `--------------------\n輸入 **b** 回上一頁\n輸入 **-(回應前方數字)** 刪除所選回應 \n輸入 **x** 退出選單`;
                        client.user_list[uid].m = 10000000000;
                        client.user_list[uid].r = r;
                        break;
                    } else if (r === page[client.user_list[uid].m].txt.length - 1) msg = `找不到數字,請輸入前方數字`;
                }
            }
        }
        const embed = new MessageEmbed()
            .setDescription(msg)
            .setColor('BLUE');
        message.channel.send({ embeds: [embed] });
    }

    function mail(message) {
        const newxp = xp.find(m => m.id === message.author.id);

        let msg = '';

        if (client.user_list[uid].m === 10000000000) {

            if (message.content.toLowerCase() === `b`) {
                if (newxp.mail.length === 0) msg += `<@${uid}>, 你目前沒有任何未讀信件\n--------------------\n輸入 **x** 退出選單`
                for (let i = 0; i < newxp.mail.length; i++) {
                    msg += `${i + 1}.**${mailjs[newxp.mail[i].num].title}**(未讀)\n`
                }
                if (newxp.mail.length !== 0) msg += `--------------------\n輸入 **前方數字** 打開郵件\n輸入 **x** 退出選單`
                client.user_list[uid].m = 0;
            } else msg += `輸入 **b** 回上一頁\n輸入 **x** 退出選單`;

        } else {
            for (let r = 0; r < newxp.mail.length; r++) {
                if (message.content === `${r + 1}`) {

                    msg += `主旨: **${mailjs[newxp.mail[r].num].title}**\n`
                    msg += `--------------------\n內文:\n${mailjs[newxp.mail[r].num].txt}\n`
                    msg += `--------------------\n附件:\n`
                    if (mailjs[newxp.mail[r].num].att.coin) {
                        newxp.coin = newxp.coin + mailjs[newxp.mail[r].num].att.coin;
                        msg += `鳴鈴幣: **${mailjs[newxp.mail[r].num].att.coin}** (已在開信時自動領取)\n`
                    }
                    if (mailjs[newxp.mail[r].num].att.xp) {
                        newxp.xp = newxp.xp + mailjs[newxp.mail[r].num].att.xp;
                        msg += `經驗值: **${mailjs[newxp.mail[r].num].att.xp}** (已在開信時自動領取)\n`
                    }
                    msg += `--------------------\n輸入 **x** 退出選單\n輸入 **b** 回上一頁`;
                    newxp.mail.splice(r, 1);
                    fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                        if (err) console.log(err)
                    });
                    client.user_list[uid].m = 10000000000;
                    break;
                } else if (r === newxp.mail.length - 1) msg = '找不到數字,請輸入前方數字';
            }
            if (newxp.mail.length === 0) msg += `請輸入前方數字${xh_msg}`

        }
        const embed = new MessageEmbed()
            .setDescription(msg)
            .setColor('BLUE');
        message.channel.send({ embeds: [embed] });

    }

    function admin(message) {
        let newxp = xp.find(u => u.id === uid);

        if (!newxp.set) newxp.set = {};
        let msg = '';

        if (client.user_list[uid].m === 0) {
            switch (message.content) {
                case '1': {
                    client.user_list[uid].m = 1;
                    msg = `請輸入信件標題${xh_msg}`;
                    break;
                }
                case '2': {
                    client.user_list[uid].m = 2;
                    ban.forEach((m, i) => {
                        const d = new Date(m.time);
                        const dformat = [
                            d.getFullYear().toString().padStart(4, '0'),
                            (d.getMonth() + 1).toString().padStart(2, '0'),
                            d.getDate().toString().padStart(2, '0')
                        ].join('/') + ' ' + [
                            d.getHours().toString().padStart(2, '0'),
                            d.getMinutes().toString().padStart(2, '0'),
                            d.getSeconds().toString().padStart(2, '0')
                        ].join(':');

                        msg += `${i + 1}.<@${m.uid}>\n禁言時間: ${dformat} (1小時後解封)\n--------------------\n`
                    });
                    if (ban.length === 0) msg += `目前無正在被禁言的用戶\n--------------------\n`
                    msg += `解除禁言請輸入 **前方數字**\n取消請輸入 **h**\n輸入 **x** 離開選單`

                    break;
                }
                case '3': {
                    client.user_list[uid].m = 3;
                    msg += `是否確認進行熱重啟\n--------------------\n確認請輸入 **1**\n取消請輸入 **h**\n輸入 **x** 離開選單`
                    break;
                }
                default: msg = `請輸入前方數字${xh_msg}`;
            }
        } else if (client.user_list[uid].m === 1) {
            client.user_list[uid].send_mail = {};
            client.user_list[uid].send_mail.title = message.content;
            client.user_list[uid].send_mail.txt = 'undefined';
            client.user_list[uid].send_mail.att = {};
            client.user_list[uid].m = 11;
            msg = `請輸入信件內文${xh_msg}`;
        } else if (client.user_list[uid].m === 11) {
            client.user_list[uid].send_mail.txt = message.content;
            client.user_list[uid].m = 12;
            msg = `是否在信件中加入附件\n--------------------\n加入鳴鈴幣請輸入 **1**\n加入經驗值請輸入 **2**\n跳過請輸入 **3**\n取消請輸入 **h**\n輸入 **x** 離開選單`;
        } else if (client.user_list[uid].m === 12) {
            if (message.content === '1') {
                client.user_list[uid].m = 121;
                msg = `請輸入欲加入的鳴鈴幣數量${xh_msg}`;
            } else if (message.content === '2') {
                client.user_list[uid].m = 122;
                msg = `請輸入欲加入的經驗值數量${xh_msg}`;
            } else if (message.content === '3') {
                client.user_list[uid].m = 13;
                msg = `請檢查以上信件範例是否正確\n--------------------\n正確並送出請輸入 **1**\n重新修改請輸入 **2**\n取消請輸入 **h**\n輸入 **x** 離開選單`;
                let mail_m = '';
                mail_m = `${client.user_list[uid].send_mail.title}\n\n${client.user_list[uid].send_mail.txt}`;
                if (client.user_list[uid].send_mail.att.coin || client.user_list[uid].send_mail.att.xp) mail_m += `\n\n附件:`;
                if (client.user_list[uid].send_mail.att.coin) mail_m += `\n鳴鈴幣: ${client.user_list[uid].send_mail.att.coin}`;
                if (client.user_list[uid].send_mail.att.xp) mail_m += `\n經驗值: ${client.user_list[uid].send_mail.att.xp}`;
                const mail_embed = new MessageEmbed()
                    .setDescription(mail_m)
                    .setColor('RANDOM');
                message.channel.send({ embeds: [mail_embed] });
            } else msg = `找不到選項${xh_msg}`;

        } else if (client.user_list[uid].m === 121) {
            if (isNaN(Math.floor(message.content))) {
                msg = `請確認輸入的是正確的半形阿拉伯數字${xh_msg}`;
            } else {
                client.user_list[uid].m = 12;
                client.user_list[uid].send_mail.att.coin = Math.floor(message.content);
                msg = `已加入 鳴鈴幣: ${client.user_list[uid].send_mail.att.coin}\n--------------------\n是否在信件中加入其他附件\n--------------------\n加入鳴鈴幣請輸入 **1**\n加入經驗值請輸入 **2**\n跳過請輸入 **3**\n取消請輸入 **h**\n輸入 **x** 離開選單`;
            }

        } else if (client.user_list[uid].m === 122) {
            if (isNaN(Math.floor(message.content))) {
                msg = `請確認輸入的是正確的半形阿拉伯數字${xh_msg}`;
            } else {
                client.user_list[uid].m = 12;
                client.user_list[uid].send_mail.att.xp = Math.floor(message.content);
                msg = `已加入 經驗值: ${client.user_list[uid].send_mail.att.xp}\n--------------------\n是否在信件中加入其他附件\n--------------------\n加入鳴鈴幣請輸入 **1**\n加入經驗值請輸入 **2**\n跳過請輸入 **3**\n取消請輸入 **h**\n輸入 **x** 離開選單`;
            }

        } else if (client.user_list[uid].m === 13) {
            if (message.content === '1') {
                client.user_list[uid].m = 0;
                mailjs[mailjs.length] = client.user_list[uid].send_mail;
                xp.forEach(m => {
                    if (!m.mail) m.mail = [];
                    m.mail[m.mail.length] = {
                        num: mailjs.length - 1
                    }
                });
                fs.writeFile("./path/system_log/mail.json", JSON.stringify(mailjs, null, 4), (err) => {
                    if (err) console.log(err);
                });

                msg = `已送出\n--------------------\n${client.user_list[uid].msg}`;
            } else if (message.content === '2') {
                client.user_list[uid].m = 1;
                msg = `請輸入信件標題${xh_msg}`;
            } else msg = `找不到選項${xh_msg}`;

        } else if (client.user_list[uid].m === 2) {
            for (let i = 0; i < ban.length; i++) {
                if (message.content === `${i + 1}`) {
                    client.user_list[uid].m = 21;
                    client.user_list[uid].ban_math = i;
                    msg = `是否確認解除禁言\n確認請輸入 **1**\n取消請輸入 **h**\n輸入 **x** 離開選單`;
                    break;
                } else if (i === ban.length - 1) msg = '找不到數字,請輸入前方數字';
            }
            if (ban.length === 0) msg = '找不到數字,請輸入前方數字';

        } else if (client.user_list[uid].m === 21) {
            if (message.content === '1') {
                const roleban = member.guild.roles.cache.find(x => x.name === '禁言');
                member.roles.remove(roleban);
                client.channels.cache.get(guild_channel.lin_log_channel.id).send(`<@${member.user.id}>的禁言懲罰已被<@${uid}>解除`);
                ban.splice(client.user_list[uid].ban_math);
                fs.writeFile("./path/user_log/ban.json", JSON.stringify(ban, null, 4), (err) => {
                    if (err) console.log(err)
                });

                msg = `已解除\n--------------------\n`;
                client.user_list[uid].m = 2;
                ban.forEach((m, i) => {
                    const d = new Date(m.time);
                    const dformat = [
                        d.getFullYear().toString().padStart(4, '0'),
                        (d.getMonth() + 1).toString().padStart(2, '0'),
                        d.getDate().toString().padStart(2, '0')
                    ].join('/') + ' ' + [
                        d.getHours().toString().padStart(2, '0'),
                        d.getMinutes().toString().padStart(2, '0'),
                        d.getSeconds().toString().padStart(2, '0')
                    ].join(':');

                    msg += `${i}.<@${m.uid}>\n禁言時間: ${dformat} (1小時後解封)\n--------------------\n`
                });
                if (ban.length === 0) msg += `目前無正在被禁言的用戶\n--------------------\n`
                msg += `解除禁言請輸入 **前方數字**\n取消請輸入 **h**\n輸入 **x** 離開選單`

            } else msg = `找不到選項${xh_msg}`;

        } else if (client.user_list[uid].m === 3) {
            if (message.content === '1') {
                reload(client);
                msg = `熱重啟完成,即將退出分流`;
            } else msg = `找不到選項${xh_msg}`;
        }

        const embed = new MessageEmbed()
            .setDescription(msg)
            .setColor('BLUE');
        message.channel.send({ embeds: [embed] });
        fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
            if (err) console.log(err);
        });

    }
}
