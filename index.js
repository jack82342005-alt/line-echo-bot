const express = require("express");
const line = require("@line/bot-sdk");

const app = express();

// LINE 設定
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);

// webhook endpoint
app.post(
  "/webhook",
  line.middleware(config),
  async (req, res) => {
    try {
      const events = req.body.events;

      for (const event of events) {
        // 只處理「文字訊息」
        if (event.type !== "message" || event.message.type !== "text") {
          continue;
        }

        // 只在「群組」回應
        if (event.source.type === "group") {
          const text = event.message.text.toLowerCase();

          if (text === "hi") {
            await client.replyMessage(event.replyToken, {
              type: "text",
              text: "我在群組裡囉 👋",
            });
          }
        }
      }

      res.status(200).end();
    } catch (err) {
      console.error(err);
      res.status(500).end();
    }
  }
);

// Render 指定的 PORT
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
