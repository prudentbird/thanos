import { WebClient } from "@slack/web-api";
import appConfig, { sheets } from "./config";

export const getAllChannelMembers = async (
  client: WebClient,
  channelId: string,
): Promise<string[]> => {
  let allMembers: string[] = [];
  let cursor = "";

  do {
    const result = await client.conversations.members({
      channel: channelId,
      limit: 999,
      cursor: cursor || undefined,
    });

    allMembers = allMembers.concat(result.members || []);
    cursor = result.response_metadata?.next_cursor || "";
  } while (cursor);

  return allMembers;
};
export const getDeportationLogs = async (userIds: string[]) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: appConfig.SPREADSHEET_ID,
      range: 'Sheet1!A:D',
    });

    if (!response.data.values) {
      return [];
    }

    const logs = response.data.values
      .filter(row => userIds.includes(row[0]))
      .map(row => ({
        userId: row[0],
        originalChannels: row[1].split(', '),
        deportedBy: row[2],
        timestamp: row[3]
      }));

    return logs;
  } catch (error) {
    console.error('Error getting deportation logs from Google Sheets:', error);
    throw error;
  }
};

export const uploadDeportationLogsToGoogleSheets = async (deportLogs: {
  userId: string;
  originalChannels: string[];
  deportedBy: string;
  timestamp: string;
}[]) => {
  try {
    const values = deportLogs.map(log => [
      log.userId,
      log.originalChannels.join(', '),
      log.deportedBy,
      log.timestamp
    ]);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: appConfig.SPREADSHEET_ID,
      range: 'Sheet1!A:D',
    });

    const lastRow = response.data.values ? response.data.values.length + 1 : 1;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: appConfig.SPREADSHEET_ID,
      requestBody: {
        requests: [{
          updateCells: {
            start: {
              sheetId: 0,
              rowIndex: lastRow,
              columnIndex: 0
            },
            rows: values.map(row => ({
              values: row.map(cell => ({
                userEnteredValue: { stringValue: cell }
              }))
            })),
            fields: 'userEnteredValue'
          }
        }]
      }
    });
  } catch (error) {
    console.error('Error logging to Google Sheets:', error);
    throw error;
  }
};
