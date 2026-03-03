#!/usr/bin/env node

/**
 * Stop Hook: 记录每次会话的最后回答
 * 在每次 Claude 回答结束时自动调用
 */

const fs = require("fs");
const path = require("path");
const { log } = require("../../scripts/lib/utils");

// 从 stdin 读取 hook 数据
let inputData = "";
process.stdin.on("data", (chunk) => {
  inputData += chunk;
});

const contextExtra = `
!!! IMPORTANT 对话结束后，提示我使用 doc-updater 更新文档
`;

process.stdin.on("end", () => {
  log({
    addition_context: contextExtra,
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: contextExtra,
    },
  });
});
