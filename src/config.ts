import "dotenv/config";

interface Config {
  PORT: string;
  SLACK_BOT_TOKEN: string;
  SLACK_APP_TOKEN: string;
  MENTORS_CHANNEL_ID: string;
  GEMINI_API_KEY: string;
}

const requiredConfig = {
  PORT: {
    value: process.env.PORT,
    description: "Port number for the application to run on",
  },
  SLACK_BOT_TOKEN: {
    value: process.env.SLACK_BOT_TOKEN,
    description: "Slack bot token for authentication",
  },
  SLACK_APP_TOKEN: {
    value: process.env.SLACK_APP_TOKEN,
    description: "Slack app token for socket mode",
  },
  MENTORS_CHANNEL_ID: {
    value: process.env.MENTORS_CHANNEL_ID,
    description: "Channel ID for mentor-specific operations",
  },
  GEMINI_API_KEY: {
    value: process.env.GEMINI_API_KEY,
    description: "API key for Gemini AI services",
  },
};

const appConfig = Object.entries(requiredConfig).reduce(
  (acc, [key, { value, description }]) => {
    if (!value) {
      throw new Error(
        `Missing required environment variable: ${key} (${description})`,
      );
    }
    acc[key as keyof Config] = value;
    return acc;
  },
  {} as Config,
);

export default appConfig;
