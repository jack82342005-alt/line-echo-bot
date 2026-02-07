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

      const text = event.message.text || "";
const isGroup = event.source.type === "group";

// 你的機器人顯示名稱（跟群組裡看到的一樣）
const BOT_NAME = "錦鯉優勢對話有限公司";

// 是否在叫我
const isCallingBot = text.includes(BOT_NAME);

console.log("U16718d2eefc3779247e529881d6e0ba0:", event.source.userId);
      // 群組 @ 小助手 → 今天行程
if (isGroup && isCallingBot && text.includes("今天")) {
  await client.replyMessage(event.replyToken, {
    type: "text",
    text: "我幫你查今天的行程中 ⏳",
  });

  // 👉 這裡之後會改成「真的查 Google Calendar」
  return;
}

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
    const GAS_URL =
      "https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLiisEP_mpQhmt99vA08s1lCiuqEQpO7_zfddchQfRMH3Oq5NDGksgAvP4zKJZG-E68me-k2RqNZEI2_QXljP50xF9ofJDsuUFtieTn67rRedySgWXh1epHhlgpwxLS48SLWD8cLirD0VqRLjd1wYyi2IqN1mRshjgPS3WaZ1bNN0YUnO4_uEqf8PTmDruSUmAvD0FXHzjfy6sE4qgys9wlvQKSd0EgkK8KFJ6Tu1GJvpg-9dDCc_ZBxV_VORTCUky_l0u8HpnD0_kaEaPdTQQ0NAX88-warUXmDs0o5&lib=Mt5DjXQx-1gxYNn5QBg1h_qbv70iApjm-";

    const gasRes = await fetch(GAS_URL);
    const message = await gasRes.text();

    const TARGET_ID = "USER_ID: U16718d2eefc3779247e529881d6e0ba0"; // 下一步再改

    await client.pushMessage(TARGET_ID, {
      type: "text",
      text: message,
    });

    res.send("ok");
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

