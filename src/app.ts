import { App, LogLevel } from "@slack/bolt";
import appConfig from "./config";
import { getAllChannelMembers, uploadDeportationLogsToGoogleSheets, getDeportationLogs } from "./utils";

const app = new App({
  socketMode: true,
  token: appConfig.SLACK_BOT_TOKEN,
  appToken: appConfig.SLACK_APP_TOKEN,
  logLevel: LogLevel.INFO,
  customRoutes: [
    {
      path: "/",
      method: ["GET"],
      handler: (req, res) => {
        const healthCheckResponse = {
          status: "OK",
          message: `Things are going just fine with Thanos at ${req.headers.host}!`,
          timestamp: new Date().toISOString(),
        };

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(healthCheckResponse));
      },
    },
  ],
  installerOptions: {
    port: parseInt(appConfig.PORT),
  },
});

app.message(async ({ message, say, client, logger }) => {
  try {
    const botInfo = await client.auth.test();
    const botUserId = botInfo.user_id;

    if ("text" in message && message.text?.includes(`<@${botUserId}>`)) {
      await say({
        text: "*Thanos is INEVITABLE* :warn: \n\nPrepare yourself for the snap! :thanos-gaunlet:",
        thread_ts: message.ts,
      });
    }
  } catch (error) {
    logger.error("Error handling message event:", error);
  }
});

app.command("/dice", async ({ command, ack, say, client, logger }) => {
  try {
    await ack();

    const excludeChannelMembers = await getAllChannelMembers(
      client,
      appConfig.MENTORS_CHANNEL_ID,
    );

    if (!excludeChannelMembers.includes(command.user_id)) {
      await say(
        ":x: Unauthorized to perform this action. Only mentors can roll the dice.",
      );
      return;
    }

    const allMembers = await getAllChannelMembers(client, command.channel_id);

    const users = allMembers.filter(
      (user) => !excludeChannelMembers.includes(user),
    );

    if (users.length === 0) {
      await say("No eligible users found to roll the dice!");
      return;
    }

    const randomUser = users[Math.floor(Math.random() * users.length)];
    const initiatorInfo = await client.users.info({ user: command.user_id });

    await say(
      `🎲 The dice has chosen <@${randomUser}>!\n\nRolled by <@${initiatorInfo.user?.id}>`,
    );
  } catch (error) {
    logger.error("Error handling /dice command:", error);
  }
});
app.command("/deport", async ({ command, ack, say, client, logger }) => {
  try {
    await ack();

    const excludeChannelMembers = await getAllChannelMembers(
      client,
      appConfig.MENTORS_CHANNEL_ID,
    );

    if (!excludeChannelMembers.includes(command.user_id)) {
      await say(
        ":x: Unauthorized to perform this action. Only mentors can deport interns.",
      );
      return;
    }

    const targetUsers = command.text.trim();
    if (!targetUsers) {
      await say("Please specify users to deport (e.g. /deport @user1 @user2)");
      return;
    }

    const userIds = targetUsers.match(/<@(\w+)>/g)?.map(user => user.replace(/[<@>]/g, '')) || [];

    if (userIds.length === 0) {
      await say("No valid users specified. Please use format: /deport @user1 @user2");
      return;
    }

    const deportLogs = [];

    for (const userId of userIds) {
      const channels = await client.users.conversations({
        user: userId,
        types: 'public_channel,private_channel'
      });
      
      const originalChannels = [];
      
      for (const channel of channels.channels || []) {
        if (!channel.id) {
          logger.warn(`Skipping channel without ID: ${channel.name}`);
          continue;
        }

        try {
          await client.conversations.kick({ channel: channel.id, user: userId });
          originalChannels.push(channel.id);
        } catch (error) {
          logger.warn(`Could not remove user from channel ${channel.name}:`, error);
        }
      }
      
      await client.conversations.invite({
        channel: appConfig.MEXICO_CHANNEL_ID,
        users: userId
      });

      deportLogs.push({
        userId,
        originalChannels,
        deportedBy: command.user_id,
        timestamp: new Date().toISOString()
      });
    }

    try {
      await uploadDeportationLogsToGoogleSheets(deportLogs);
    } catch (error) {
      logger.error("Error logging to Google Sheets:", error);
    }

    const userMentions = userIds.map(id => `<@${id}>`).join(' ');
    await client.chat.postMessage({
      channel: appConfig.MEXICO_CHANNEL_ID,
      text: `${userMentions} has been deported to Mexico by <@${command.user_id}>`
    });
  } catch (error) {
    logger.error("Error handling /deport command:", error);
  }
});

app.command("/reinstate", async ({ command, ack, say, client, logger }) => {
  try {
    await ack();

    const excludeChannelMembers = await getAllChannelMembers(
      client,
      appConfig.MENTORS_CHANNEL_ID,
    );

    if (!excludeChannelMembers.includes(command.user_id)) {
      await say(
        ":x: Unauthorized to perform this action. Only mentors can reinstate users.",
      );
      return;
    }

    const targetUsers = command.text.trim();
    if (!targetUsers) {
      await say("Please specify users to reinstate (e.g. /reinstate @user1 @user2)");
      return;
    }

    const userIds = targetUsers.match(/<@(\w+)>/g)?.map(user => user.replace(/[<@>]/g, '')) || [];

    if (userIds.length === 0) {
      await say("No valid users specified. Please use format: /reinstate @user1 @user2");
      return;
    }

    const deportationLogs = await getDeportationLogs(userIds);

    for (const userId of userIds) {
      const userLogs = deportationLogs.filter(log => log.userId === userId);
      
      if (userLogs.length === 0) {
        await say(`No deportation record found for <@${userId}>`);
        continue;
      }

      for (const log of userLogs) {
        for (const channelId of log.originalChannels) {
          try {
            await client.conversations.invite({
              channel: channelId,
              users: userId
            });
          } catch (error) {
            logger.warn(`Could not add user to channel ${channelId}:`, error);
          }
        }
      }

      try {
        await client.conversations.kick({
          channel: appConfig.MEXICO_CHANNEL_ID,
          user: userId
        });
      } catch (error) {
        logger.warn(`Could not remove user from Mexico channel:`, error);
      }
    }

    const userMentions = userIds.map(id => `<@${id}>`).join(' ');
    await say(`${userMentions} have been reinstated by <@${command.user_id}>`);
  } catch (error) {
    logger.error("Error handling /reinstate command:", error);
  }
});

(async () => {
  await app.start(appConfig.PORT || 3000);
  console.log(`⚡️ Thanos is running in socket mode on port ${appConfig.PORT || 3000}!`);
})();
