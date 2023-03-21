const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const axios = require('axios');
const { api_key } = require('../config.json');
const colors = require('../assets/legend_color.json');
const rank = require('../assets/ranks.json')
const {get_champion} = require('../utils/get_champion')
const path = require('path')

function calcNextRank(rankScore, rankName, rankDiv) {
	let palier = rank[rankName].paliers[String(rankDiv)]
	let more = rankScore - palier
	return String(rank[rankName].toNext - more)
}

function get_name(url) {
	const name = url.split('/').pop().split('.').shift();
	const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
	return capitalized
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('user')
    .setDescription('Get stats for a user')
    .addStringOption(option => option.setName('user').setDescription('Select a user').setRequired(true).addChoices({name: 'ZenkiuD', value:"ZenkiuD_Enjoyer"}, {name: "Layze35", value: "Layze035"}, {name: 'Kani', value:'kxniwave'}, {name: "Other", value: "other"}))
    .addStringOption(option => option.setName('platform').setDescription('Select a platform').setRequired(true).addChoices({name: 'PC', value: "PC"}, {name: 'Xbox', value: "X1"}, {name: 'Playstation', value: "PS4"}))
	.addStringOption(option => option.setName('other_user').setDescription('Input user name').setRequired(false)),
  async execute(interaction) {
	await interaction.deferReply();
	const pages = [];

    let [selecter_user, platform] = [interaction.options.getString('user'), interaction.options.getString('platform')];
	if (selecter_user === 'other') {
		if (!interaction.options.getString('other_user')) await interaction.reply({content: "You need to input a user name", ephemeral: true})
		selecter_user = interaction.options.getString('other_user');
	}
    const user = await axios.get(`https://api.mozambiquehe.re/bridge?auth=${api_key}&player=${selecter_user}&platform=${platform}`);
	const legends = Object.values(user.data.legends.all).filter(legend => legend.data !== undefined);

	// page 1: overall stats
    const overallStats = user.data.global;
	const page1 = new EmbedBuilder()
	.setTitle('Overall Stats')
	.setColor(Number(colors[user.data.legends.selected.LegendName]))
	.addFields(
	  { name: 'Name', value: overallStats.name, inline: true },
	  { name: 'Platform', value: overallStats.platform, inline: true },
	  { name: '\u200b', value: '\u200b', inline: true }, // empty field for spacing
	  { name: 'Level', value: String((overallStats.level + (overallStats.levelPrestige * 500))), inline: true },
	  { name: '% to Next Level', value: String(overallStats.toNextLevelPercent) + "%", inline: true }
	)
	.setImage(user.data.legends.selected.ImgAssets.banner.replace(' ', '%20'))
	.setThumbnail(user.data.legends.selected.ImgAssets.icon.replace(' ', '%20'))
  
    pages.push(page1);

    // page 2: ranked stats
    const rankedStats = user.data.global.rank;
	const page2 = new EmbedBuilder()
    if (rankedStats.rankScore !== '-1' && rankedStats.rankScore !== '-1.0') {
        page2.setTitle('Ranked Stats')
		page2.setColor(Number(rank[rankedStats.rankName].color))
		page2.addFields(
			{ name: 'Name', value: user.data.global.name + '\n', inline: false },
			{ name: 'Rank', value: `${rankedStats.rankName} ${String(rankedStats.rankDiv)}`, inline: true },
			{ name: 'Rank Score', value: String(rankedStats.rankScore) + '\n', inline: false },
			{ name: 'To Next Rank', value: calcNextRank(rankedStats.rankScore, rankedStats.rankName, String(rankedStats.rankDiv)) + " RP", inline: true},
			{ name: "Entry Cost", value: String(rank[rankedStats.rankName].entreycost[String(rankedStats.rankDiv)]) + " RP", inline: true}
		  )		  
        page2.setThumbnail(rankedStats.rankImg);
      pages.push(page2);
    }

	// page 3 : Lobby
	const realtime = user.data.realtime
	const page3 = new EmbedBuilder()
		.setColor(Number(colors[user.data.legends.selected.LegendName]))
		.setTitle('Realtime Information')
		.addFields(
			{ name: 'Name', value: user.data.global.name, inline: true},
			{ name: 'Online Status', value: realtime.isOnline ? 'Online' : 'Offline', inline: true },
			{ name: 'Lobby State', value: realtime.lobbyState, inline:true },
			{ name: 'In Game', value: realtime.isInGame ? 'Yes' : 'No', inline: true },
			{ name: 'Can Join', value: realtime.canJoin ? 'Yes' : 'No', inline:true},
			{ name: 'Party Full', value: realtime.partyFull ? 'Yes' : 'No', inline: true},
			{ name: 'Selected Legend', value: realtime.selectedLegend, inline: true},
		)
		.setThumbnail(user.data.legends.selected.ImgAssets.icon.replace(' ', '%20'))
		.setTimestamp();
		pages.push(page3)

		const selectMenu = new StringSelectMenuBuilder()
		.setCustomId('pageSelector')
		.setPlaceholder('Select a page')
		.addOptions([
			{ label: 'Overall Stats', value: 'Overall Stats' },
			{ label: 'Ranked Stats', value: 'Ranked Stats' },
			{ label: 'Realtime Information', value: 'Realtime Information' },
		])
		for (let i = 0; i < legends.length; i++) {
			if (get_name(legends[i].ImgAssets.icon) === 'Global') continue;
			selectMenu.addOptions({ label: get_name(legends[i].ImgAssets.icon) + " Stats", value: get_name(legends[i].ImgAssets.icon)})
		};
	
		const actionRow = new ActionRowBuilder()
			.addComponents(selectMenu);
	
		const message = await interaction.editReply({components: [actionRow]})
	
		const filter = interaction => interaction.isSelectMenu() && interaction.customId === 'pageSelector';
		const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });
		collector.on('collect', async interaction => {
		  const value = interaction.values[0];
		  if (value !== 'Overall Stats' && value !== 'Ranked Stats' && value !== 'Realtime Information') {
			pages.push(get_champion(value, user.data.legends.all[value]))
		  }
		  const select = pages.find(page => page.data.title === value);
		  await interaction.update({ embeds: [select], components: [actionRow] });
		  selectMenu.setPlaceholder(value);
		});
	
		collector.on('end', async collected => {
		  if (collected.size === 0) {
			await interaction.editReply({ content: 'No options were selected', components: [] });
		  }
		  await message.delete()
		});	}
}