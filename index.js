app.post("/webhook", line.middleware(config), async (req, res) => {
  res.status(200).end(); // 先回 200，避免 LINE 重送

  const events = req.body.events || [];

  for (const event of events) {
    try {
      // 只處理文字訊息
      if (event.type !== "message" || event.message.type !== "text") continue;

      const userText = event.message.text;

      // ✅ 先做「不靠 OpenAI」的回覆測試（確認群組回覆 OK）
      if (userText.toLowerCase() === "hi") {
        await client.replyMessage(event.replyToken, {
          type: "text",
          text: "我在群組裡囉 👋",
        });
        continue;
      }

      // TODO: 這裡之後再接 OpenAI 回覆（等你 quota OK）
      await client.replyMessage(event.replyToken, {
        type: "text",
        text: `收到：${userText}\n（我先用測試回覆，AI 等額度好再接）`,
      });

    } catch (err) {
      const detail =
        err?.response?.data
          ? JSON.stringify(err.response.data)
          : (err?.message || String(err));

      console.error("HANDLER ERROR:", detail);

      // ✅ 注意：這裡的 event 一定存在，才能用 replyToken
      try {
        await client.replyMessage(event.replyToken, {
          type: "text",
          text: `我剛剛回覆失敗了 🙏\n原因：${detail}`,
        });
      } catch (e) {
        console.error("REPLY FAIL:", e?.message || e);
      }
    }
  }
});
