#!/usr/bin/env node

/**
 * Stop Hook: 记录每次会话的最后回答
 * 在每次 Claude 回答结束时自动调用
 */

const fs = require("fs");
const path = require("path");

// 从 stdin 读取 hook 数据
let inputData = "";
process.stdin.on("data", (chunk) => {
  inputData += chunk;
});

process.stdin.on("end", () => {
  const timestamp = new Date().toISOString().replace(/:/g, "-");

  fs.writeFileSync(
    path.join(process.cwd(), ".claude", "sessions", `debug-${timestamp}.md`),
    inputData,
    "utf-8",
  );
});
