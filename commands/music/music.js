const n = require('NeteaseCloudMusicApi');
const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const {
    MessageEmbed,
    MessageActionRow,
    MessageButton
} = require("discord.js");
const {
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
    AudioPlayerStatus,
    entersState,
    StreamType,
    VoiceConnectionStatus
} = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const { dev } = require("../../config.json");
const { ToadScheduler, SimpleIntervalJob, Task } = require('toad-scheduler');
const scheduler = new ToadScheduler();

const player = createAudioPlayer();
player.on('error', error => {
    console.error(error);
});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music')
        .setDefaultPermission(!dev)
        .setDescription('鳴鈴牌播放器')
        .addSubcommand(subcommand =>
            subcommand.setName('播放音樂')
                .setDescription('播放音樂')
                .addStringOption(option =>
                    option.setName('網址')
                        .setDescription('請輸入音樂網址\n目前支援 網易雲音樂 與 YouTube 的網址')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('播放器控制')
                .setDescription('播放器控制')
                .addStringOption(option =>
                    option.setName('選項')
                        .setDescription('控制播放器狀態')
                        .setRequired(true)
                        .addChoice('🔹 下一首', '下一首')
                        .addChoice('🔹 單曲循環', '單曲循環')
                        .addChoice('🔹 上一首', '上一首')
                        .addChoice('🔹 停止播放', '停止播放')
                        .addChoice('🔹 歌詞同步快1秒', '歌詞同步快1秒')
                        .addChoice('🔹 歌詞同步慢1秒', '歌詞同步慢1秒')
                        .addChoice('🔹 播放列表', '播放列表'))),
    async run(client, interaction) {

        const subcommand = interaction.options.getSubcommand();
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) return await interaction.reply({ content: '你不在語音頻道哦', ephemeral: true });

        if (subcommand === '播放音樂') {
            const url = interaction.options.getString('網址');

            if ((!url.startsWith('https://music.163.com/') && !url.includes('song?id=')) && (!url.match(/(youtube.com|youtu.be)\/(watch)?(\?v=)?(\S+)?/))) return await interaction.reply({ content: '目前僅支援 網易雲音樂 與 YouTube 的網址哦', ephemeral: true });

            if (url.match(/(youtube.com|youtu.be)\/(watch)?(\?v=)?(\S+)?/)) {
                const songInfo = await ytdl.getInfo(url);
                if (!songInfo) return await interaction.reply({ content: '沒有找到這首歌哦', ephemeral: true });
                let msg = '已加入播放列表:';
                let music_data = songInfo.videoDetails;

                let dt = parseInt(music_data.lengthSeconds);
                let hh = 0;
                let mm = Math.floor(dt / 60);
                let ss = dt % 60;
                let time_msg = `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
                if (mm > 60) {
                    hh = Math.floor(mm / 60);
                    mm = mm % 60;
                    time_msg = `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
                }

                client.music.push({
                    music_id: music_data.videoId,
                    music_name: music_data.title,
                    music_cover_url: music_data.thumbnails[music_data.thumbnails.length - 1].url,
                    music_url: music_data.video_url,
                    music_album_name: music_data.author.name,
                    music_artist_name: music_data.author.name,
                    music_dt: dt * 1000,
                    music_dt2: time_msg,
                    now_time: 0,
                    lyc_delay: 0,
                    uid: interaction.user.id,
                    rep: false,
                    youtube: true,
                    stop_vote: [],
                    skip_vote: [],
                    dts: true,
                    write: false
                });

                if (client.music.length <= 1) {
                    msg = '開始播放歌曲:';
                    client.connection = joinVoiceChannel({
                        channelId: voiceChannel.id,
                        guildId: voiceChannel.guild.id,
                        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                    });
                    try {
                        await entersState(client.connection, VoiceConnectionStatus.Ready, 3000);
                        play_music(client, client.connection);
                    } catch (error) {
                        client.connection.destroy();
                        throw error;
                    }
                }

                const embed = new MessageEmbed()
                    .setTitle(msg)
                    .setDescription(`**[${music_data.title}](${music_data.video_url})**\n\n【${music_data.author.name}】`)
                    .setThumbnail(music_data.thumbnails[music_data.thumbnails.length - 1].url)
                    .setFooter(time_msg, 'https://cdn.discordapp.com/attachments/730006359679959160/891662807240687666/3689112.png')
                    .setColor("RANDOM");

                await interaction.reply({ embeds: [embed], ephemeral: false });

            } else {
                let music_id = '';
                if (url.includes('/#/')) music_id = url.split('https://music.163.com/#/song?id=').slice(1)[0].split('&')[0];
                else music_id = url.split('https://music.163.com/song?id=').slice(1)[0].split('&')[0];
                if (isNaN(Math.floor(music_id))) return await interaction.reply({ content: '沒有找到這首歌哦', ephemeral: true });

                let msg = '已加入播放列表';

                let check = true;
                let play_url = '';

                const result = await n.login({
                    email: 'henry27161433@126.com',
                    password: 'henry88118'
                });

                await n.song_url({
                    id: music_id,
                    //cookie: result.body.cookie
                }).then(data => {
                    if (data.body.data[0].freeTrialInfo || !data.body.data[0].url) return check = false;
                    play_url = data.body.data[0].url;
                });

                if (!check) return await interaction.reply({ content: '此音樂暫不可用\n原因:暫無版權或僅供VIP用戶聆聽', ephemeral: true });

                n.song_detail({
                    ids: music_id
                }).then(async data => {
                    const music_data = data.body.songs[0];
                    let hh = 0;
                    let mm = Math.floor(music_data.dt / 60000);
                    let ss = Math.floor(music_data.dt / 1000 % 60);
                    let time_msg = `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
                    if (mm > 60) {
                        hh = Math.floor(mm / 60);
                        mm = mm % 60;
                        time_msg = `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
                    }

                    let ar_name = '';
                    music_data.ar.forEach((ar, i) => {
                        if (i === music_data.ar.length - 1) ar_name += ar.name;
                        else ar_name += ar.name + '/';
                    });

                    let queue = {
                        music_id: music_id,
                        music_name: music_data.name,
                        music_cover_url: music_data.al.picUrl,
                        music_album_name: music_data.al.name,
                        music_artist_name: ar_name,
                        music_artist_id: music_data.ar[0].id,
                        music_dt: music_data.dt,
                        music_dt2: time_msg,
                        music_url: url,
                        play_url: play_url,
                        now_time: 0,
                        uid: interaction.user.id,
                        stop_vote: [],
                        skip_vote: [],
                        lyc_delay: 0,
                        youtube: false,
                        rep: false,
                        dts: true,
                        write: false
                    }

                    n.artist_detail({
                        id: music_data.ar[0].id
                    }).then(u => {
                        queue.music_artist_url = u.body.data.artist.cover;
                    });

                    n.lyric({
                        id: queue.music_id
                    }).then(ly => {

                        //console.log(ly.body);

                        if (ly.body.nolyric) return;

                        queue.lyric = ly.body.lrc.lyric.split('\n');
                        queue.lyric.splice(queue.lyric.length - 1, 1);

                        queue.lyric_check = true;
                        let ly2 = '(結束)'
                        for (let i = 1; i < 100; i++) {
                            if (queue.lyric[i].split(']')[1].length !== 0) {
                                ly2 = queue.lyric[i].split(']')[1];
                                break;
                            }
                        }

                        queue.lyc_embed = {
                            e1: `**${queue.lyric[0].split(']')[1]}**`,
                            e2: ly2
                        }

                        if (ly.body.tlyric.version) {
                            queue.chinese_lyric = ly.body.tlyric.lyric.split('\n');
                            queue.chinese_lyric.splice(queue.chinese_lyric.length - 1, 1);
                            queue.chinese_lyric.splice(0, 1);

                            queue.chinese_lyric_check = true;
                            let ly2 = '(結束)'
                            for (let i = 1; i < 100; i++) {
                                if (queue.chinese_lyric[i].split(']')[1].length !== 0) {
                                    ly2 = queue.chinese_lyric[i].split(']')[1];
                                    break;
                                }
                            }
                            let che1 = queue.chinese_lyric[0].split(']')[1]
                            if (!che1) che1 = queue.lyric[0].split(']')[1]

                            queue.lyc_embed.che1 = che1;
                            queue.lyc_embed.che2 = ly2;
                        }

                    });

                    client.music.push(queue);

                    if (client.music.length <= 1) {
                        msg = '開始播放';
                        client.connection = joinVoiceChannel({
                            channelId: voiceChannel.id,
                            guildId: voiceChannel.guild.id,
                            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                        });
                        try {
                            await entersState(client.connection, VoiceConnectionStatus.Ready, 3000);
                            play_music(client, client.connection);
                        } catch (error) {
                            client.connection.destroy();
                            throw error;
                        }
                    }

                    const embed = new MessageEmbed()
                        .setTitle(music_data.name)
                        .setURL(url)
                        .setAuthor(ar_name, queue.music_artist_url, `https://music.163.com/#/artist?id=${music_data.ar[0].id}`)
                        .setDescription(`【${music_data.al.name}】\n\n✅ ${msg}`)
                        .setThumbnail(music_data.al.picUrl)
                        .setFooter(time_msg, 'https://cdn.discordapp.com/attachments/730006359679959160/891662471155290132/1000_2.png')
                        .setColor("RANDOM");

                    await interaction.reply({ embeds: [embed], ephemeral: false });
                });

            }
        } else if (subcommand === '播放器控制') {
            const string = interaction.options.getString('選項');

            if (string === '下一首') {
                player.stop();
                await interaction.reply({ content: '✅', ephemeral: false });
                play_music(client);
            } else if (string === '單曲循環') {
                client.music[0].rep = !client.music[0].rep;
                await interaction.reply({ content: `${client.music[0].rep}`, ephemeral: false });
            } else if (string === '上一首') {
                await interaction.reply({ content: '開發中', ephemeral: false });
            } else if (string === '停止播放') {
                player.stop();
                scheduler.removeById(client.music[0].music_id);
                client.music = [];
                await interaction.reply({ content: '停止播放', ephemeral: false });
            } else if (string === '歌詞同步快1秒') {
                await interaction.reply({ content: '開發中', ephemeral: true });
            } else if (string === '歌詞同步慢1秒') {
                await interaction.reply({ content: '開發中', ephemeral: true });
            } else if (string === '播放列表') {
                await interaction.reply({ content: '開發中', ephemeral: true });
            }

        }



    },
    async play_music(client, interaction) {
        play_music(client, interaction);
    }

};

async function play_music(client) {

    const music = client.music[0];
    const channel = client.channels.cache.get('873452704796651540');

    if (!music) {
        client.connection.destroy();
        channel.messages.fetch(client.player_message_id).then(m => {
            m.delete();
        });
        return;
    }

    player_message(client);

    let resource;

    if (!music.youtube) resource = createAudioResource(music.play_url);
    else resource = createAudioResource(ytdl(music.music_url, { quality: 'highestaudio', filter: 'audioonly', highWaterMark: 1 << 25 }), {
        inputType: StreamType.WebmOpus
    });

    player.play(resource);

    try {
        await entersState(player, AudioPlayerStatus.Playing, 5000);
        client.connection.subscribe(player);
        //time(client);
    } catch (error) {
        return console.error(error);
    }

    player.once(AudioPlayerStatus.Idle, () => {
        if (!music.rep) client.music.shift();
        else music.now_time = 0;

        play_music(client);
    });

}

function player_message(client) {
    const music = client.music[0];
    const channel = client.channels.cache.get('873452704796651540');
    let icon = `https://cdn.discordapp.com/attachments/730006359679959160/891662471155290132/1000_2.png`;
    if (music.youtube) icon = `https://cdn.discordapp.com/attachments/730006359679959160/891662807240687666/3689112.png`;

    const embed = new MessageEmbed()
        .setAuthor(music.music_artist_name, music.music_artist_url, `https://music.163.com/#/artist?id=${music.music_artist_id}`)
        .setTitle(music.music_name)
        .setURL(music.music_url)
        .setDescription(`【${music.music_album_name}】`)
        .setThumbnail(music.music_cover_url)
        //.addFields(embed_fields)
        .setFooter(`00:00 ◈─────────────────── ${music.music_dt2}`, icon)
        .setColor("RANDOM");

    if (client.player_message_id) channel.messages.fetch(client.player_message_id).then(m => {
        m.edit({ embeds: [embed] });
    });
    else channel.send({ embeds: [embed] }).then(m => {
        client.player_message_id = m.id;
    });

}

function time(client) {

    const music = client.music[0];
    const channel = client.channels.cache.get('873452704796651540');

    let embed;

    let time_msg = `0`;
    let now_ss = 0;
    let now_mm = 0;
    let now_hh = 0;
    let jj = '◈───────────────────';
    let icon = `https://cdn.discordapp.com/attachments/730006359679959160/891662471155290132/1000_2.png`;
    if (music.youtube) icon = `https://cdn.discordapp.com/attachments/730006359679959160/891662807240687666/3689112.png`;

    setTimeout(() => {

    }, 10)

    return

    const task = new Task(music.music_id, () => {
        if (music.now_time * 1 >= music.music_dt) return scheduler.removeById(music.music_id);

        music.now_time++;
        console.log(music.now_time);

        if (music.now_time % 200 === 0) {
            let m = Math.round((music.now_time * 10) / music.music_dt * 10000) / 100;
            console.log(music.now_time);
            //console.log(Math.floor(m));
            if (Math.floor(m) % 5 === 0) {
                jj = '';
                for (let i = 0; i < 21; i++) {
                    if (Math.floor(m) === i * 5) jj += '◈';
                    else jj += '─';
                }
            }

            now_mm = Math.floor(music.now_time / 10 / 60);
            now_ss = (music.now_time / 10) % 60;

            if (now_mm > 60) {
                now_hh = Math.floor(now_mm / 60);
                now_mm = now_mm % 60;
            }

            if (music.music_dt2.length < 6) time_msg = `${now_mm.toString().padStart(2, '0')}:${now_ss.toString().padStart(2, '0')} ${jj} ${music.music_dt2}`;
            else time_msg = `${now_hh.toString().padStart(2, '0')}:${now_mm.toString().padStart(2, '0')}:${now_ss.toString().padStart(2, '0')} ${jj} ${music.music_dt2}`;


            embed = new MessageEmbed()
                .setTitle(`**${music.music_artist_name} - ${music.music_name}**`)
                .setDescription(`【${music.music_album_name}】`)
                .setThumbnail(music.music_cover_url)
                //.addFields(embed_fields)
                .setFooter(time_msg, icon)
                .setColor("RANDOM");

            channel.messages.fetch(client.player_message_id).then(m => {
                m.edit({ embeds: [embed] });
            }).catch(() => {
                channel.send({ embeds: [embed] }).then(m => {
                    client.player_message_id = m.id;
                });
            });
        }

    });
    const job = new SimpleIntervalJob({ milliseconds: 0, }, task, music.music_id)

    scheduler.addSimpleIntervalJob(job);
}
