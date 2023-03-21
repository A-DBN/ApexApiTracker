const {EmbedBuilder } = require('@discordjs/builders');
const axios = require('axios');
const colors = require('../assets/legend_color.json');
const rank = require('../assets/ranks.json')

function get_champion(legend_name, data) {
    let datas = data.data
    const embed = new EmbedBuilder()
        .setTitle(`${legend_name}`)
        .setColor(Number(colors[legend_name]))
        .addFields(
            { name: 'BR Kills', value: String(datas[0].value), inline: true },
            { name: 'Rank', value: `${String(datas[0].rank.rankPos)} (${datas[0].rank.topPercent})`, inline: true },
            { name: '\t**Trackers**', value: '\u200b', inline: false },
        )
        .setThumbnail(data.ImgAssets.icon)
        .setImage(data.ImgAssets.banner)
        .setTimestamp()
    datas.forEach(tracker => {
        embed.addFields(
            {name: tracker.name, value: String(tracker.value), inline: true},
            {name: 'Rank', value: `${String(tracker.rank.rankPos)} (${String(tracker.rank.topPercent)})`, inline: true},
            {name: ' ', value: ' ', inline: false}
        )
    });
    return embed
}

module.exports = {get_champion}