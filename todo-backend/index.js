require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

require("./models/Todo");
const todoRouter = require("./routes/todos");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Todo Backend 서버가 실행 중입니다.");
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/todos", todoRouter);

async function startServer() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error("MONGODB_URI 환경 변수가 필요합니다.");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("연결 성공");

    app.listen(PORT, () => {
      console.log(`서버 실행 중: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB 연결 실패:", error.message);
    process.exit(1);
  }
}

startServer();
