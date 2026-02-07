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

    // ✅ 改成你的 GROUP_ID（C 開頭）或可用的 USER_ID（U 開頭）
    const TARGET_ID = "Cxxxxxxxxxxxxxxxxxxxx";

    await client.pushMessage(TARGET_ID, {
      type: "text",
      text: message,
    });

    return res.send("ok");
  } catch (err) {
    console.error("CRON ERROR:", err?.response?.data || err);
    return res
      .status(500)
      .send("error " + JSON.stringify(err?.response?.data || err?.message || err));
  }
});

// ✅ 一定要在最底部
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server running on port", port);
});
