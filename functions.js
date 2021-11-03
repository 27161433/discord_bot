const fs = require("fs");
const {
    MessageEmbed,
    WebhookClient,
    MessageActionRow,
    MessageButton,
    MessageAttachment
} = require("discord.js");
const banmsg = {};
const ban = require('./path/user_log/ban.json');
const read = {};
const xp = require('./path/user_log/xp.json');

const webhookcache = require('./path/system_log/webhookcache.json');
const guildlog = require("./path/system_log/guildlog.json");
const guild_channel = require("./path/system_log/guild_channel.json");
const reply_data = require('./path/reply_data.json');
const guild_activity = require('./path/system_log/guild_activity.json');
const config = require("./config.json");
const {
    reload
} = require("./reload.js");
const schedule = require('node-schedule');
const { ToadScheduler, SimpleIntervalJob, Task } = require('toad-scheduler');
const scheduler = new ToadScheduler();

//pixiv相關
const PixivApi = require('pixiv-api-client');
const pixiv = new PixivApi();
const pixiv_image = require('./path/system_log/pixiv_image.json');
const pixiv_login = require('./path/system_log/pixiv_login.json');
const axios = require('axios');

module.exports = [
    {
        name: "sign_in",
        run: (reaction, user) => {

            if (reaction.message.id === guildlog.sign_msg_id && reaction._emoji.name === '❤️') {

                let newxp = xp.find(m => m.id === user.id);

                if (newxp.sign_in.si) return;

                newxp.sign_in.si = true;
                newxp.sign_in.si_day++;

                let coin = newxp.sign_in.si_day * 5;
                if (coin >= 100) coin = 100;
                newxp.coin = newxp.coin + coin;

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

                const embed2 = new MessageEmbed()
                    .setTitle('✅簽到成功')
                    .setThumbnail(useravatarurl)
                    .setDescription(`▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n簽到獎勵: **${coin}** 鳴鈴幣\n\n累計簽到天數: **${newxp.sign_in.si_day}** 天`)
                    .setColor("GREEN");

                reaction.message.channel.send({ content: user.toString(), embeds: [embed2] }).then(m => setTimeout(() => m.delete(), 8000));
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
        run: async (member) => {

            const useravatarurl = member.user.displayAvatarURL({
                format: 'png',
                dynamic: true,
                size: 4096
            });

            let newxp = xp.find(m => m.id === member.id);

            if (!newxp) xp.push({
                id: member.id,
                xp: 0,
                level: 0,
                coin: 0,
                mail: [],
                gf: [],
                set: {},
                sign_in: {
                    si: false,
                    si_day: 0
                },
                wish: {
                    s: 0,
                    l: 0,
                    xs: false,
                    xl: false
                }
            });

            fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                if (err) console.log(err)
            });

            const embed = new MessageEmbed()
                .setTitle('新朋友進群')
                .setThumbnail(useravatarurl)
                .setDescription(`但他在門口打手槍\n不知道什麼時候才要進來\n\n${member.user.toString()}`)
                .setColor("BLUE");

            const channel = member.guild.channels.cache.find(ch => ch.id === guild_channel.join_leave_log_channel.id);
            channel.send({ embeds: [embed] });

        },
    },
    {
        name: "initialization",
        run: (client, dev) => {

            //禁言懲罰結束
            ban_timeout();

            voice_activity_write();

            voice_activity();

            if (dev) dev_cmd_permission();

            //禁言懲罰結束
            function ban_timeout() {
                const channel = client.channels.cache.get(guild_channel.lin_log_channel.id);
                const d = new Date();
                if (!ban[0]) return;
                for (let i = 0; i < ban.length; i++) {
                    const d2 = new Date(ban[i].time);
                    if (d - d2 < 3600000) continue;
                    client.guilds.cache.get('725983149259227156').members.fetch(ban[i].uid).then(member => {
                        const roleban = member.guild.roles.cache.find(x => x.name === '禁言');
                        member.roles.remove(roleban);

                        const useravatarurl = member.user.displayAvatarURL({
                            format: 'png',
                            dynamic: true,
                            size: 4096
                        });

                        const embed = new MessageEmbed()
                            .setTitle('懲罰解除提示')
                            .setDescription('恭喜出獄')
                            .setThumbnail(useravatarurl)
                            .setColor("GREEN");

                        channel.send({ content: `<@${ban[i].uid}>`, embeds: [embed] });
                        ban.splice(i, 1);
                        fs.writeFile("./path/user_log/ban.json", JSON.stringify(ban, null, 4), (err) => {
                            if (err) console.log(err)
                        });
                    });
                }
            }

            //音頻活躍度紀錄
            function voice_activity() {

                guild_activity.forEach(a => a.voice.forEach(v => v.start_time = null));
                const d = Math.round(new Date().getTime() / 1000);

                client.guilds.cache.get('725983149259227156').members.cache.forEach(member => {
                    if (member.user.bot) return;

                    if (!member.voice.channel || member.voice.mute) return;

                    let nga = guild_activity.find(a => a.id === member.user.id);

                    if (!nga) guild_activity.push({
                        id: member.user.id,
                        text: [],
                        photo: [],
                        voice: []
                    });
                    nga = guild_activity.find(a => a.id === member.user.id);

                    let nga_voice = nga.voice.find(v => v.id === member.voice.channel.id);

                    if (!nga_voice) nga.voice.push({
                        id: member.voice.channel.id,
                        n: 0,
                        start_time: null,
                        stop: false,
                        vxp: 0
                    });

                    nga_voice = nga.voice.find(v => v.id === member.voice.channel.id);

                    nga_voice.start_time = d;

                    fs.writeFile("./path/system_log/guild_activity.json", JSON.stringify(guild_activity, null, 4), (err) => {
                        if (err) console.log(err)
                    });

                });
            }

            //測試版取消指令權限
            async function dev_cmd_permission() {
                let cmd = await client.guilds.cache.get(config.guildId).commands.fetch();
                const fullPermissions = [];

                cmd.forEach(m => {
                    fullPermissions.push({
                        id: m.id,
                        permissions: [{
                            id: '725742928907206769',
                            type: 'USER',
                            permission: true,
                        }],
                    })
                });

                await client.guilds.cache.get(config.guildId).commands.permissions.set({ fullPermissions });

            }

            function voice_activity_write() {
                const task = new Task('write', () => {
                    const d = Math.ceil(new Date().getTime() / 1000);
                    guild_activity.forEach(a => {
                        a.voice.forEach(v => {
                            if (v.start_time) {
                                v.n = v.n + (d - v.start_time);
                                v.vxp = v.vxp + 2;
                                if (v.vxp >= 30) {
                                    let newxp = xp.find(m => m.id === a.id);
                                    newxp.xp = newxp.xp + 1;
                                    fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                                        if (err) console.log(err);
                                    });
                                    v.vxp = 0;
                                }
                                if (v.stop) {
                                    v.start_time = null;
                                    v.stop = false;
                                } else v.start_time = d;
                            }
                        });
                    });
                    fs.writeFile("./path/system_log/guild_activity.json", JSON.stringify(guild_activity, null, 4), (err) => {
                        if (err) console.log(err);
                    });
                });
                const job = new SimpleIntervalJob({ seconds: 2, }, task, 'write');
                scheduler.addSimpleIntervalJob(job);
            }

        },
    },
    {
        name: "timeout",
        run: async (client, dev) => {

            const rule = new schedule.RecurrenceRule();
            const set_hour = [];
            for (let i = 0; i < 24; i++) set_hour.push(i);
            rule.hour = set_hour;
            rule.minute = 0;
            rule.second = 0;

            const j = schedule.scheduleJob(rule, d => {

                try {
                    if (!dev) join_key_random();
                } catch (err) {
                    return client.channels.cache.get(guild_channel.lin_log_channel.id).send({ embeds: [err_embed(err, '進群密碼重置系統')] });
                }

                if (d.getHours() === 5) {
                    try {
                        sign_timeout();
                    } catch (err) {
                        return client.channels.cache.get(guild_channel.lin_log_channel.id).send({ embeds: [err_embed(err, '簽到重置系統')] });
                    }

                    try {
                        pixiv.refreshAccessToken(pixiv_login.token).then(() => photo_send(client));
                    } catch (err) {
                        return client.channels.cache.get(guild_channel.lin_log_channel.id).send({ embeds: [err_embed(err, '每日圖系統')] });
                    }

                    try {
                        activity_timeout();
                    } catch (err) {
                        return client.channels.cache.get(guild_channel.lin_log_channel.id).send({ embeds: [err_embed(err, '活躍度系統')] });
                    }
                }
                if (d.getHours() === 0 || d.getHours() === 18) {
                    try {
                        sign_msg();
                    } catch (err) {
                        return client.channels.cache.get(guild_channel.lin_log_channel.id).send({ embeds: [err_embed(err, '簽到提醒系統')] });
                    }
                }
            });
            //join_key_random();
            //進群系統
            function join_key_random() {

                let rule = [
                    "歡迎來到鳴鈴的窩, 請閱讀以下群規並在群規中找到 [] 中的英文字母或數字組成密碼(共17字, 需區分大小寫), 在這裡使用指令 `/join` 輸入密碼後即可進群(密碼排列順序由上到下)(⚠密碼每小時0分時將變更, 有任何疑問請私訊管理員)",
                    "🔹 本群非常自由, 你可以聊任何的話題, 我們有多個對應的頻道可以讓各位聊天, 請在與你的話題相稱的頻道聊天",
                    "🔹 如果沒有語你的話題相稱的頻道請在 ✨閒聊區 聊, 短時間內需要獨自開一個頻道可以自行於 ✨閒聊區 下開討論串, 若有長期需要的頻道可以請管理員加開, 是否加開將視需要人數而定",
                    "🔹 聊天時請注意應有的禮貌, 尤其是剛認識的人, 第一映像很重要的哦",
                    "🔹 本群作為聊天群人數絕對不能算多, 所以如果你有任何問題發問或想聊天可能不會隨時都有人回應你, 但只要你的話題有get到別人就一定會有人跟你聊的",
                    "🔹 嚴禁吵架, 有任何爭執請召喚管理員處理",
                    "🔹 別人認真發問時請認真的回答他, 不要回答 你不會google嗎 之類的酸言酸語, 也不要亂回答jojo的奴隸島之類的",
                    "🔹 本群有美圖區與美蘿區, 你也可以在任何聊天室發健全的圖片(二三次元皆可), 但H圖只可在飆車區與飆蘿區",
                    "⚠ 本群嚴格禁止三次元R18蘿莉的圖片與影片, 一經發現必定嚴厲懲處",
                    "🔹 本群設有防刷版機制, 短時間內連續發送多則訊息可能會被禁言1小時, 發送圖片與影片不在此限",
                    "🔹 本群設有等級經驗機制, 某些聊天室需要透過提升等級或其他條件才可進入",
                    "🔹 發送1則訊息可獲得1經驗, 經驗每滿1000就可以花費鳴鈴幣來升等, 隨著等級上升每次升等所需花費的鳴鈴幣將上升",
                    "🔹 發圖與簽到都可以獲得鳴鈴幣, 發圖獎勵獲得的機率為 1%",
                    "🔹 發圖獎勵可獲得10 ~ 100鳴鈴幣, 簽到第一天可獲得5鳴鈴幣, 每多連續簽到一天就多5, 最高一天可獲得100鳴鈴幣",
                    "🔹 簽到方法為到 📆每日推薦 頻道中的最新一則訊息並在該訊息下方按 ❤️",
                    "🔹 血腥的圖片不論二三次元都請發到重口區, 不見血斷肢則不在此限",
                    "🔹 本群實現所有自動化功能的BOT皆為群主針對本群自己做的, 由於群主並不是相關科系畢業所以可能時不時會有bug, 有任何疑問請在 🆘問題區 提出",
                    "🔹 一起開心的聊天是群主創群的宗旨, 大家一起開心的聊天吧"
                ]

                let object = [],
                    str = "",
                    msg = "",
                    arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

                for (let i = 0; i < 17; i++) {
                    let r = Math.round(Math.random() * (arr.length - 1));
                    object.push(arr[r]);
                    str += arr[r];
                }

                for (let i = 1; i < rule.length; i++) {
                    let sl = rule[i].split('');
                    let random = Math.round(Math.random() * (sl.length - 1));
                    if (random < 3) random = 3;
                    sl.splice(random, 0, `[ ${object[i - 1]} ]`);
                    rule[i] = "";
                    sl.forEach(m => {
                        rule[i] += m;
                    })
                }

                for (let i = 0; i < rule.length; i++) msg += `${rule[i]}\n\n`;
                guildlog.join_key = str;

                client.channels.cache.get(guild_channel.gate_channel.id).messages.fetch(guildlog.join_key_msg).then(m => {

                    m.edit(msg);
                    fs.writeFile("./path/system_log/guildlog.json", JSON.stringify(guildlog, null, 4), (err) => {
                        if (err) console.log(err)
                    });

                }).catch(() => {
                    client.channels.cache.get(guild_channel.gate_channel.id).send(msg).then(m => {
                        guildlog.join_key_msg = m.id
                        fs.writeFile("./path/system_log/guildlog.json", JSON.stringify(guildlog, null, 4), (err) => {
                            if (err) console.log(err)
                        });
                    });
                })
            }

            //簽到重置系統
            function sign_timeout() {
                xp.forEach((i, index) => {
                    if (!i.sign_in.si) i.sign_in.si_day = 0;
                    i.sign_in.si = false;
                    if (index === xp.length - 1)
                        fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                            if (err) console.log(err)
                        });
                });
            }

            //簽到提醒系統
            function sign_msg() {
                let msg = '';
                xp.forEach(m => {
                    if (m.set.si_msg === 1 && !m.sign_in.si) msg += `<@${m.id}>`;
                });
                const newxp = xp.find(m => m.set.si_msg === 1 && !m.sign_in.si);
                msg += `\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n以上人員記得要簽到哦`;
                if (newxp) client.channels.cache.get(guild_channel.lin_log_channel.id).send(msg);
            }
            //活躍度系統

            async function activity_timeout() {

                let nga = [];
                let totle = {
                    text: 0,
                    photo: 0,
                    voice: 0
                };
                let top_nga_cache = {
                    id: '0',
                    n: 0
                };
                let top_nga = [];


                guild_activity.forEach(a => {
                    let cache = {
                        id: a.id,
                        n: 0
                    }
                    let newxp = xp.find(m => m.id === a.id);
                    newxp.old_activity = {
                        text: 0,
                        photo: 0,
                        voice: '00:00:00'
                    }
                    if (a.text[0]) {
                        a.text.forEach(t => {
                            newxp.old_activity.text = newxp.old_activity.text + t.n;
                        });
                        cache.n = cache.n + newxp.old_activity.text;
                        totle.text = totle.text + newxp.old_activity.text;
                    }
                    if (a.photo[0]) {
                        a.photo.forEach(p => {
                            newxp.old_activity.photo = newxp.old_activity.photo + p.n;
                        });
                        cache.n = cache.n + newxp.old_activity.photo * 2;
                        totle.photo = totle.photo + newxp.old_activity.photo;
                    }
                    if (a.voice[0]) {
                        let ss = 0;
                        let mm = 0;
                        let hh = 0;
                        a.voice.forEach(v => {
                            ss = ss + v.n;
                        });
                        cache.n = cache.n + Math.round(ss / 60);
                        totle.voice = totle.voice + ss;
                        newxp.old_activity.voice = `00:00:${ss.toString().padStart(2, '0')}`;
                        if (ss > 60) {
                            mm = Math.floor(ss / 60);
                            ss = ss % 60;
                            newxp.old_activity.voice = `00:${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
                        }
                        if (mm > 60) {
                            hh = Math.floor(mm / 60);
                            mm = mm % 60;
                            newxp.old_activity.voice = `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
                        }
                    }
                    nga.push(cache);
                });

                let nga_length = nga.length;

                for (let index = 0; index < nga_length; index++) {
                    nga.forEach(a => {
                        if (a.n > top_nga_cache.n) top_nga_cache = a;
                    });
                    nga.forEach((a, i) => {
                        if (a.id === top_nga_cache.id) nga.splice(i, 1);
                    });
                    top_nga.push(top_nga_cache);
                    top_nga_cache = {
                        id: '0',
                        n: 0
                    };
                }

                let user_photo = '725985700130062369';
                if (top_nga[0]) user_photo = top_nga[0].id;

                let user_p;

                await client.guilds.cache.get('725983149259227156').members.fetch().then(member => {
                    user_p = member.find(u => u.user.id === user_photo).user.displayAvatarURL({
                        format: 'png',
                        dynamic: true,
                        size: 4096
                    });
                })

                function top(id, rank) {
                    let newxp = xp.find(m => m.id === id);
                    let nga2 = guild_activity.find(a => a.id === id);
                    let text = {
                        id: '0',
                        n: 0
                    };
                    let photo = {
                        id: '0',
                        n: 0
                    };
                    let voice = {
                        id: '0',
                        n: 0
                    };
                    let totel = {
                        id: '0',
                        n: 0
                    };

                    if (nga2.text[0]) {
                        nga2.text.forEach(t => {
                            if (t.n > text.n) text = t;
                        });
                    }
                    if (nga2.photo[0]) {
                        nga2.photo.forEach(p => {
                            if (p.n > photo.n) photo = p;
                        });
                    }
                    if (nga2.voice[0]) {
                        nga2.voice.forEach(v => {
                            if (v.n > voice.n) voice = v;
                        });
                    }

                    if (text.n > totel.n) totel = text;
                    if (photo.n > totel.n) totel = photo;
                    if (voice.n > totel.n) totel = voice;

                    let emoji = ['🥇', '🥈', '🥉'];

                    return `\n\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n${emoji[rank]} <@${id}>\n🏆 活躍分數: ${top_nga[rank].n}\n🖊️ 總訊息數: ${newxp.old_activity.text}\n🌄 總發圖數: ${newxp.old_activity.photo}\n🔊 總語音時間: ${newxp.old_activity.voice}\n🎖️ 最活躍的頻道: <#${totel.id}>`;
                }
                let embed_msg = '本日沒有人發言';
                if (top_nga[0]) {
                    embed_msg = '活躍分數計算公式: 訊息數 + (發圖數 * 2) + (語音秒數 / 60)';
                    embed_msg += top(top_nga[0].id, 0);
                }
                if (top_nga[1]) embed_msg += top(top_nga[1].id, 1);
                if (top_nga[2]) embed_msg += top(top_nga[2].id, 2);

                embed_msg += `\n\n▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n🖊️ 群組總訊息數: ${totle.text}\n🌄 群組總發圖數: ${totle.photo}`;

                const embed = new MessageEmbed()
                    .setTitle(`昨日群組活躍度排名`)
                    .setThumbnail(user_p)
                    .setDescription(embed_msg)
                    .setColor("RANDOM");

                client.channels.cache.get(guild_channel.activity_log_channel.id).send({ embeds: [embed] });

                //client.channels.cache.get('730006359679959160').send({ embeds: [embed] });
                let m = guild_activity.length;

                for (let i = 0; i < m; i++) guild_activity.shift();

                fs.writeFile("./path/system_log/guild_activity.json", JSON.stringify(guild_activity, null, 4), (err) => {
                    if (err) console.log(err)
                });

                fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                    if (err) console.log(err)
                });
            }

            function err_embed(err, func) {
                const embed = new MessageEmbed()
                    .setTitle('⚠ERROR')
                    .setDescription(`錯誤碼: ${err}`)
                    .addField('錯誤功能', func)
                    .setColor("RED");
                return embed;
            }
        },
    },
    {
        name: "auto_msg",
        run: async (message) => {

            if (message.channel === message.guild.channels.cache.find(c => c.id === guild_channel.gate_channel.id)) message.delete();
            if (message.channel === message.guild.channels.cache.find(c => c.id === '726058111978307585') && message.content.startsWith('鈴音 V')) message.react('❤');
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
        run: (message) => {

            let newxp = xp.find(m => m.id === message.author.id);
            if (!newxp) xp.push({
                id: message.author.id,
                xp: 0,
                level: 0,
                coin: 0,
                mail: [],
                gf: [],
                set: {},
                sign_in: {
                    si: false,
                    si_day: 0
                },
                wish: {
                    s: 0,
                    l: 0,
                    xs: false,
                    xl: false
                }
            });

            newxp.xp++;

            fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                if (err) console.log(err)
            });
        },
    },
    {
        name: "dayphoto",
        run: (client) => {
            pixiv.refreshAccessToken(pixiv_login.token).then(() => photo_send(client));
        },
    },
    {
        name: "cmds",
        run: async (client, interaction) => {

            const useravatarurl = interaction.user.displayAvatarURL({
                format: 'png',
                dynamic: true,
                size: 4096
            });
            const channel = interaction.guild.channels.cache.find(ch => ch.id === guild_channel.cmd_log_channel.id);
            const channel2 = interaction.guild.channels.cache.find(ch => ch.id === guild_channel.lin_log_channel.id);

            const command = client.commands.get(interaction.commandName);

            if (command)
                try {
                    await command.run(client, interaction);

                    const embed = new MessageEmbed()
                        .setTitle('使用指令提示')
                        .setDescription(interaction.user.toString())
                        .setThumbnail(useravatarurl)
                        .addField('使用的指令', interaction.commandName)
                        .addField('使用的頻道位置', `${interaction.channel.toString()}`)
                        .setColor("GREEN");

                    channel.send({ embeds: [embed] });
                } catch (error) {
                    console.error(error);
                    const embed2 = new MessageEmbed()
                        .setTitle('⚠ERROR')
                        .setDescription(`指令使用者: ${interaction.user.toString()}\n\n錯誤碼: ${error}`)
                        .setThumbnail(useravatarurl)
                        .addField('使用的指令', interaction.commandName)
                        .addField('使用的頻道位置', `${interaction.channel.toString()}`)
                        .setColor("RED");
                    channel2.send({ embeds: [embed2] });
                    return interaction.reply({ content: '似乎發生了錯誤\n請將你遇到的錯誤回報給開發者', ephemeral: true });
                }
        },
    },
    {
        name: "reward",
        run: (message) => {
            if (!message.attachments.first()) return;
            if (!message.attachments.first().height) return;
            const newxp = xp.find(m => m.id === message.author.id);

            message.attachments.forEach(() => {
                let wish = Math.random();
                if (wish > 0.05) return;

                let coin = Math.floor(Math.random() * 100) + 1;
                if (coin < 10) coin = 10;
                newxp.coin = newxp.coin + coin;

                const embed = new MessageEmbed()
                    .setTitle('🎁獲得發圖獎勵')
                    .setDescription(`▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫\n\n獲得鳴鈴幣: ${coin}`)
                    .setThumbnail('https://cdn.discordapp.com/attachments/730006359679959160/889603900913623060/198766.gif')
                    .setColor("RANDOM");

                message.channel.send({ content: message.author.toString(), embeds: [embed] });
            });
            fs.writeFile("./path/user_log/xp.json", JSON.stringify(xp, null, 4), (err) => {
                if (err) console.log(err)
            });
        },
    },
    {
        name: "ban",
        run: (message) => {
            if (message.channel === message.guild.channels.cache.find(c => c.name === "✨自治區聊天室")) return;
            if (message.attachments.first()) return;
            if (!banmsg[message.author.id]) banmsg[message.author.id] = { msg: 0 };

            banmsg[message.author.id].msg++;
            setTimeout(() => banmsg[message.author.id].msg--, 1200);

            if (banmsg[message.author.id].msg < 3) return;

            const useravatarurl = message.author.displayAvatarURL({
                format: 'png',
                dynamic: true,
                size: 4096
            });
            const roleban = message.guild.roles.cache.find(x => x.name === '禁言');
            const d = new Date

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
            if (!new_ban) ban.push({
                uid: message.author.id,
                time: d
            });

            fs.writeFile("./path/user_log/ban.json", JSON.stringify(ban, null, 4), (err) => {
                if (err) console.log(err)
            });

            setTimeout(() => {
                for (let i = 0; i < ban.length; i++)
                    if (ban[i].uid === message.author.id) {
                        ban.splice(i, 1);

                        fs.writeFile("./path/user_log/ban.json", JSON.stringify(ban, null, 4), (err) => {
                            if (err) console.log(err)
                        });
                        const embed = new MessageEmbed()
                            .setTitle('懲罰解除提示')
                            .setDescription('恭喜出獄')
                            .setThumbnail(useravatarurl)
                            .setColor("GREEN");

                        message.member.roles.remove(roleban);
                        channel.send({ content: message.author.toString(), embeds: [embed] });
                        break;
                    }
            }, 3600000);
        },
    },
    {
        name: "msglog",
        run: (message) => {

            let nga = guild_activity.find(a => a.id === message.author.id);

            if (!nga) guild_activity.push({
                id: message.author.id,
                text: [],
                photo: [],
                voice: []
            });

            nga = guild_activity.find(a => a.id === message.author.id);

            let nga_text = nga.text.find(t => t.id === message.channel.id);

            if (!nga_text) nga.text.push({
                id: message.channel.id,
                n: 0
            });

            nga_text = nga.text.find(t => t.id === message.channel.id);

            if (!message.attachments.first() || !message.attachments.first().height) nga_text.n++;
            else {

                let nga_photo = nga.photo.find(t => t.id === message.channel.id);

                if (!nga_photo) nga.photo.push({
                    id: message.channel.id,
                    n: 0
                });

                nga_photo = nga.photo.find(t => t.id === message.channel.id);
                message.attachments.forEach(() => nga_photo.n++);
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
            if (newState.mute && oldState.mute) return;
            let newxp = xp.find(m => m.id === newState.id);
            if (!newxp) xp.push({
                id: newState.id,
                xp: 0,
                level: 0,
                coin: 0,
                mail: [],
                gf: [],
                set: {},
                sign_in: {
                    si: false,
                    si_day: 0
                },
                wish: {
                    s: 0,
                    l: 0,
                    xs: false,
                    xl: false
                }
            });

            let nga = guild_activity.find(a => a.id === newState.id);
            if (!nga) {
                guild_activity.push({
                    id: newState.id,
                    text: [],
                    photo: [],
                    voice: []
                });
                nga = guild_activity.find(a => a.id === newState.id);
            }

            // when stopping your app
            //scheduler.stop()

            //console.log(newState);

            //start();
            if (!newState.mute && !oldState.mute && newState.channelId && oldState.channelId && newState.channelId !== oldState.channelId) {
                stop();
                start();
            } else if (newState.channelId && !newState.mute) start();
            else stop();

            function start_dev() {

                if (newState.streaming !== oldState.streaming && newState.channelId === oldState.channelId) return;
                if (newState.channelId === oldState.channelId && newState.sessionId !== oldState.sessionId) return;
                if (newState.channelId === oldState.channelId && newState.selfVideo !== oldState.selfVideo) return;

                const task = new Task(newState.id, () => {
                    let nga = guild_activity.find(a => a.id === newState.id);

                    if (!nga) guild_activity.push({
                        id: newState.id,
                        text: [],
                        photo: [],
                        voice: []
                    });
                    nga = guild_activity.find(a => a.id === newState.id);

                    let nga_voice = nga.voice.find(v => v.id === newState.channelId);

                    if (!nga_voice) nga.voice.push({
                        id: newState.channelId,
                        n: 0
                    });
                    nga_voice = nga.voice.find(v => v.id === newState.channelId);

                    nga_voice.n++;
                    if (nga_voice.n % 60 === 0) newxp.xp = newxp.xp + 2;
                })
                const job = new SimpleIntervalJob({ seconds: 1, }, task, newState.id)

                scheduler.addSimpleIntervalJob(job);

            }

            function stop_dev() {
                scheduler.removeById(newState.id)
            }

            function start() {
                if (newState.streaming !== oldState.streaming && newState.channelId === oldState.channelId) return;
                if (newState.channelId === oldState.channelId && newState.sessionId !== oldState.sessionId) return;
                if (newState.channelId === oldState.channelId && newState.selfVideo !== oldState.selfVideo) return;

                const d = Math.ceil(new Date().getTime() / 1000);

                let nga_voice = nga.voice.find(v => v.id === newState.channelId);

                if (!nga_voice) {
                    nga.voice.push({
                        id: newState.channelId,
                        n: 0,
                        start_time: null,
                        stop: false,
                        vxp: 0
                    });
                    nga_voice = nga.voice.find(v => v.id === newState.channelId);
                }

                nga_voice.start_time = d;
                fs.writeFile("./path/system_log/guild_activity.json", JSON.stringify(guild_activity, null, 4), (err) => {
                    if (err) console.log(err)
                });
            }

            function stop() {

                let nga_voice = nga.voice.find(v => v.id === oldState.channelId);
                if (!nga_voice) return;
                nga_voice.stop = true;

                fs.writeFile("./path/system_log/guild_activity.json", JSON.stringify(guild_activity, null, 4), (err) => {
                    if (err) console.log(err)
                });
            }
        },
    },
    {
        name: "xpcard",
        run: (message, client) => {

            if (message.author.id === '743361367125524490') {
                client.wish.push({
                    url: message.attachments.first().url,
                    id: message.content
                });
            }
        },
    },
    {
        name: "txtmsg",
        run: (message, client, dev) => {

            const new_reply = reply_data.find(m => m.msg === message.content);
            if (client.user_list[message.author.id]) return;
            if (!new_reply) return;
            if (dev && message.author.id !== '725742928907206769') return;

            const newxp = xp.find(m => m.id === message.author.id);

            new_reply.use = new_reply.use + 1;
            fs.writeFile("./path/reply_data.json", JSON.stringify(reply_data, null, 4), (err) => {
                if (err) console.log(err);
            });

            const gf = newxp.gf.find(gf => gf.use);
            let r_txt = new_reply.reply.filter(m => m.id === message.author.id);
            let math = Math.floor(Math.random() * new_reply.reply.length);

            if (newxp.set.reply_mode && r_txt[0]) {
                math = Math.floor(Math.random() * r_txt.length);
                t_send(r_txt[math].rep, r_txt[math].embed);
            } else t_send(new_reply.reply[math].rep, new_reply.reply[math].embed);

            function t_send(rep, eb) {
                const embed = new MessageEmbed()
                    .setImage(rep);

                if (!gf || message.channel.isThread()) {
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
        run: (message, client, dev) => {

            if (dev && message.author.id !== '725742928907206769') return;
            const newxp = xp.find(m => m.id === message.author.id);
            if (!newxp.mail[0]) return;
            if (client.user_list[message.author.id]) return;
            if (!read[message.author.id]) read[message.author.id] = {};
            if (read[message.author.id].read === 1) return;
            if (newxp.mail[0]) {
                message.reply('您有未讀郵件 \n輸入 `/mail` 查看')
                read[message.author.id].read = 1;
                setTimeout(() => {
                    read[message.author.id].read = 0;
                }, 600000);
            }
        },
    },
    {
        name: "music_player_button",
        run: async (client, interaction) => {
            if (interaction.isButton()) {
                const music = client.music[0];
                const voiceChannel = interaction.member.voice.channel;
                const music_command = client.commands.get('music');

                if (interaction.customId === '停止播放') {
                    if (!voiceChannel) return await interaction.reply({ content: "你不在語音頻道哦", ephemeral: true });
                    if (interaction.member.roles.cache.some(role => role.name === '管理員') || music.uid === interaction.user.id) {
                        client.music = [];
                        await interaction.reply({ content: "已停止播放", ephemeral: true });
                        return music_command.play_music(client, interaction);
                    }
                    if (music.stop_vote.find(m => m === interaction.user.id)) return await interaction.reply({ content: `還需要在語音頻道裡的 ${Math.floor(voiceChannel.members.size / 2) - music.stop_vote.length} 人點擊停止播放按鈕才可停止1`, ephemeral: true });
                    music.stop_vote.push(interaction.user.id);
                    if (music.stop_vote.length < Math.floor(voiceChannel.members.size / 2)) return await interaction.reply({ content: `還需要在語音頻道裡的 ${Math.floor(voiceChannel.members.size / 2) - music.stop_vote.length} 人點擊停止播放按鈕才可停止`, ephemeral: true });
                    client.music = [];
                    music_command.play_music(client, interaction);
                    await interaction.reply({ content: "已停止播放", ephemeral: true });
                } else if (interaction.customId === '下一首') {
                    if (!voiceChannel) return await interaction.reply({ content: "你不在語音頻道哦", ephemeral: true });
                    if (!client.music[1]) return await interaction.reply({ content: "已經沒有下一首歌了哦\n若要停止播放請按停止播放", ephemeral: true });
                    if (!client.music[1].write) return await interaction.reply({ content: "這首歌還在緩衝中,請稍後再試", ephemeral: true });
                    if (interaction.member.roles.cache.some(role => role.name === '管理員') || music.uid === interaction.user.id) {
                        client.player_timer_skip = true;
                        client.music.shift();
                        music_command.play_music(client, interaction);
                        return await interaction.reply({ content: `已開始下一首`, ephemeral: true });
                    }
                    if (music.skip_vote.find(m => m === interaction.user.id)) return await interaction.reply({ content: `還需要在語音頻道裡的 ${Math.floor(voiceChannel.members.size / 2) - music.skip_vote.length} 人點擊停止播放按鈕才可播放下一首`, ephemeral: true });
                    music.skip_vote.push(interaction.user.id);
                    if (music.skip_vote.length < Math.floor(voiceChannel.members.size / 2)) return await interaction.reply({ content: `還需要在語音頻道裡的 ${Math.floor(voiceChannel.members.size / 2) - music.skip_vote.length} 人點擊停止播放按鈕才可播放下一首`, ephemeral: true });
                    client.player_timer_skip = true;
                    client.music.shift();
                    await interaction.reply({ content: `已開始下一首`, ephemeral: true });
                    music_command.play_music(client, interaction);
                } else if (interaction.customId === '單曲循環') {
                    if (!voiceChannel) return await interaction.reply({ content: "你不在語音頻道哦", ephemeral: true });
                    if (music.rep) await interaction.reply({ content: "已關閉單曲循環", ephemeral: true });
                    else await interaction.reply({ content: "已開啟單曲循環", ephemeral: true });
                    music.rep = !music.rep
                } else if (interaction.customId === '列隊一覽') {
                    let msg_send = '';
                    client.music.forEach((m, i) => {
                        if (i > 10) return msg_send += `還有 ${client.music.length - 10} 首...`;
                        if (i === 0 && m.rep) msg_send += `🔂 **${m.music_artist_name} - ${m.music_name}**\n`
                        else if (i === 0 && !m.rep) msg_send += `▶ **${m.music_artist_name} - ${m.music_name}**\n`
                        else msg_send += `${m.music_artist_name} - ${m.music_name}\n`
                    });
                    await interaction.reply({ content: msg_send, ephemeral: true });
                } else if (interaction.customId === '+1秒') {
                    music.lyc_delay++;
                    const embed = new MessageEmbed()
                        .setDescription(`歌詞時間同步調整\n目前同步: ${music.lyc_delay}`)
                        .setColor("BLUE");
                    interaction.channel.messages.fetch(client.player_ly_time_id).then(m => {
                        m.edit({ embeds: [embed] });
                    });
                    await interaction.reply({ content: ":white_check_mark:", ephemeral: true });
                } else if (interaction.customId === '-1秒') {
                    music.lyc_delay--;
                    const embed = new MessageEmbed()
                        .setDescription(`歌詞時間同步調整\n目前同步: ${music.lyc_delay}`)
                        .setColor("BLUE");
                    interaction.channel.messages.fetch(client.player_ly_time_id).then(m => {
                        m.edit({ embeds: [embed] });
                    });
                    await interaction.reply({ content: ":white_check_mark:", ephemeral: true });
                } else if (interaction.customId === '還原') {
                    music.lyc_delay = 0;
                    const embed = new MessageEmbed()
                        .setDescription(`歌詞時間同步調整\n目前同步: ${music.lyc_delay}`)
                        .setColor("BLUE");
                    interaction.channel.messages.fetch(client.player_ly_time_id).then(m => {
                        m.edit({ embeds: [embed] });
                    });
                    await interaction.reply({ content: ":white_check_mark:", ephemeral: true });
                }
            }

        },
    },
    {
        name: "collector_end",
        run: (collector, interaction, embed) => {

            collector.on('end', async collected => {

                if (collected.find(m => m.user.id === interaction.user.id)) return;


                const send_completed_row = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId('超時')
                            .setLabel('超時')
                            .setEmoji('⚠')
                            .setStyle('DANGER')
                            .setDisabled(true),
                    );

                await interaction.editReply({ embeds: [embed], components: [send_completed_row], ephemeral: true });

            });
        },
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
//pixiv發圖模塊
async function photo_send(client) {
    let l = 0

    pixiv.userBookmarksIllust('13933108').then(async p => {
        get_photo(p, l);
    });

    async function get_photo(image, l) {
        if (!pixiv_image.find(f => f.id === image.illusts[l].id) && !image.illusts[l].x_restrict) {
            await pixiv.illustDetail(image.illusts[l].id).then(async p => {
                const photoinfo = {
                    file_name: p.illust.title,
                    file_type: 'png',
                    image_url: p.illust.image_urls.large,
                    image_title: p.illust.title,
                    user_name: p.illust.user.name,
                    user_id: p.illust.user.id.toString(),
                    user_image: p.illust.user.profile_image_urls.medium
                }

                if (p.illust.page_count > 1) photoinfo.original_image = p.illust.meta_pages[0].image_urls.original;
                else photoinfo.original_image = p.illust.meta_single_page.original_image_url;

                if (photoinfo.image_url.includes('.png')) photoinfo.file_type = 'png';

                const response = await axios({
                    url: photoinfo.original_image,
                    headers: {
                        "Referer": "http://www.pixiv.net/"
                    },
                    responseType: 'stream'
                });

                const user_image_response = await axios({
                    url: p.illust.user.profile_image_urls.medium,
                    headers: {
                        "Referer": "http://www.pixiv.net/"
                    },
                    responseType: 'stream'
                });

                if (photoinfo.original_image.includes('.png')) photoinfo.file_type = 'png';

                response.data.pipe(fs.createWriteStream(`./cache/${image.illusts[l].id}.${photoinfo.file_type}`))
                    .once('finish', async () => {
                        let file = fs.statSync(`./cache/${image.illusts[l].id}.${photoinfo.file_type}`);
                        if (file.size > 8388607) {
                            const response2 = await axios({
                                url: photoinfo.image_url,
                                headers: {
                                    "Referer": "http://www.pixiv.net/"
                                },
                                responseType: 'stream'
                            });
                            if (photoinfo.image_url.includes('.png')) photoinfo.file_type = 'png';
                            send_image(image.illusts[l].id, client, response2, photoinfo, user_image_response);
                        } else {
                            send_image(image.illusts[l].id, client, response, photoinfo, user_image_response, true);
                        }
                    });
            });
        } else {
            l++;
            if (l >= 30) {
                pixiv.requestUrl(image.next_url).then(u => {
                    l = 0;
                    get_photo(u, l);
                })
            } else get_photo(image, l);
        }
    }
}

//pixiv發圖模塊2
async function send_image(id, client, response, photoinfo, user_image_response, original) {
    const recommend_channel = client.channels.cache.get(guild_channel.recommend_channel.id);
    //const recommend_channel = client.channels.cache.get('730006359679959160');

    const lin_log_channel = client.channels.cache.get(guild_channel.lin_log_channel.id);

    let f = response.data;
    if (original) f = `./cache/${id}.${photoinfo.file_type}`;
    const file = new MessageAttachment(f, `${id}.${photoinfo.file_type}`);
    const file2 = new MessageAttachment(user_image_response.data, `${photoinfo.user_id}.jpg`);

    const embed = new MessageEmbed()
        .setAuthor(photoinfo.user_name, null, `https://www.pixiv.net/users/${photoinfo.user_id}`)
        .setThumbnail(`attachment://${photoinfo.user_id}.jpg`)
        .setTitle(photoinfo.image_title)
        .setURL(`https://www.pixiv.net/artworks/${id}`)
        .setImage(`attachment://${id}.${photoinfo.file_type}`)
        .setColor('RANDOM');

    const embed2 = new MessageEmbed()
        .setTitle('已成功發送每日圖')
        .setThumbnail(`attachment://${id}.${photoinfo.file_type}`)
        .setDescription(`[${photoinfo.image_title}](https://www.pixiv.net/artworks/${id})`)
        .setColor('GREEN');

    recommend_channel.send({ embeds: [embed], files: [file, file2] }).then(m => {
        m.react('❤️');
        guildlog.sign_msg_id = m.id;
        fs.writeFile("./path/system_log/guildlog.json", JSON.stringify(guildlog, null, 4), (err) => {
            if (err) console.log(err)
        });
        client.pixiv_image_ok = true;
    });
    lin_log_channel.send({ embeds: [embed2], files: [file] }).then(() => {
        OK();
    });
    function OK() {
        setTimeout(() => {
            if (client.pixiv_image_ok) {
                try {
                    fs.unlinkSync(`./cache/${id}.${photoinfo.file_type}`);
                    pixiv_image.push({
                        id: id
                    });
                    fs.writeFile("./path/system_log/pixiv_image.json", JSON.stringify(pixiv_image, null, 4), (err) => {
                        if (err) console.log(err)
                    });
                } catch (err) {
                    console.log(`無法移除./cache/${id}.${photoinfo.file_type}`);
                }
                client.pixiv_image_ok = false;
            } else OK();
        }, 3000);
    }

}