import { WebClient } from "@slack/web-api";

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
