#!/usr/bin/env node
/**
 * 测试 Git Confirmation Hook
 *
 * 这个脚本演示如何测试 PreToolUse hook
 * 它模拟 Claude Code 传递给 hook 的输入格式
 */

const { spawn } = require("child_process");
const path = require("path");

/**
 * 测试 hook 的函数
 * @param {string} command - git 命令
 * @param {string} description - 命令描述
 */
function testHook(command, description) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`测试命令: ${description}`);
  console.log(`执行: ${command}`);
  console.log(`${"-".repeat(60)}`);

  // 构造 hook 输入数据
  const inputData = {
    session_id: "e3a3fca0-c165-4e2e-b3d8-7143677c37fc",
    transcript_path: "",
    permission_mode: "default",
    hook_event_name: "PreToolUse",
    tool_name: "Bash",
    tool_input: {
      command,
      description,
    },
    tool_use_id: "x'x'x",
  };

  // 启动 hook 脚本进程
  const hookScript = path.join(__dirname, "hooks", "git-confirmation.js");
  const hook = spawn("node", [hookScript], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";

  hook.stdout.on("data", (data) => {
    stdout += data.toString();
  });

  hook.stderr.on("data", (data) => {
    stderr += data.toString();
  });

  hook.on("close", (code) => {
    console.log(`退出码: ${code}`);

    if (stdout) {
      try {
        const result = JSON.parse(stdout);
        console.log("Hook 响应:", JSON.stringify(result, null, 2));
      } catch (e) {
        console.log(`stdout: ${stdout}`);
      }
    }

    if (stderr) {
      console.log(`stderr: ${stderr}`);
    }
  });

  // 向 hook 发送输入数据
  hook.stdin.write(JSON.stringify(inputData));
  hook.stdin.end();
}

// 运行测试用例
console.log("🧪 开始测试 Git Confirmation Hook\n");

// 测试用例集合
const testCases = [
  { command: "git status", desc: "查看状态（安全）" },
  { command: "git log --oneline", desc: "查看日志（安全）" },
  { command: "git add .", desc: "暂存文件（警告）" },
  { command: "git commit -m 'test'", desc: "创建提交（警告）" },
  { command: "git push origin main", desc: "推送提交（高危）" },
  { command: "git reset --hard HEAD~1", desc: "重置 HEAD（高危）" },
  { command: "git clean -fd", desc: "删除未跟踪文件（高危）" },
  { command: "ls -la", desc: "非 git 命令（忽略）" },
];

// 依次执行测试
let current = 0;

function runNextTest() {
  if (current >= testCases.length) {
    console.log("\n✅ 所有测试完成！");
    process.exit(0);
  }

  const testCase = testCases[current];
  testHook(testCase.command, testCase.desc);
  current++;

  // 延迟执行下一个测试
  setTimeout(runNextTest, 500);
}

runNextTest();
