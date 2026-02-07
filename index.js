const express = require("express");
const line = require("@line/bot-sdk");

const app = express();

// LINE 設定
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

if (!config.channelAccessToken || !config.channelSecret) {
  console.error("Missing CHANNEL_ACCESS_TOKEN or CHANNEL_SECRET");
  process.exit(1);
}

// OpenAI Key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// LINE client
const client = new line.Client(config);

// ====== 簡單的 OpenAI 呼叫（不用額外套件）======
async function askLLM(question) {
  if (!OPENAI_API_KEY) {
    return "我現在還沒設定 OPENAI_API_KEY，所以只能先當回聲機器人 🙏";
  }

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "你是群組裡的助理。回答要精準、簡短、可執行。用繁體中文。",
        },
        { role: "user", content: question },
      ],
      temperature: 0.4,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error("OpenAI error:", errText);
    return "我剛剛回覆失敗了（AI 端出錯），你再試一次 🙏";
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content?.trim() || "我想一下再回你 🙏";
}

// webhook endpoint
app.post("/webhook", line.middleware(config), async (req, res) => {
  try {
    const events = req.body.events || [];

    await Promise.all(
      events.map(async (event) => {
        // 只處理文字訊息
        if (event.type !== "message" || event.message.type !== "text") return;

        const text = (event.message.text || "").trim();

        // ===== 群組觸發規則：只有 ! 開頭才回 =====
        const isGroup = event.source.type === "group";
        if (isGroup && !text.startsWith("!")) return;

        // 私聊：不用 ! 也回（你可改成也要 !）
        const question = text.startsWith("!") ? text.slice(1).trim() : text;

        if (!question) return;

        const answer = await askLLM(question);

        return client.replyMessage(event.replyToken, {
          type: "text",
          text: answer,
        });
      })
    );

    res.status(200).end();
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

// Render 指定的 PORT
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
