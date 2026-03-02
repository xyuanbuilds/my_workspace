# Claude Code Hook 使用指南

**最后更新**：2026-03-02  
**难度**：初级 → 进阶

---

## 快速开始

### 什么是 Hook？

Hook（钩子）是 Claude Code 中的事件处理机制，可以在特定事件发生时自动执行命令或脚本。它们让你能够：

- ✅ **验证操作**：在执行危险命令前拦截并警告
- ✅ **自动化流程**：文件保存后自动格式化、测试
- ✅ **增强提示**：记录会话、补充上下文
- ✅ **执行检查**：停止前确保测试通过、文档更新

### 方式一：使用 Hookify 插件（推荐新手）

Hookify 是最简单的创建 Hook 的方式，通过对话即可配置。

#### 1. 安装 Hookify

```bash
claude plugin add hookify@claude-plugins-official
```

#### 2. 创建第一个 Hook

在 Claude Code 中运行：

```bash
/hookify 当我使用 rm -rf 时警告我
```

Claude 会自动帮你创建 Hook 规则文件。

#### 3. Hook 规则示例

Hookify 会在 `.claude/` 目录创建 `hookify.{规则名}.local.md` 文件：

```markdown
---
name: warn-dangerous-rm
enabled: true
event: bash
pattern: rm\\s+-rf
action: warn
---

⚠️ **检测到危险的 rm 命令！**

你正在执行 `rm -rf`，这可能删除重要文件。

**建议**：

- 仔细检查路径是否正确
- 考虑先备份
- 使用 `ls` 确认目标目录内容
```

#### 4. 常用 Hook 场景

**阻止意外提交敏感文件**：

```bash
/hookify 阻止我提交 .env 文件
```

**停止前检查清单**：

```bash
/hookify 在停止前提醒我确认测试已运行
```

**代码质量检查**：

```bash
/hookify 警告我不要使用 console.log
```

#### 5. 管理 Hook 规则

```bash
/hookify:list              # 查看所有规则
/hookify:configure         # 启用/禁用规则
/hookify:help              # 查看帮助
```

**临时禁用规则**：编辑 `.claude/hookify.{name}.local.md`，设置：

```yaml
enabled: false
```

**删除规则**：直接删除对应的 `.local.md` 文件。

---

### 方式二：手动配置 Hook（更灵活）

对于更复杂的需求，可以直接在 `settings.json` 中配置 Hook。

#### 1. 基本结构

编辑 `.claude/settings.json`：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "tool == \"Bash\" && tool_input.command matches \"npm run dev\"",
        "hooks": [
          {
            "type": "command",
            "command": "echo '提示：开发服务器即将启动' >&2"
          }
        ],
        "description": "开发服务器启动提示"
      }
    ]
  }
}
```

#### 2. Hook 类型速查

| Hook 类型          | 触发时机          | 常见用途           |
| ------------------ | ----------------- | ------------------ |
| `PreToolUse`       | 工具执行前        | 验证、阻止危险操作 |
| `PostToolUse`      | 工具执行后        | 格式化、同步、反馈 |
| `Stop`             | Claude 回答结束时 | 记录会话、检查清单 |
| `UserPromptSubmit` | 用户发送消息时    | 补充上下文、预处理 |
| `SessionStart`     | 会话开始时        | 加载配置、初始化   |
| `PreCompact`       | 上下文压缩前      | 保存状态           |

#### 3. 实用示例

**自动格式化 TypeScript 文件**：

```json
{
  "PostToolUse": [
    {
      "matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\.tsx?$\"",
      "hooks": [
        {
          "type": "command",
          "command": "npx prettier --write \"${tool_input.file_path}\"",
          "timeout": 30
        }
      ],
      "description": "TypeScript 文件保存后自动格式化"
    }
  ]
}
```

**Git 推送前确认**：

```json
{
  "PreToolUse": [
    {
      "matcher": "tool == \"Bash\" && tool_input.command matches \"git push\"",
      "hooks": [
        {
          "type": "command",
          "command": "echo '[Hook] 确认要推送到远程仓库吗？' >&2"
        }
      ],
      "description": "推送前提醒确认"
    }
  ]
}
```

**记录会话内容**：

```json
{
  "Stop": [
    {
      "matcher": "*",
      "hooks": [
        {
          "type": "command",
          "command": "node \".claude/scripts/record-response.js\"",
          "timeout": 10
        }
      ],
      "description": "自动记录会话回答"
    }
  ]
}
```

#### 4. 调试 Hook

查看 Hook 执行结果：

```bash
# Hook 输出到 stderr 会显示在终端
echo "Test message" >&2
```

测试 Hook 脚本：

```bash
# 独立运行脚本测试
node .claude/scripts/your-hook.js
```

---

### 最佳实践

1. **从 Hookify 开始**：新手先用 `/hookify` 创建规则，熟悉后再手动配置
2. **逐步添加**：不要一次添加太多 Hook，避免影响性能
3. **使用描述**：每个 Hook 添加 `description` 字段，方便管理
4. **控制超时**：设置合理的 `timeout`，避免 Hook 执行时间过长
5. **错误处理**：Hook 脚本应该优雅处理错误，不中断主流程

---

## 拓展阅读

### Hook 执行机制

#### 执行流程

1. **事件触发**：Claude Code 检测到特定事件（如工具调用）
2. **匹配器评估**：检查 `matcher` 条件是否满足
3. **Hook 执行**：并行执行所有匹配的 Hook
4. **结果处理**：
   - PreToolUse：可以阻止工具执行（exit code ≠ 0）
   - PostToolUse：可以修改工具输出
   - Stop：可以阻止会话结束

#### Hook 类型详解

**PreToolUse**

- **数据输入**：通过 stdin 接收 JSON，包含 `tool`, `tool_input` 等
- **阻止操作**：返回非零退出码（`exit 1`）
- **提示信息**：写入 stderr（`>&2`）会显示给 Claude
- **数据传递**：必须将原始 stdin 数据输出到 stdout

**PostToolUse**

- **数据输入**：接收工具执行结果
- **修改输出**：可以处理并修改工具返回的数据
- **反馈循环**：在 stderr 输出反馈信息

**Stop**

- **检查清单**：验证任务完成情况
- **阻止停止**：返回非零退出码阻止会话结束
- **记录会话**：保存对话历史、生成报告

**UserPromptSubmit**

- **预处理**：在用户输入发送给 Claude 前处理
- **上下文增强**：自动添加相关信息
- **输入验证**：检查用户输入有效性

### Matcher 语法

#### 基本语法

```javascript
"matcher": "tool == \"Bash\" && tool_input.command matches \"npm\""
```

#### 支持的操作符

| 操作符    | 说明     | 示例                               |
| --------- | -------- | ---------------------------------- |
| `==`      | 等于     | `tool == "Bash"`                   |
| `!=`      | 不等于   | `tool != "Read"`                   |
| `matches` | 正则匹配 | `tool_input.command matches "git"` |
| `&&`      | 逻辑与   | `condition1 && condition2`         |
| `\|\|`    | 逻辑或   | `condition1 \|\| condition2`       |

#### 可用字段

**PreToolUse / PostToolUse**：

- `tool` - 工具名称（Bash, Edit, Write, Read 等）
- `tool_input` - 工具输入参数对象
  - `tool_input.command` - Bash 命令
  - `tool_input.file_path` - 文件路径
  - `tool_input.old_string` - Edit 旧内容
  - `tool_input.new_string` - Edit 新内容

**Stop**：

- `messages` - 会话消息数组
- `session_id` - 会话 ID

**示例**：

```json
// 匹配所有 Edit 或 Write 操作
"matcher": "tool == \"Edit\" || tool == \"Write\""

// 匹配 TypeScript 文件编辑
"matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\.tsx?$\""

// 匹配包管理器命令
"matcher": "tool == \"Bash\" && tool_input.command matches \"(npm|pnpm|yarn)\""
```

### Hookify 高级用法

#### 多条件规则

创建 `.claude/hookify.complex-rule.local.md`：

```markdown
---
name: protect-env-files
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: \\.env
  - field: new_text
    operator: contains
    pattern: API_KEY
action: block
---

🚫 **禁止修改 .env 文件中的 API_KEY**

请使用环境变量管理工具进行修改。
```

#### Event 类型

| Event    | 说明      | Hookify 对应           |
| -------- | --------- | ---------------------- |
| `bash`   | Bash 命令 | PreToolUse(Bash)       |
| `file`   | 文件编辑  | PreToolUse(Edit/Write) |
| `stop`   | 停止检查  | Stop                   |
| `prompt` | 用户输入  | UserPromptSubmit       |
| `all`    | 所有事件  | 所有 Hook 类型         |

#### 操作类型

```yaml
action: warn    # 警告但允许（默认）
action: block   # 阻止操作
```

### Hook 脚本开发

#### Node.js 脚本模板

```javascript
#!/usr/bin/env node
import fs from "fs";

// 读取 hook 数据
let inputData = "";
process.stdin.on("data", (chunk) => {
  inputData += chunk;
});

process.stdin.on("end", () => {
  try {
    const hookData = JSON.parse(inputData);

    // 你的处理逻辑
    const shouldBlock = checkCondition(hookData);

    if (shouldBlock) {
      console.error("⚠️ 操作被阻止！");
      process.exit(1); // 非零退出码阻止操作
    }

    // 必须输出原始数据
    console.log(inputData);
  } catch (error) {
    console.error(`Hook 错误: ${error.message}`);
    console.log(inputData); // 出错时仍需传递数据
    process.exit(0); // 出错不阻止操作
  }
});

function checkCondition(data) {
  // 实现你的检查逻辑
  return false;
}
```

#### Python 脚本模板

```python
#!/usr/bin/env python3
import sys
import json

def main():
    # 读取 hook 数据
    input_data = sys.stdin.read()

    try:
        hook_data = json.loads(input_data)

        # 你的处理逻辑
        should_block = check_condition(hook_data)

        if should_block:
            print('⚠️ 操作被阻止！', file=sys.stderr)
            sys.exit(1)  # 非零退出码阻止操作

        # 必须输出原始数据
        print(input_data)

    except Exception as e:
        print(f'Hook 错误: {e}', file=sys.stderr)
        print(input_data)  # 出错时仍需传递数据
        sys.exit(0)  # 出错不阻止操作

def check_condition(data):
    # 实现你的检查逻辑
    return False

if __name__ == '__main__':
    main()
```

#### Bash 脚本模板

```bash
#!/bin/bash

# 读取 hook 数据
input_data=$(cat)

# 你的检查逻辑
if echo "$input_data" | jq -e '.tool == "Bash"' > /dev/null; then
    echo "⚠️ 检测到 Bash 命令" >&2
fi

# 必须输出原始数据
echo "$input_data"

# 返回 0 允许操作，非 0 阻止
exit 0
```

### 性能优化

#### 1. 控制 Hook 数量

```json
// ✗ 不好：过多 Hook
{
  "PreToolUse": [
    { "matcher": "tool == \"Bash\"", ... },
    { "matcher": "tool == \"Edit\"", ... },
    { "matcher": "tool == \"Write\"", ... },
    { "matcher": "tool == \"Read\"", ... }
  ]
}

// ✓ 好：合并相关 Hook
{
  "PreToolUse": [
    {
      "matcher": "tool == \"Edit\" || tool == \"Write\"",
      ...
    }
  ]
}
```

#### 2. 设置合理超时

```json
{
  "hooks": [
    {
      "type": "command",
      "command": "node script.js",
      "timeout": 5 // 快速脚本使用短超时
    }
  ]
}
```

#### 3. 使用缓存

```javascript
// Hook 脚本中使用缓存
import fs from "fs";

const CACHE_FILE = "/tmp/hook-cache.json";

function getCache() {
  if (fs.existsSync(CACHE_FILE)) {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
  }
  return {};
}

function setCache(data) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data));
}
```

### 常见问题

#### Q: Hook 不执行怎么办？

**排查步骤**：

1. 检查 `settings.json` 语法是否正确
2. 验证 `matcher` 条件是否匹配
3. 确认脚本有执行权限（`chmod +x script.sh`）
4. 检查脚本路径是否正确
5. 独立测试脚本（`node script.js`）

#### Q: Hook 执行太慢？

**优化方案**：

1. 减少 Hook 数量
2. 降低 `timeout` 值
3. 优化脚本性能（避免同步 I/O）
4. 使用缓存减少重复计算
5. 考虑异步执行（后台任务）

#### Q: 如何调试 Hook？

**调试方法**：

```bash
# 1. 查看 Hook 输出
# stderr 会显示在终端

# 2. 添加调试日志
echo "Debug: $variable" >&2

# 3. 保存调试信息到文件
echo "$input_data" > /tmp/hook-debug.json

# 4. 使用 Node.js 调试器
node --inspect-brk script.js
```

#### Q: Hook 与插件冲突？

**解决方案**：

1. 检查插件的 `hooks.json` 配置
2. 调整 Hook 执行顺序（通过配置顺序）
3. 使用更精确的 `matcher` 避免冲突
4. 禁用冲突的插件或 Hook

#### Q: 如何在 Hook 中访问环境变量？

```javascript
// Node.js
const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
const cwd = process.cwd();

// Bash
echo "Plugin root: $CLAUDE_PLUGIN_ROOT" >&2
echo "Working dir: $(pwd)" >&2
```

### 安全注意事项

#### 1. 验证输入

```javascript
// ✗ 危险：直接执行用户输入
const command = hookData.tool_input.command;
exec(command); // 命令注入风险

// ✓ 安全：验证和转义
if (!/^[a-zA-Z0-9\s\-_]+$/.test(command)) {
  console.error("无效命令");
  process.exit(1);
}
```

#### 2. 限制权限

```json
{
  "hooks": [
    {
      "type": "command",
      // ✗ 不要使用 sudo
      "command": "sudo dangerous-operation"
    }
  ]
}
```

#### 3. 保护敏感数据

```javascript
// ✗ 不要在 Hook 中记录敏感信息
console.error(`Password: ${password}`);

// ✓ 使用安全的日志方式
console.error("Authentication attempted");
```

### 限制与注意事项

1. **执行顺序**：同一事件的多个 Hook 并行执行，无法保证顺序
2. **超时限制**：Hook 执行时间受 `timeout` 限制（默认 30 秒）
3. **退出码**：只有 PreToolUse 和 Stop 的非零退出码能阻止操作
4. **数据流**：PreToolUse/PostToolUse 必须输出原始输入数据
5. **性能影响**：过多 Hook 会影响 Claude Code 响应速度
6. **插件冲突**：多个插件的 Hook 可能互相影响

### 相关资源

- [Claude Code 官方文档](https://docs.anthropic.com/claude-code)
- [Hookify 插件仓库](https://github.com/anthropics/claude-code-plugins)
- [Everything Claude Code](https://github.com/affaan-m/everything-claude-code)
- [Hook SDK](https://github.com/mizunashi-mana/claude-code-hook-sdk)

---

**提示**：开始时使用 Hookify 快速创建规则，熟悉后可以手动配置更复杂的 Hook 来实现高级自动化。
