# Thanos Slack Bot

A Slack bot built using the Slack Bolt framework for managing mentor-related operations.

## Features

- Channel member management
- Mentor-specific operations

## Prerequisites

- Node.js (version 18+ recommended)
- Slack workspace with appropriate permissions
- Slack app credentials

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   PORT=3000
   SLACK_BOT_TOKEN=xoxb-your-bot-token
   SLACK_APP_TOKEN=xapp-your-app-token
   MENTORS_CHANNEL_ID=your-channel-id
   ```

## Running the Application

To start the development server:

```bash
npm run dev
```

## Configuration

The application requires the following environment variables:

- `PORT`: Port number for the application
- `SLACK_BOT_TOKEN`: Slack bot token for authentication
- `SLACK_APP_TOKEN`: Slack app token for socket mode
- `MENTORS_CHANNEL_ID`: Channel ID for mentor-specific operations

## Technologies Used

- [Slack Bolt](https://slack.dev/bolt/)
- [TypeScript](https://www.typescriptlang.org/)
- [Node.js](https://nodejs.org/)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
