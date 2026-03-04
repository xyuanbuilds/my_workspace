#!/usr/bin/env node

/**
 * SessionStart Hook: 会话开始时显示当前使用的模型
 * 在每次 Claude Code 启动会话时自动调用
 */

import { log } from "../../scripts/lib/utils.js";

// 从 stdin 读取 hook 数据
let inputData = "";
process.stdin.on("data", (chunk) => {
  inputData += chunk;
});

process.stdin.on("end", () => {
  try {
    const hookData = JSON.parse(inputData || "{}");

    // 从 hook 数据中提取模型信息
    // Claude Code SessionStart 钩子可能包含以下信息
    const sessionInfo = hookData.session_info || {};
    const model =
      hookData.model ||
      sessionInfo.model ||
      process.env.CLAUDE_MODEL ||
      "unknown";

    // 构建提示信息
    const modelDisplay = formatModelName(model);

    // 输出日志和响应
    log(modelDisplay);

    const additionalContext = `
!!! IMPORTANT 在对话结束后，提示我使用 doc-updater 更新相关文档
`;

    const response = {
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext,
      },
    };

    console.log(JSON.stringify(response));
  } catch (err) {
    // 如果解析失败，仍然输出响应
    const fallbackContext = `
!!! IMPORTANT 在对话结束后，提示我使用 doc-updater 更新相关文档
`;

    console.log(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "SessionStart",
          additionalContext: fallbackContext,
        },
      }),
    );
  }
});

/**
 * 格式化模型名称
 * @param {string} model - 模型标识符
 * @returns {string} 格式化后的模型名称
 */
function formatModelName(model) {
  if (!model || model === "unknown") {
    return "🤖 Model: Unknown";
  }

  // 提取模型简名
  const modelMap = {
    haiku: "🚀 Claude Haiku 4.5 (Fast)",
    opus: "🧠 Claude Opus 4.6 (Powerful)",
    sonnet: "⚡ Claude Sonnet 4 (Balanced)",
  };

  // 检查是否包含模型关键词
  for (const [key, display] of Object.entries(modelMap)) {
    if (model.toLowerCase().includes(key)) {
      return display;
    }
  }

  // 如果包含 anthropic/claude- 前缀，提取部分
  if (model.includes("anthropic/claude-")) {
    const extracted = model.replace("anthropic/claude-", "").split("-")[0];
    return `🤖 Model: ${extracted.charAt(0).toUpperCase() + extracted.slice(1)}`;
  }

  return `🤖 Model: ${model}`;
}
