# Florida State Roleplay Discord Bot

A feature-rich Discord bot designed for the Florida State Roleplay server, providing moderation, role management, and roleplay utilities.

## 🚀 Quick Start

1. **Clone the repository** or download the files
2. **Install Node.js** (v16.9.0 or higher)
3. **Configure the bot** by editing the `.env` file
4. **Install dependencies** by running `npm install`
5. **Deploy commands** with `npm run deploy`
6. **Start the bot** using `npm start`

## ⚙️ Configuration

Create a `.env` file in the root directory with the following variables:

```env
TOKEN=your_bot_token_here
CLIENT_ID=your_bot_client_id_here
GUILD_ID=your_server_id_here
```

## 📋 Available Commands

### Public Commands (Available to everyone)
- `/me [action]` - Describe an action in third person
- `/do [action]` - Describe an action in the environment
- `/try [action]` - Attempt an action with a random outcome
- `/roll [dice]` - Roll dice (e.g., 2d6+3)

### Admin Commands (Requires Admin Role)
- `/warn @user [reason]` - Warn a user
- `/kick @user [reason]` - Kick a user
- `/ban @user [reason] [days]` - Ban a user
- `/mute @user [time] [reason]` - Mute a user
- `/clear [amount] [user]` - Clear messages
- `/say [message]` - Make the bot say something
- `/role` - Manage roles (add/remove/list/info)

### Information Commands
- `/serverinfo` - Show server information
- `/userinfo [user]` - Show user information
- `/help [command]` - Show help for commands

## ☁️ DisCloud Deployment

1. **Create a DisCloud account** at [DisCloud](https://discloudbot.com/) if you haven't already
2. **Install DisCloud CLI**:
   ```bash
   npm install -g @discloudapp/cli
   ```
3. **Login to DisCloud**:
   ```bash
   discloud login
   ```
4. **Set environment variables** in DisCloud dashboard:
   - `TOKEN`: Your Discord bot token
   - `CLIENT_ID`: Your bot's client ID
   - `GUILD_ID`: Your server ID (for testing)
5. **Deploy your bot**:
   ```bash
   # Create a zip file (excludes node_modules and .env)
   git archive -o bot.zip HEAD
   
   # Upload to DisCloud
   discloud upload bot.zip
   ```

## 🔧 Local Development

### Windows
1. Double-click `start.bat` to install dependencies and start the bot
2. Or run these commands manually:
   ```
   npm install
   node deploy-commands.js
   node index.js
   ```

### Linux/MacOS
```bash
# Make the start script executable
chmod +x start.sh

# Run the start script
./start.sh
```

## 🤖 Bot Permissions

Make sure your bot has these permissions in your server:
- Send Messages
- Embed Links
- Manage Messages
- Kick Members
- Ban Members
- Manage Roles
- Mute Members
- Read Message History

## ❓ Need Help?

If you encounter any issues, please check the following:
- Ensure all environment variables are set correctly
- Verify the bot has the necessary permissions
- Check the console for error messages
- Make sure Node.js is installed (v16.9.0 or higher)

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
