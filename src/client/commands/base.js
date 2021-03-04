const { Command, util, CommandoMessage } = require('discord.js-commando');
const { errorEmbed } = require('../../util/Utils');

const { Guild, GuildMember, Role, User } = require('discord.js');

class CleanupCommand extends Command {
    constructor(...args) {
        super(...args);
    }

    /**
     * Overwrite the onBlock method.
     * @param {CommandMessage} message
     * @param {String} reason
     * @param {Object} [data]
     */

    onBlock(message, reason, data) {
        let response;
        switch(reason) {
            case 'guildOnly':
                response = message.direct('', errorEmbed(`The \`${this.name}\` command must be used in a server.`));
                break;
            case 'nsfw':
                response = message.direct('', errorEmbed(`The \`${this.name}\` command can only be used in NSFW channels.`));
                break;
            case 'permission': {
                response = message.direct('', data.response ? errorEmbed(data.response) : errorEmbed(`You do not have permissions to use \`${this.name}\` ${message.guild ? `inside **${message.guild}**\n\nIf you believe this is wrong, contact **${this.constructor._higherRole(message.guild, message.author).size > 0 ? `@${this.constructor._higherRole(message.guild, message.author).first().name}` : message.guild.owner ? message.guild.owner : `<@${message.guild.ownerID}>`}` : 'inside **DM\'s**'}`));
                break;
            }
            case 'clientPermissions': {
                let clientsRole = message.guild ? message.guild.me.roles.cache.filter(cr => cr.managed && cr.name == this.client.user.username).first() : null;
                response = message.reply('', errorEmbed(`I require the following permissions \`${data.missing.map(perm => util.permissions[perm]).join('\`, \`')}\` to run \`${this.name}\` ${message.guild ? `inside **${message.guild}**\n\nIf you believe this is wrong, contact **${this.constructor._higherRole(message.guild, clientsRole).size > 0 ? this.constructor._higherRole(message.guild, clientsRole).first() : message.guild.owner ? message.guild.owner : `<@${message.guild.ownerID}>`}** to double check the permissions.` : 'inside **DM\'s**'}`));
                break;
            }
            case 'throttling': {
                response = message.reply('', errorEmbed(`You may not use ${this.name} again for another ${data.remaining.toFixed(1)}`));
            }
            default: return null;
        }

        return response.then(m => m.delete({ timeout: 20000, reason: 'Automated deletion.' }));
    }

    /**
     * Overwrite the onError method.
     * @param {Error} err 
     * @param {CommandMessage} message 
     * @param {Object|String|Array<String>} args 
     * @param {Boolean} fromPattern 
     * @param {?ArgumentCollectorResult} result
     * @returns {Promise<?Message|?Array<Message>>}
     */

    onError(err, message, args, fromPattern, result) {
        const invite = this.client.options.invite;
		return message.direct('', { embed: {
            title: `**Oops!** <:iconfinder_signerror_299045:796376441751076865>`,
            color: 'ff0000',
			description: `It appears an error has occured with the bot, this is not to any fault of yours.. But we do ask you please join our ${invite ? `[Support Server](${invite})` : 'Support Server'} and notify us of this problem.`,
			fields: [
                { name: 'Error Identifier', value: `\`${message.id}\``, inline: false },
                { name: 'Error Response', value: `\`\`\`js\n${err.name}: ${err.message}\n\`\`\``, inline: false}
            ],
            footer: {
                text: new Date(Date.now()).toLocaleString()
            }
        } }).then(m => m.delete({ timeout: 60000, reason: 'Automated Deletion.' }));
    }

    /**
     * Returns the next highest role that can affect this role
     * @param {Guild|CommandoMessage|Snowflake} guild 
     * @param {Role|GuildMember|User|Snowflake} role 
     * @param 
     */

    static _higherRole(guild, role) {
        if (typeof guild == 'string') guild = this.client.guilds.resolve(guild);
        else if (guild instanceof CommandoMessage) guild = guild.guild;

        // verify that a guild was resolved, or provided.
        if (!guild instanceof Guild) throw new TypeError('Invalid "guild", the guild must be a Snowflake, Message instance, or Guild instance.');

        if (typeof role == 'string') role = guild.roles.resolve(role);
        else if (role instanceof GuildMember) role = role.roles.highest;
        else if (role instanceof User) role = guild.members.resolve(role).roles.highest;

        if (!role instanceof Role) throw new TypeError('Invalid "role", the role must be a Snowflake, GuildMember instance, or Role instance.');

        return guild.roles.cache.filter(r => r.permissions.has('MANAGE_ROLES') && !r.managed).sort((p, n) => p.rawPosition > n.rawPosition).filter(r => r.rawPosition > role.rawPosition);
    }

}

module.exports = CleanupCommand;