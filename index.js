const fs = require('fs').promises;
const { Client, Events, GatewayIntentBits, GuildMessageManager, ChannelType, Partials } = require('discord.js');
const { token } = require('./config.json');

const PREREQUISITES_PATH = "./prerequisites/data.json";
const CREATE_CHANNEL_FLAGS = ["--channel-name"]
const TEXT_COMMANDS = ["add channel", "remove channel"]


// Create a new client instance
const client = new Client({
	intents: [GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.DirectMessages,
			GatewayIntentBits.MessageContent],
		
		partials: [Partials.Channel, Partials.Message]
	});

// Create a folder to save prerequisites.
fs.mkdir("./prerequisites", {recursive: true});

client.once(Events.ClientReady, async readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);

	// getting prequesites 
	// try
	// {
		
	// }
	// catch(e)
	// {
	// 	console.log(e)
	// }
});

// Log in to Discord with your client's token
client.login(token);
client.on('messageCreate', message =>
{
	if (message.content === "update")
		/*
		Get Live Update from the console.
		Check if the latest output from the OCI Script outputs an error to notify the user.
		*/
	{
		if (message.channel.type === ChannelType.DM)
		{
			message.channel.send("On it rn! ")
		}
		else if (message.channel.type === ChannelType.GuildText)
			// only do this if a message is from a server
		{
			message.channel.send("On it rn! ")
		}
	}

	// TODO: make it so that this checks for every command in TEXT_COMMANDS.
	else if (message.content.startsWith("add channel") && message.channel.type != ChannelType.DM)
		/*		
			Updating the channels list available for that server
			so that it can scales more than just hard coding it.

			It does not add DMs to the list.
		*/
	{

		
		let args = message.content.slice("add channel".length).trim().split(/\s+/)

		// Parsing.
		let parsed = {}
		for (let i = 0; i < args.length;)
		{
			let arg = args[i];
			if (CREATE_CHANNEL_FLAGS.includes(arg))
			{
				let value = args[i + 1]
				if (value && !CREATE_CHANNEL_FLAGS.includes(value))
				{
					parsed[arg] = value;
					i+=2;
				}
				else
				{
					parsed[arg] = false;
					i+=1;
				}
			}
			else
			{
				i+=1;
			}
		}

		for ( let key in parsed)
		{
			if (key === '--channel-name')
			/*
			--channel-name:
				Use channel names instead of ID.
				Get server ID and channel ID here.
			*/
			{
				let value = parsed[key];
				let channel_id = message.guild.channels.cache.find(
					ch => ch.name === value
				);
				if (!channel_id)
				{
					message.channel.send("Channel not found?");
				}
				else
				{
					save_to_prerequesites(message.guild.id, channel_id.id, message.channel);
				}
			}
		}
		

	}
	// else if (message.content.startsWith("delete message") && message.channel.type != ChannelType.DM)
	// {
		
	// }
})

async function save_to_prerequesites(server_id, channel_id, msg_source)
/*
	server_id and channel_id: server ID and channel ID
	msg_source: the user's command channel location - channel obj.
*/
{
	let json_data = { servers: {} };
	try
	{
		let prev_data = await fs.readFile(PREREQUISITES_PATH, 'utf-8');
		json_data = JSON.parse(prev_data);
	}
	catch(readError)
	{
		if (readError.code !== 'ENOENT')
		{
			console.log(readError);
			await msg_source.send("An error occurred while reading prerequisites.");
            return;
		}
	}
	try
	{

		if (!json_data.servers)
		{
			json_data.servers = {};
		}

		if (json_data.servers[server_id])
		{
			if(json_data.servers[server_id].includes(channel_id))
			{
				await msg_source.send("Channel already added!");
				return;
			}
			else
			{
				json_data.servers[server_id].push(channel_id);
			}
		}
		else
		// brand new data
		{
			json_data.servers[server_id] = [channel_id];
		}

		await fs.writeFile(PREREQUISITES_PATH, JSON.stringify(json_data, null, '\t'));
		await msg_source.send("Channel added!");

	}
	catch(error)
	{
		console.log(error);
	}
}