# mgrep 使用指南

## 快速开始

### 安装

使用 pnpm 全局安装：

```bash
pnpm add -g @mixedbread/mgrep
```

### 登录

首次使用需要登录：

```bash
mgrep login
```

如需在 CI/CD 或自动化环境使用，可设置 API Key：

```bash
export MXBAI_API_KEY="your-api-key"
```

### 初始化索引

在项目目录中启动同步：

```bash
mgrep watch
```

该命令会遵循 `.gitignore` 规则，并在文件变化时持续更新索引。

### Claude Code 集成

安装 Claude Code 集成（需要先登录）：

```bash
mgrep install-claude-code
```

安装完成后，在项目目录中启动 Claude Code：

```bash
cd /path/to/project
claude
```

---

## 拓展阅读

### mgrep 简介

mgrep 是一个语义搜索 CLI 工具，用自然语言理解替代传统的字符串匹配搜索。适用于在代码、文档等多种文件类型中进行“语义级”检索。

核心特点：

- **自然语言搜索** - 用描述而不是正则表达式查找内容
- **持续索引** - `watch` 模式自动同步文件变化
- **开发者集成** - 提供 Claude Code、OpenCode、Codex 等集成

### 常用命令

- `mgrep login` - 浏览器登录授权
- `mgrep watch` - 初始化并持续同步索引
- `mgrep install-claude-code` - 安装 Claude Code 集成
- `mgrep install-opencode` - 安装 OpenCode 集成
- `mgrep install-codex` - 安装 Codex 集成
- `mgrep install-droid` - 安装 Factory Droid 集成

### 认证与安全

- 推荐使用 `mgrep login` 完成授权
- 在 CI/CD 中使用 `MXBAI_API_KEY` 环境变量
- 不要将密钥提交到版本控制

### 使用建议

- 在项目根目录运行 `mgrep watch` 确保索引覆盖正确范围
- 如果忽略了文件，检查 `.gitignore` 配置
- 与 Claude Code 配合时，先执行 `mgrep install-claude-code`

---

**参考资源**：mgrep 官方文档  
**最后更新**：2026年2月25日
