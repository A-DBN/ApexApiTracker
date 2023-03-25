const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const axios = require('axios');
const { api_key } = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rotation')
		.setDescription('Get the current map rotation')
        .addStringOption(option => 
            option.setName('map')
                .setDescription('The map you want to know the rotation for')
                .setRequired(true)
                .addChoices({name: 'BR', value: "battle_royale"}, {name: 'Ranked', value: "ranked"}, {name: 'LTM', value: "ltm"})
        ),
	async execute(interaction) {
		const rotation = await axios.get(`https://api.mozambiquehe.re/maprotation?version=2&auth=${api_key}&version=1`)
        let rotationEndPoint
        let current_map = interaction.options.getString('map')
        current_map === 'battle_royale' ? rotationEndPoint = 'battle_royale' : current_map === "ranked" ? rotationEndPoint = 'ranked' : rotationEndPoint = 'ltm';
        if (!current_map) {
            return interaction.reply({ content: 'Please provide a value for the map option.', ephemeral: true });
        }
        const current = rotation.data[rotationEndPoint].current;
        const next = rotation.data[rotationEndPoint].next;

        let title
        current_map === "battle_royale" ? title = 'Current and Upcoming Apex Legends Map Rotation' : title = "Current and Upcoming Apex Legends Ranked Map Rotation"
        let mapFieldName = 'Current Map';
        let mapValue = current.map ? current.map : 'None';
        let eventName = 'None';

        if (interaction.options.getString('map') === 'ltm') {
            if (!current.isActive) return interaction.reply({ content: 'There is no current LTM', ephemeral: true });
            title = 'Current and Upcoming Apex Legends LTM Rotation';
            mapValue = current.map ? current.map : 'None';
            eventName = current.eventName ? current.eventName : '';
        }

        const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor('#00ff00')
        .addFields(
          { name: mapFieldName, value: mapValue, inline: true },
          { name: 'Next Map', value: `${next.map}`, inline: true },
          { name: 'Remaining Time', value: `${current.remainingTimer}`, inline: true },
          { name: 'Start Time', value: `${next.readableDate_start}`, inline: true },
          { name: 'Duration', value:`${Math.floor(next.DurationInMinutes / 60)}:${(next.DurationInMinutes % 60).toString().padStart(2, '0')} ${next.DurationInMinutes < 60 ? "minutes" : "Hours"}`, inline: true }
        )
        .setTimestamp()
        .setThumbnail(current.asset);

        const ltm_embed = new EmbedBuilder()
        .setTitle(title)
        .setColor('#00ff00')
        .addFields(
            { name: mapFieldName, value: mapValue, inline: true },
            { name: 'Event Name', value: eventName, inline: true },
            { name: '\u200b', value: '\u200b', inline: true }, // empty field for spacing
            { name: 'Next Map', value: `${next.map}`, inline: true },
            { name: 'Next Event Name', value: next.eventName ? next.eventName : 'None', inline: true},
            { name: '\u200b', value: '\u200b', inline: true }, // empty field for spacing
            { name: 'Remaining Time', value: `${current.remainingTimer}`, inline: true },
            { name: 'Start Time', value: `${next.readableDate_start}`, inline: true },
            { name: 'Duration', value:`${Math.floor(next.DurationInMinutes / 60)}:${(next.DurationInMinutes % 60).toString().padStart(2, '0')} ${next.DurationInMinutes < 60 ? "minutes" : "Hours"}`, inline: true }
        )        
        .setTimestamp()
        .setThumbnail(current.asset + "/" + current.map + '.png');

        try {
        if (current_map === 'ltm') {
            interaction.reply({ embeds: [ltm_embed] });
          } else {
            const message = await interaction.reply({ embeds: [embed] });
            setTimeout(() => message.delete(), 60 * 1000); // Delete the message after 1 minute (60 seconds * 1000 ms)
          }	
        } catch (error) {
            interaction.reply({ content: 'There was an error while executing this command! Try again later', ephemeral: true });
        }
    }
};
