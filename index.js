const express = require("express");
const line = require("@line/bot-sdk");

const app = express();

// LINE 設定（從 Render Environment 讀）
const config = {
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
};

// LINE client
const client = new line.Client(config);

// Webhook（LINE 進來只走這裡）
app.post("/webhook", line.middleware(config), async (req, res) => {
  // 一定要先回 200
  res.status(200).end();

  const events = req.body.events || [];

  for (const event of events) {
    try {
      // 只處理文字訊息
      if (event.type !== "message" || event.message.type !== "text") continue;

      const text = event.message.text;

      if (text.toLowerCase() === "hi") {
        await client.replyMessage(event.replyToken, {
          type: "text",
          text: "我在 👋",
        });
      } else {
        await client.replyMessage(event.replyToken, {
          type: "text",
          text: `收到：${text}`,
        });
      }
    } catch (err) {
      console.error(err);
    }
  }
});

// Render 健康檢查
app.get("/", (req, res) => {
  res.send("OK");
});

// Render 必須用 PORT
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server running on port", port);
});
