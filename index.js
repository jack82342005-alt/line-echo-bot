const express = require("express");
const line = require("@line/bot-sdk");

const app = express();

// LINE 設定
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

// OpenAI 設定
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!config.channelAccessToken || !config.channelSecret) {
  console.error("Missing CHANNEL_ACCESS_TOKEN or CHANNEL_SECRET");
  process.exit(1);
}
if (!OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY");
  process.exit(1);
}

const client = new line.Client(config);

// 呼叫 OpenAI Responses API（用 fetch，不用額外裝套件）
async function askOpenAI(userText) {
  const resp = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "你是群組裡的助理。回答要簡短、清楚、可執行。若資訊不足，先問1個最關鍵的反問。",
        },
        { role: "user", content: userText },
      ],
      max_output_tokens: 250,
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`OpenAI API error ${resp.status}: ${t}`);
  }

  const data = await resp.json();

  // 盡量相容多種回傳格式：優先取 output_text
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  // fallback：從 output 結構抓文字
  const out = data.output || [];
  for (const item of out) {
    const content = item.content || [];
    for (const c of content) {
      if (c.type === "output_text" && c.text) return String(c.text).trim();
      if (c.type === "text" && c.text) return String(c.text).trim();
    }
  }

  return "我收到你的問題了，但我剛剛沒有生成到文字回答（可能是回傳格式變了）。";
}

// Webhook endpoint
app.post("/webhook", line.middleware(config), async (req, res) => {
  try {
    const events = req.body.events || [];

    await Promise.all(
      events.map(async (event) => {
        // 只處理文字訊息
        if (event.type !== "message" || event.message.type !== "text") return;

        // 只在群組回（你要私聊也回的話，把這段拿掉）
        if (event.source.type !== "group") return;

        const text = (event.message.text || "").trim();

        // 避免群組太吵：建議用「@機器人」或以 ! 開頭才回
        // 你先用最簡單：以 ! 開頭才回
        if (!text.startsWith("!")) return;

        const question = text.slice(1).trim();
        if (!question) return;

        const answer = await askOpenAI(question);

        await client.replyMessage(event.replyToken, {
          type: "text",
          text: answer,
        });
      })
    );

    res.status(200).end();
  } catch (err) {
  const detail =
    err?.response?.data
      ? JSON.stringify(err.response.data)
      : (err?.message || String(err));

  console.error("OPENAI ERROR DETAIL:", detail);

  await client.replyMessage(event.replyToken, {
    type: "text",
    text: `我剛剛回答失敗了 🥲\n原因：${detail}`,
  });
}
});

// Render 指定 PORT
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
