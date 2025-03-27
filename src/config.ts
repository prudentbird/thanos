import "dotenv/config";
import { google } from "googleapis";

interface Config {
  PORT: string;
  SPREADSHEET_ID: string;
  SLACK_BOT_TOKEN: string;
  SLACK_APP_TOKEN: string;
  MENTORS_CHANNEL_ID: string;
  MEXICO_CHANNEL_ID: string;
}

const requiredConfig = {
  PORT: {
    value: process.env.PORT,
    description: "Port number for the application to run on",
  },
  SPREADSHEET_ID: {
    value: process.env.SPREADSHEET_ID,
    description: "Google Sheets ID for logging deportations",
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
  MEXICO_CHANNEL_ID: {
    value: process.env.MEXICO_CHANNEL_ID,
    description: "Channel ID for Mexico-specific operations",
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

const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets"
  ],
});

export const sheets = google.sheets({
  version: "v4",
  auth,
});