const { Client, Intents, MessageAttachment } = require("discord.js");
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const Canvas = require('canvas');
const config = require("./config.json");

const prefix_join = '+-+join';
client.on("ready", () => {

    console.log(`${client.user.username} 已上線 ${client.guilds.cache.size} 個伺服器`);
    client.user.setPresence({
        status: 'online',
        activities: [{
            name: '鳴鈴の窩',
            type: 'WATCHING'
        }]
    });

});

//圖片繪製系統
client.on("messageCreate", async message => {

    //if (message.author.id !== '731536001591279617') return;

    if (message.content.startsWith(prefix_join)) {
        const args = message.content.slice(prefix_join.length).trim().split(',');

        let random_R = Math.floor(Math.random() * 10) + 1
        let random_L = Math.floor(Math.random() * 10) + 1

        const canvas = Canvas.createCanvas(900, 640);
        const ctx = canvas.getContext('2d');
        const background = await Canvas.loadImage("./photo/list_bg.png");
        const avatar = await Canvas.loadImage(args[0]);

        ctx.drawImage(background, 0, 0, 900, 640);

        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowOffsetX = 10;
        ctx.shadowOffsetY = 10;
        ctx.shadowBlur = 2;

        switch (random_L) {
            case 1: {
                const background_L01 = await Canvas.loadImage("./photo/welcome_bg_L/welcome_bg_L_0001.png");
                ctx.drawImage(background_L01, -450, -50, 1024, 977);
                break;
            }
            case 2: {
                const background_L02 = await Canvas.loadImage("./photo/welcome_bg_L/welcome_bg_L_0002.png");
                ctx.drawImage(background_L02, -160, 5, 550, 926);
                break;
            }
            case 3: {
                const background_L03 = await Canvas.loadImage("./photo/welcome_bg_L/welcome_bg_L_0003.png");
                ctx.drawImage(background_L03, -280, -25, 850, 817);
                break;
            }
            case 4: {
                const background_L04 = await Canvas.loadImage("./photo/welcome_bg_L/welcome_bg_L_0004.png");
                ctx.drawImage(background_L04, -120, -15, 452, 900);
                break;
            }
            case 5: {
                const background_L05 = await Canvas.loadImage("./photo/welcome_bg_L/welcome_bg_L_0005.png");
                ctx.drawImage(background_L05, -60, -10, 410, 800);
                break;
            }
            case 6: {
                const background_L06 = await Canvas.loadImage("./photo/welcome_bg_L/welcome_bg_L_0006.png");
                ctx.drawImage(background_L06, -390, 0, 1167, 725);
                break;
            }
            case 7: {
                const background_L07 = await Canvas.loadImage("./photo/welcome_bg_L/welcome_bg_L_0007.png");
                ctx.drawImage(background_L07, -100, 15, 465, 625);
                break;
            }
            case 8: {
                const background_L08 = await Canvas.loadImage("./photo/welcome_bg_L/welcome_bg_L_0008.png");
                ctx.drawImage(background_L08, -120, -10, 511, 650);
                break;
            }
            case 9: {
                const background_L09 = await Canvas.loadImage("./photo/welcome_bg_L/welcome_bg_L_0009.png");
                ctx.drawImage(background_L09, -50, -30, 306, 700);
                break;
            }
            case 10: {
                const background_L10 = await Canvas.loadImage("./photo/welcome_bg_L/welcome_bg_L_0010.png");
                ctx.drawImage(background_L10, -300, -30, 829, 1100);
                break;
            }
        }

        switch (random_R) {
            case 1: {
                const background_R01 = await Canvas.loadImage("./photo/welcome_bg_R/welcome_bg_R_0001.png");
                ctx.drawImage(background_R01, 560, 0, 544, 840);
                break;
            }
            case 2: {
                const background_R02 = await Canvas.loadImage("./photo/welcome_bg_R/welcome_bg_R_0002.png");
                ctx.drawImage(background_R02, 480, 5, 535, 900);
                break;
            }
            case 3: {
                const background_R03 = await Canvas.loadImage("./photo/welcome_bg_R/welcome_bg_R_0003.png");
                ctx.drawImage(background_R03, 410, -30, 735, 900);
                break;
            }
            case 4: {
                const background_R04 = await Canvas.loadImage("./photo/welcome_bg_R/welcome_bg_R_0004.png");
                ctx.drawImage(background_R04, 330, -40, 786, 994);
                break;
            }
            case 5: {
                const background_R05 = await Canvas.loadImage("./photo/welcome_bg_R/welcome_bg_R_0005.png");
                ctx.drawImage(background_R05, 240, -150, 919, 1024);
                break;
            }
            case 6: {
                const background_R06 = await Canvas.loadImage("./photo/welcome_bg_R/welcome_bg_R_0006.png");
                ctx.drawImage(background_R06, 510, 0, 516, 750);
                break;
            }
            case 7: {
                const background_R07 = await Canvas.loadImage("./photo/welcome_bg_R/welcome_bg_R_0007.png");
                ctx.drawImage(background_R07, 390, -50, 791, 850);
                break;
            }
            case 8: {
                const background_R08 = await Canvas.loadImage("./photo/welcome_bg_R/welcome_bg_R_0008.png");
                ctx.drawImage(background_R08, 550, -30, 404, 700);
                break;
            }
            case 9: {
                const background_R09 = await Canvas.loadImage("./photo/welcome_bg_R/welcome_bg_R_0009.png");
                ctx.drawImage(background_R09, 460, 20, 542, 625);
                break;
            }
            case 10: {
                const background_R10 = await Canvas.loadImage("./photo/welcome_bg_R/welcome_bg_R_0010.png");
                ctx.drawImage(background_R10, 600, -20, 400, 686);
                break;
            }
        }


        ctx.font = '130px HFMoonlight';
        ctx.fillStyle = '#8affc6';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText(`welcome`, 450, 550);

        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath();
        ctx.arc(450, 280, 200, 0, Math.PI * 2, true);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(450, 280, 200, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(avatar, 250, 80, 400, 400);

        const attachment = new MessageAttachment(canvas.toBuffer(), 'welcome.png');
        const channel = message.guild.channels.cache.find(c => c.name === "✨閒聊區");
        const channel3 = message.guild.channels.cache.find(c => c.name === "✨自治區聊天室");

        if (args[2] === '1') channel.send({ content: `歡迎 <@${args[1]}> 來到鳴鈴的窩`, files: [attachment] });
        else if (args[2] === '3') channel3.send({ content: `歡迎 <@${args[1]}> 來到鳴鈴的窩3區(自治區)`, files: [attachment] });
        message.delete();

    } else if (message.content.startsWith('a01')) {
        const args = message.content.slice(('a01').length).split('<$!$>');
        const w01_args = args[0].split(',');
        const w02_args = args[1].split(',');
        const w03_args = args[2].split(',');
        const w04_args = args[3].split(',');
        const w05_args = args[4].split(',');
        const w06_args = args[5].split(',');
        const w07_args = args[6].split(',');
        const w08_args = args[7].split(',');
        const w09_args = args[8].split(',');
        const w10_args = args[9].split(',');

        const canvas = Canvas.createCanvas(900, 506);
        const ctx = canvas.getContext('2d');
        const background = await Canvas.loadImage("./photo/wish/bg.png");
        const w01 = await Canvas.loadImage(w01_args[0]);
        const w02 = await Canvas.loadImage(w02_args[0]);
        const w03 = await Canvas.loadImage(w03_args[0]);
        const w04 = await Canvas.loadImage(w04_args[0]);
        const w05 = await Canvas.loadImage(w05_args[0]);
        const w06 = await Canvas.loadImage(w06_args[0]);
        const w07 = await Canvas.loadImage(w07_args[0]);
        const w08 = await Canvas.loadImage(w08_args[0]);
        const w09 = await Canvas.loadImage(w09_args[0]);
        const w10 = await Canvas.loadImage(w10_args[0]);

        ctx.drawImage(background, 0, 0, 900, 506);

        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        ctx.drawImage(w01, 80, 103, 100, 100);
        ctx.drawImage(w02, 240, 103, 100, 100);
        ctx.drawImage(w03, 400, 103, 100, 100);
        ctx.drawImage(w04, 560, 103, 100, 100);
        ctx.drawImage(w05, 720, 103, 100, 100);

        ctx.drawImage(w06, 80, 303, 100, 100);
        ctx.drawImage(w07, 240, 303, 100, 100);
        ctx.drawImage(w08, 400, 303, 100, 100);
        ctx.drawImage(w09, 560, 303, 100, 100);
        ctx.drawImage(w10, 720, 303, 100, 100);

        const attachment = new MessageAttachment(canvas.toBuffer(), 'wish.png');

        const channel = message.guild.channels.cache.find(c => c.name === "⭐圖片備份紀錄");

        channel.send({ content: args[10], files: [attachment] });
        message.delete();
    }


});
//以上

client.login(config.canvastoken);

