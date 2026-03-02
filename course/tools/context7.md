# Context7 MCP 工具使用指南

## 快速开始

### 安装

#### 方法 1：全局安装（推荐）

为当前用户的所有项目安装 Context7：

```bash
claude mcp add --scope user context7 --transport http https://mcp.context7.com/mcp
```

或使用 npx 本地运行：

```bash
claude mcp add --scope user context7 -- npx -y @upstash/context7-mcp
```

#### 方法 2：仅为当前项目安装

```bash
claude mcp add context7 --transport http https://mcp.context7.com/mcp
```

#### 方法 3：使用 API 密钥（获得更高速率限制）

从 [context7.com/dashboard](https://context7.com/dashboard) 获取免费 API 密钥：

```bash
claude mcp add --scope user --header "CONTEXT7_API_KEY: your-api-key" --transport http context7 https://mcp.context7.com/mcp
```

### 基本使用

安装后，在任何提示中添加 `use context7` 来启用文档查询：

```bash
# 查询 React 文档
请展示如何使用 React hooks use context7

# 查询 Next.js 文档
Next.js 路由的最佳实践是什么？use context7

# 查询 Supabase 文档
如何使用 Supabase 实现身份验证？use context7

# 查询特定版本
如何设置 Next.js 14 中间件？use context7
```

### 直接指定库

使用库 ID 语法跳过库匹配步骤：

```bash
# 语法：/organization/project 或 /organization/project/version
基于 /supabase/supabase 实现一个身份验证系统 use context7

使用 /next.js/next.js/v14 创建一个 API 路由 use context7
```

### 验证安装

```bash
claude mcp get context7
```

---

## 拓展阅读

### Context7 简介

**Context7** 是一个实时文档检索的 MCP 服务器，为 AI 助手提供：

- **实时文档访问** - 数千个库和框架的最新文档
- **自动库识别** - 根据查询自动查找和检索相关文档
- **版本特定文档** - 可以获取特定版本的文档和示例
- **代码示例** - 提供官方来源的代码示例和最佳实践

核心优势：获取 **最新的、版本准确的** 文档，而不是依赖过时的训练数据。

### 核心功能

Context7 提供两个主要工具：

#### 1. resolve-library-id

将通用的库名称解析为 Context7 兼容的库 ID：

- 自动识别库名称
- 匹配最相关的官方版本
- 返回 `/organization/project` 格式的 ID

示例：

```
输入：React
输出：/facebook/react

输入：Next.js 14
输出：/vercel/next.js/v14
```

#### 2. query-docs（get-library-docs）

使用库 ID 检索版本特定的文档：

- 获取完整的 API 参考
- 提供代码示例和用法指南
- 支持不同的文档模式（code/info）

### 支持的库

Context7 支持数千个库和框架，包括：

**前端框架：**

- React, Vue, Angular, Svelte
- Next.js, Nuxt, SvelteKit
- Tailwind CSS, Material UI

**后端/全栈：**

- Node.js, Express, Fastify
- Django, FastAPI, Flask
- .NET, Go, Rust

**数据库/ORM：**

- Supabase, Firebase, MongoDB
- Prisma, SQLAlchemy, TypeORM
- PostgreSQL, MySQL

**其他热门库：**

- TypeScript, GraphQL, Apollo
- Docker, Kubernetes
- AWS SDK, Google Cloud SDK
- 和更多 3000+ 库...

### 最佳实践

#### 1. 设置自动激活规则

避免每次都输入 `use context7`，在 CLAUDE.md 中设置规则：

```markdown
# Claude Code Rules

Always use context7 MCP when I need:

- Library/API documentation
- Code generation with specific frameworks
- Setup or configuration steps
- Version-specific guidance

This way you'll automatically use Context7 for relevant queries without me explicitly asking.
```

#### 2. 明确指定版本

当版本很重要时，在提示中明确说明：

```bash
# 好
如何在 Next.js 14 中使用 App Router？use context7

# 或者
基于 /vercel/next.js/v14 实现一个 API 路由
```

#### 3. 使用库 ID 加速查询

如果已知库 ID，直接使用可以跳过库匹配步骤：

```bash
# 直接指定库 ID，加快查询
使用 /supabase/supabase 的 Auth 服务实现用户认证

使用 /prisma/prisma/v5 创建数据库模型
```

#### 4. 结合特定任务

Context7 在以下场景最有用：

- **新框架学习** - 获取最新的官方教程和示例
- **版本升级** - 了解新版本的API变化
- **最佳实践** - 参考官方推荐的设计模式
- **故障排查** - 查阅官方文档中的常见问题

### 支持的客户端

Context7 可在以下 MCP 客户端中使用：

- **Claude Desktop** - 官方 Anthropic 工具
- **Claude Code** - 终端集成工具
- **Cursor** - VS Code 代码编辑器
- **Windsurf** - 另一个 AI 代码编辑器
- **VS Code 扩展** - Cline、RooCode 等
- **30+ 其他 MCP 兼容客户端**

### 速率限制和配额

#### 无 API 密钥使用

- 免费的基础速率限制
- 适合个人开发和测试

#### 有 API 密钥使用（推荐）

- 免费获取，无需付费
- 更高的速率限制
- 更快的响应时间
- 从 [context7.com/dashboard](https://context7.com/dashboard) 申请

### 常见用法示例

#### 学习新框架

```bash
# 查询 Svelte 基础
请讲解 Svelte 的响应式编程 use context7

# 查询 GraphQL
如何使用 Apollo Server 构建 GraphQL API？use context7
```

#### 解决集成问题

```bash
# 集成认证
如何在 Next.js 中集成 Clerk 认证？use context7

# 数据库集成
使用 Supabase 实现实时数据同步的最佳方式是什么？use context7
```

#### 高效查询特定工具

```bash
# 从特定来源获取文档
请基于 /prisma/prisma 的官方文档，为我讲解关系查询

给我 /supabase/supabase 官方的向量搜索示例 use context7
```

### 常见问题

**Q: Context7 是免费的吗？**  
A: 是的，Context7 完全免费使用，在 MIT 协议下开源。无 API 密钥可使用基础功能，申请免费 API 密钥可获得更高速率限制。

**Q: 能否获得特定版本的文档？**  
A: 可以。通过在提示中提及版本（如"Next.js 14"）或直接使用带版本的库 ID（如 `/vercel/next.js/v14`），Context7 会自动匹配并检索对应版本的文档。

**Q: Context7 文档的更新频率？**  
A: Context7 直接从官方源获取文档，确保始终提供最新内容。通常官方库更新后，Context7 会在几小时内同步。

**Q: 如何避免每次都输入 'use context7'？**  
A: 在你的 MCP 客户端配置中添加规则即可自动激活。在 Claude Code 中即为 CLAUDE.md。

### 命令速查

```bash
# 安装（全局）
claude mcp add --scope user context7 --transport http https://mcp.context7.com/mcp

# 安装（项目级别）
claude mcp add context7 --transport http https://mcp.context7.com/mcp

# 使用 API 密钥安装
claude mcp add --scope user --header "CONTEXT7_API_KEY: your-key" --transport http context7 https://mcp.context7.com/mcp

# 查看状态
claude mcp get context7

# 移除
claude mcp remove context7 -s user
```

---

**关键特点**：

- ✅ 实时更新的官方文档
- ✅ 版本特定的 API 参考
- ✅ 3000+ 库和框架支持
- ✅ 完全免费使用
- ✅ 与所有主流 AI 编辑器兼容

**参考资源**：Context7.com（https://context7.com）  
**最后更新**：2026年2月25日
