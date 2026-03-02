# Claude Code MCP 操作指南

## 快速开始

### 安装

> 以 context7 为例

添加 mcp，去除 `--scope user` 则仅为当前项目添加：

```bash
# 本地项目级别（默认）
claude mcp add --header "CONTEXT7_API_KEY: xxx-xx-xxx" --transport http context7 https://mcp.context7.com/mcp

# 用户全局级别
claude mcp add --scope user --header "CONTEXT7_API_KEY: xxx-xx-xxx" --transport http context7 https://mcp.context7.com/mcp
```

本地项目配置会保存到 `.mcp.json`，用户级别配置保存到 `~/.claude.json`。

**通过 JSON 配置安装本地工具：**

```bash
claude mcp add-json --scope project ocr '{
  "type": "stdio",
  "command": "node",
  "args": ["./dev/ocr/dist/mcp-server.js"]
}'
```

### 卸载

同样区分作用范围：

```bash
claude mcp remove "context7" -s local
claude mcp remove "context7" -s user
claude mcp remove "ocr" -s project
```

### 状态查看

检查 MCP 服务器是否连接成功：

```bash
claude mcp get ocr
```

输出示例：

```log
ocr:
  Scope: Project config (shared via .mcp.json)
  Status: ✓ Connected
  Type: stdio
  Command: node
  Args: ./dev/ocr/dist/mcp-server.js

To remove this server, run: claude mcp remove "ocr" -s project
```

列出所有 MCP 服务器：

```bash
claude mcp list
```

---

## 拓展阅读

### MCP 简介

Model Context Protocol (MCP) 是一个开放协议，用于将大型语言模型应用程序与外部数据源和工具无缝集成。MCP 为 Claude Code 提供了标准化的方式来：

- **访问外部资源** - 数据库、文件系统、API 等
- **调用工具和命令** - 执行特定的操作和任务
- **使用动态提示模板** - 获取上下文相关的指导

通过 MCP，Claude Code 可以在编码任务中获得更多的上下文信息和操作能力。

### 配置文件详解

#### 层级范围

MCP 配置支持三个层级的作用域：

| 级别              | 配置文件         | 作用范围           | 优先级 | 用途             |
| ----------------- | ---------------- | ------------------ | ------ | ---------------- |
| **Local/Project** | `.mcp.json`      | 仅当前项目         | 最高   | 项目特定工具配置 |
| **User**          | `~/.claude.json` | 当前用户的所有项目 | 中     | 个人常用工具     |

**安全建议：**

⚠️ 在 `.mcp.json` 中不要存储 API 密钥等敏感信息，应该通过 `--header` 参数或环境变量传递。

#### 配置文件示例

项目级别 `.mcp.json`：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["/path/to/filesystem-server/build/index.js"],
      "env": {
        "ALLOWED_DIRECTORIES": "/Users/username/Documents,/Users/username/Projects"
      }
    },
    "database": {
      "command": "node",
      "args": ["/path/to/database-server/build/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://localhost/mydb"
      }
    }
  }
}
```

### MCP 服务器功能

一个 MCP 服务器可以提供以下功能：

#### 1. Tools（工具）

提供 Claude Code 可以调用的工具函数，支持：

- 输入验证和类型检查
- 列表变更通知（`listChanged`）
- 详细的输入/输出 Schema

```json
{
  "tools": {
    "listChanged": true
  }
}
```

#### 2. Resources（资源）

暴露外部数据源或文件，支持：

- 订阅资源更新（`subscribe`）
- 列表变更通知（`listChanged`）

```json
{
  "resources": {
    "subscribe": true,
    "listChanged": true
  }
}
```

#### 3. Prompts（提示模板）

提供动态的提示模板，支持：

- 参数化提示
- 列表变更通知（`listChanged`）

```json
{
  "prompts": {
    "listChanged": true
  }
}
```

#### 4. 其他功能

- **Logging** - 服务器可以向客户端发送日志消息
- **Completions** - 提供参数自动完成建议

### 最佳实践

#### 1. 安全性考虑

- 对于包含 API 密钥的配置，使用 `--header` 参数或环境变量，不要硬写到配置文件
- 在项目的 `.mcp.json` 中存储通用配置，敏感信息在本地 `~/.claude.json` 中配置
- 确保 `.mcp.json` 中不包含敏感凭证再提交到版本控制

#### 2. 作用域管理

- 个人工具/服务器 → `user` 级别（全局可用）
- 项目特定工具 → `project` 级别（团队共享）
- 一次性测试/实验 → `local` 级别（仅当前会话）

#### 3. MCP 服务器配置

- 为 MCP 服务器提供清晰的别名（易于识别和管理）
- 文档化每个服务器支持的功能（Tools、Resources、Prompts 等）
- 定期验证服务器连接状态

#### 4. 性能优化

- 为 long-running 操作的工具设置合理的超时时间（推荐 30 秒）
- 实现 MCP 工具的输入验证
- 添加错误处理和异常捕获

### 故障排查

#### 常见问题

**1. 服务器连接失败（Status: ✗ Disconnected）**

检查清单：

- 验证服务器地址/命令是否正确
- 确认依赖项/服务已安装和运行
- 检查网络连接（对于 HTTP 传输）
- 查看日志输出获取详细错误信息

**2. API 认证失败**

排查步骤：

- 验证 API Key 是否正确
- 确认没有在版本控制中暴露敏感信息
- 检查 API 密钥是否已过期

**3. 工具调用超时**

可能原因：

- MCP 服务器响应缓慢
- 网络延迟（HTTP 传输）
- 工具执行超过预设超时时间

解决方案：

- 增加超时时间设置
- 优化工具执行逻辑
- 检查 MCP 服务器日志

#### 查看调试日志

Claude Code 输出日志位置：

```bash
# macOS
~/Library/Logs/Claude/

# Linux
~/.local/share/claude/logs/
```

### 状态说明速查

#### Scope（配置级别）

- `Local config` - 本地项目级别
- `Project config (shared via .mcp.json)` - 项目级别，已共享
- `User config` - 用户全局级别

#### Status（连接状态）

- `✓ Connected` - 连接正常
- `✗ Disconnected` - 连接失败
- `⚠ Warning` - 警告

#### 传输类型

- `stdio` - 标准 I/O（本地）
- `http` - HTTP 协议（远程）

### 常用命令速查

```bash
# 添加 HTTP MCP 服务器
claude mcp add --header "API_KEY: xxx" --transport http <name> <url>

# 添加本地 MCP 服务器（stdio）
claude mcp add-json --scope project <name> '{"type": "stdio", "command": "node", "args": ["./server.js"]}'

# 查看单个服务器状态
claude mcp get <name>

# 列出所有服务器
claude mcp list

# 移除服务器
claude mcp remove <name> -s <scope>
```

---

**参考资源**：Model Context Protocol 官方文档  
**最后更新**：2026年2月25日
