#!/usr/bin/env node

/**
 * Stop Hook: 记录每次会话的最后回答
 * 在每次 Claude 回答结束时自动调用
 */

import fs from "fs";
import path from "path";

// 从 stdin 读取 hook 数据
let inputData = "";
process.stdin.on("data", (chunk) => {
  inputData += chunk;
});

process.stdin.on("end", () => {
  try {
    // 处理空数据
    if (!inputData.trim()) {
      console.log("{}");
      return;
    }

    // 解析 hook 数据
    const hookData = JSON.parse(inputData);
    const { session_id, transcript_path, last_assistant_message } = hookData;

    // 确保会话目录存在
    const sessionsDir = path.join(process.cwd(), ".claude", "sessions");
    if (!fs.existsSync(sessionsDir)) {
      fs.mkdirSync(sessionsDir, { recursive: true });
    }

    const now = new Date();
    const timestamp = now.toISOString().replace(/T/, "-").replace(/:/g, "-");
    const filename = `session-${timestamp}.md`;

    /**
     * ! 直接使用 last_assistant_message，如果存在的话，优先记录这个内容，因为它已经是处理过的最终回答了
     * 部分情况下是没有这个字段的，且如果有这个字段不拿，而去解析 transcript_path 反而可能拿到旧的回答，所以优先使用 last_assistant_message
     */
    if (last_assistant_message) {
      // 生成时间戳文件名

      // 构建 markdown 内容
      const markdown = `
**时间**: ${now.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
**文件**: ${filename}
**session**: ${session_id}
---

${last_assistant_message}
`;

      // 保存文件
      const filepath = path.join(sessionsDir, filename);
      fs.writeFileSync(filepath, markdown, "utf-8");
      return;
    }

    // jsonl 文件并解析
    const content = fs.readFileSync(transcript_path, "utf-8");
    const lines = content.trim().split("\n");

    // 提取所有回答
    const assistants = [];
    for (const line of lines) {
      try {
        const record = JSON.parse(line);
        if (
          record.sessionId === session_id &&
          record.type === "assistant" &&
          record.message
        ) {
          assistants.push(record);
        }
      } catch (err) {
        // 忽略解析错误的行
        continue;
      }
    }

    // 提取最后一次助手回答
    const lastAssistantMessage = assistants[assistants.length - 1].message;

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
      console.log(lastAssistantMessage);
      return;
    }

    // 构建 markdown 内容
    const markdown = `
**时间**: ${now.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
**文件**: ${filename}
**session_id**: ${session_id}å
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
