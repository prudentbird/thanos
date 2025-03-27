import { App, LogLevel } from "@slack/bolt";
import appConfig from "./config";
import { getAllChannelMembers } from "./utils";
import { model } from "./model";

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
      const userMessage = message.text.replace(`<@${botUserId}>`, "").trim();
      const modelResponse = await model.chat(userMessage);

      await say({
        text:
          modelResponse.text ??
          "Unable to provide a response. Please try again later!",
        thread_ts: message.ts,
        as_user: true,
        reply_broadcast: false,
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

(async () => {
  await app.start(appConfig.PORT || 3000);
  console.log(
    `⚡️ Thanos is running in socket mode on port ${appConfig.PORT || 3000}!`,
  );
})();
