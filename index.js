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
console.log("U16718d2eefc3779247e529881d6e0ba0:", event.source.userId);
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
// 定時推播用 API（給日曆/排程呼叫）
app.get("/cron/daily", async (req, res) => {
  if (req.query.key !== process.env.CRON_SECRET) {
    return res.status(403).send("forbidden");
  }

  try {
    // TODO：改成你要推播的 userId / 群組 ID
    await client.pushMessage("U16718d2eefc3779247e529881d6e0ba0", {
      type: "text",
      text: "⏰ 每日定時推播測試成功",
    });

    res.send("ok");
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});
