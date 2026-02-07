const express = require("express");
const line = require("@line/bot-sdk");

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

if (!config.channelAccessToken || !config.channelSecret) {
  console.error("Missing CHANNEL_ACCESS_TOKEN or CHANNEL_SECRET");
  process.exit(1);
}

const client = new line.Client(config);
const app = express();

app.post("/webhook", line.middleware(config), async (req, res) => {
  try {
    const events = req.body.events || [];
    await Promise.all(
      events.map((event) => {
        if (event.type !== "message" || event.message.type !== "text") return;
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: event.message.text,
        });
      })
    );
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.get("/", (_, res) => res.send("OK"));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Listening on port " + port);
});
