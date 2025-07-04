const fs = require('fs').promises;
const { Client, Events, GatewayIntentBits, GuildMessageManager, ChannelType, Partials } = require('discord.js');
const { token } = require('./config.json');
const { channel } = require('diagnostics_channel');

const PREREQUISITES_PATH = "./prerequisites/data.json";
const TEXT_COMMANDS = ["add channel", "remove channel"]

const ALLOWED_GUILD_IDS = ["1387746418936250368"];
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
			console.log("CRITICAL ERROR !!");
            return;
		}
	}
	
});

// Log in to Discord with your client's token
client.login(token);
client.on('messageCreate', message =>
{
	let found_command = TEXT_COMMANDS.find(cmd => message.content.startsWith(cmd));
	if (message.content === "update")
		/*
		Get Live Update from the console.
		Check if the latest output from the OCI Script outputs an error to notify the user.
		*/
	{
		
	}

	else if ( found_command && message.channel.type != ChannelType.DM)
		// check if the command is found AND if it is a SERVER-ONLY command or not

	{
		// I'm Parsin'
		let args = message.content.slice(found_command.length).trim().split(/\s+/)
		let parsed = param_parse(args);
		
		switch (found_command)
		{
			case 'add channel':
			/*		
				Updating the channels list available for that server
				so that it can scales more than just hard coding it.

				It does not add DMs to the list.

				Usage:
				add channel => adds the current channel ur texting on
				add channel <Channel name? => adds the channel with the given name to the list;
			*/

				add_channel_via_msg(message.channel, parsed);
				break;

			case 'remove channel':
			/* 
				Don't want that channel anymore? use this to delete

				Usage:
				remove channel => delete the current channel from the prerequisites file
				remove channel <Channel name> => deletes the channel with the given name;
			*/

				remove_channel_via_msg(message.channel, parsed)
				break;
			default:
				return;

		}


	}
})

function param_parse(args)
{
	/* 
		args: message content - the user input splitted.
	*/
	let command_list = TEXT_COMMANDS;
	let parsed = {};
	for (let i = 0; i < args.length;)
	{
		let arg = args[i];
		if (command_list.includes(arg))
		{
			let value = args[i + 1]
			if (value && !command_list.includes(value))
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

	return parsed;
}
async function save_to_prerequisites(server_id, channel_id, msg_source)
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

async function remove_from_prerequisites(server_id, channel_id, msg_source)
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
			await msg_source.send("Internal Error");	
			console.log("json_data.servers not found!!");
			return;
		}

		if (json_data.servers[server_id])
		{
			if(!json_data.servers[server_id].includes(channel_id))
			{
				await msg_source.send("Channel name does not exist in the \"db\" !");
				return;
			}
			else
			{
				json_data.servers[server_id].splice(json_data.servers[server_id].indexOf(channel_id), 1);
			}
		}
		else
		// server isnt added yet
		{
			await msg_source.send("Server does not exist in the \"db\" !")
		}

		await fs.writeFile(PREREQUISITES_PATH, JSON.stringify(json_data, null, '\t'));
		await msg_source.send("Channel removed!");

	}
	catch(error)
	{
		console.log(error);
	}
}


function add_channel_via_msg(msg_source, parsed)
{
	

	if (Object.keys(parsed).length === 0)
		/*
		If command entered without parameters:
		*/

	{
		let server_id = msg_source.guild.id;
		let channel_id = msg_source.id;
		save_to_prerequisites(server_id, channel_id, msg_source);
	}

	else
		/*
		If command entered with parameters:
		*/
	{
		for (key in parsed)
		{
			if (key === '--channel-name')
				/*
				--channel-name:
					Use channel names instead of ID.
					Get server ID and channel ID here.
				*/
				{
					let value = parsed[key];
					let channel_id = msg_source.channels.cache.find(
						ch => ch.name === value
					);
					if (!channel_id)
					{
						msg_source.send("Invalid channel name!");
						return false;
					}
					else
					{
						save_to_prerequisites(message.guild.id, channel_id.id, msg_source);
						return true;
					}
				}
		}
		
	}
	
}

function remove_channel_via_msg(msg_source, parsed)
{
	if (Object.keys(parsed).length === 0)
		/*
		If command entered without parameters:
		*/

	{
		let server_id = msg_source.guild.id;
		let channel_id = msg_source.id;
		remove_from_prerequisites(server_id, channel_id, msg_source);
	}


	else
	/*
	If command entered with parameters:
	*/
	{
		for (key in parsed)
		{
			if (key === '--channel-name')
				/*
				--channel-name:
					Use channel names instead of ID.
					Get server ID and channel ID here.
				*/
				{
					let value = parsed[key];
					let channel_id = msg_source.channels.cache.find(
						ch => ch.name === value
					);
					if (!channel_id)
					{
						msg_source.send("Invalid channel name!");
						return false;
					}
					else
					{
						remove_from_prerequisites(message.guild.id, channel_id.id, msg_source);
						return true;
					}
				}
		}
		
	}
	
}