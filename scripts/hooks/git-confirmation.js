#!/usr/bin/env node
/**
 * Git Command Confirmation Hook (PreToolUse)
 *
 * 拦截所有 git 相关的命令执行，要求用户选择确认选项才能继续
 * 此 hook 通过 PreToolUse 事件触发，在工具执行前进行权限验证
 *
 * 支持的操作：
 * - 拦截 Bash 工具中的 git 命令
 * - 显示将要执行的 git 命令
 * - 要求用户确认是否继续
 */

import { readStdinJson, log, output } from "../lib/utils.js";

/**
 * 检查命令是否是 git 相关命令
 * @param {string} command - 要执行的命令
 * @returns {object|null} 返回 git 命令信息或 null
 */
function parseGitCommand(command) {
  if (!command || typeof command !== "string") return null;

  const trimmed = command.trim();

  // 匹配 git 命令的各种形式
  // 例如: git push, git commit, git reset, git clean 等
  const gitMatch = trimmed.match(/^git\s+([a-z-]+)(?:\s+|$)/i);

  if (gitMatch) {
    const gitSubcommand = gitMatch[1];
    return {
      fullCommand: trimmed,
      subcommand: gitSubcommand,
    };
  }

  return null;
}

/**
 * 获取 git 命令的风险级别
 * @param {string} subcommand - git 子命令
 * @returns {string} 风险级别: "safe" | "warning" | "danger"
 */
function getGitRiskLevel(subcommand) {
  // 高危险命令：可能修改或删除历史记录
  const dangerousCommands = [
    "push",
    "force-push",
    "reset",
    "revert",
    "clean",
    "gc",
    "prune",
    "reflog",
    "rm",
  ];

  // 警告命令：可能修改状态
  const warningCommands = [
    "commit",
    "merge",
    "rebase",
    "cherry-pick",
    "stash",
    "branch",
    "tag",
    "switch",
    "checkout",
  ];

  if (dangerousCommands.includes(subcommand)) {
    return "danger";
  } else if (warningCommands.includes(subcommand)) {
    return "warning";
  }

  return "safe";
}

/**
 * 获取命令的显示描述
 * @param {string} subcommand - git 子命令
 * @returns {string} 人类可读的描述
 */
function getCommandDescription(subcommand) {
  const descriptions = {
    push: "推送提交到远程仓库",
    "force-push": "强制推送（覆盖远程历史）",
    commit: "创建新的提交",
    reset: "重置 HEAD 指针",
    revert: "撤销提交",
    clean: "删除未跟踪的文件",
    merge: "合并分支",
    rebase: "变基操作",
    "cherry-pick": "挑选提交",
    stash: "隐藏更改",
    branch: "操作分支",
    tag: "操作标签",
    switch: "切换分支",
    checkout: "切换分支或恢复文件",
    pull: "拉取远程更改",
    fetch: "获取远程更改",
    add: "暂存文件",
    status: "查看仓库状态",
    log: "查看提交历史",
    diff: "查看文件差异",
  };

  return descriptions[subcommand] || `执行 git ${subcommand} 命令`;
}

async function main() {
  try {
    // 从 stdin 读取 hook 输入数据
    const inputData = await readStdinJson({ timeoutMs: 3000 });

    // 获取工具信息
    const toolName = inputData.tool_name || "";
    const toolInput = inputData.tool_input || {};

    // 只处理 Bash 工具
    if (toolName !== "Bash") {
      // 非 git 工具，直接通过
      process.exit(0);
    }

    // 获取要执行的命令
    const command = toolInput.command || "";

    // 解析是否是 git 命令
    const gitInfo = parseGitCommand(command);

    if (!gitInfo) {
      // 不是 git 命令，直接通过
      process.exit(0);
    }

    // 这是一个 git 命令，需要确认
    const riskLevel = getGitRiskLevel(gitInfo.subcommand);
    const description = getCommandDescription(gitInfo.subcommand);

    // 构建响应消息
    let systemMessage = `[Git Confirmation] ${description}\n`;
    systemMessage += `命令: ${gitInfo.fullCommand}`;

    if (riskLevel === "danger") {
      systemMessage = `⚠️ [高危险] ${systemMessage}`;
    } else if (riskLevel === "warning") {
      systemMessage = `⚠️ [警告] ${systemMessage}`;
    }

    // 返回 ask 决策，让用户确认
    // 根据 Claude Code 的 hook 响应格式
    const response = {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason: systemMessage,
      },
    };

    // 输出 JSON 格式的响应到 stdout
    // 这将被 Claude Code 读取并处理
    output(response);

    process.exit(0);
  } catch (err) {
    // 如果出现错误，记录错误但不阻止执行
    log(`[GitConfirmation] Error: ${err.message}`);
    process.exit(0);
  }
}

main();
