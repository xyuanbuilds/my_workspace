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
  try {
    // 解析 hook 数据
    const hookData = JSON.parse(inputData);

    // 提取最后一次助手回答
    const messages = hookData.messages || [];
    const lastAssistantMessage = messages
      .slice()
      .reverse()
      .find((msg) => msg.role === "assistant");

    if (!lastAssistantMessage) {
      // 没有找到助手回答，直接通过
      console.log(inputData);
      return;
    }

    // 提取文本内容（忽略工具调用）
    let responseText = "";
    if (Array.isArray(lastAssistantMessage.content)) {
      responseText = lastAssistantMessage.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n\n");
    } else if (typeof lastAssistantMessage.content === "string") {
      responseText = lastAssistantMessage.content;
    }

    // 如果没有文本内容，跳过记录
    if (!responseText || responseText.trim().length === 0) {
      console.log(inputData);
      return;
    }

    // 生成时间戳文件名
    const now = new Date();
    const timestamp = now
      .toISOString()
      .replace(/T/, "-")
      .replace(/:/g, "-")
      .replace(/\..+/, "");
    const filename = `session-${timestamp}.md`;

    // 确保会话目录存在
    const sessionsDir = path.join(process.cwd(), ".claude", "sessions");
    if (!fs.existsSync(sessionsDir)) {
      fs.mkdirSync(sessionsDir, { recursive: true });
    }

    // 构建 markdown 内容
    const markdown = `# Claude 会话记录
**时间**: ${now.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
**文件**: ${filename}

---

${responseText}
`;

    // 保存文件
    const filepath = path.join(sessionsDir, filename);
    fs.writeFileSync(filepath, markdown, "utf-8");

    // 在 stderr 输出提示信息（会显示给 Claude）
    console.error(`\n✅ 回答已记录到文件: ${filename}`);
    console.error(`📁 位置: .claude/sessions/${filename}\n`);

    // 将原始数据传递给 Claude
    console.log(inputData);
  } catch (error) {
    // 出错时也要传递原始数据，避免中断流程
    console.error(`记录回答时出错: ${error.message}`);
    console.log(inputData);
  }
});
