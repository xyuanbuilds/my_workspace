## 快速开始

目前对比了 spec-kit、openspec 两个 spec driven 的工具，个人体感是 openspec 更适合轻量使用，体感上对已有仓库的倾入性也更少

简单来说 spec driven 的研发模式，遵循以下两个原则：

1. 「先写规格，再写代码」—— 经过多步精化，而非一次性生成
2. 「动作，而非阶段」—— 流式迭代，随时可以对任意产物进行修改

相比单纯 Plan + 实施的优势：

- 持久化记忆
- 架构设计更细致，交互式决策
- 操作简易，使用直观
- 可断点续传，多 agent 接力适配（ClaudeCode、Github Copilot 无缝切换）

使用效果：
![spec driven](../../assets/images/spec.png)

---

## 最简命令行操作流程

### 前置准备

```bash
# 1. 安装 openspec
npm install -g @fission-ai/openspec@latest

# 2. 初始化项目
openspec init --tools claude,cursor
```

### 核心工作流（5个命令）

| 步骤 | 命令 | 说明 |
|------|------|------|
| 1️⃣ | `/opsx:explore` | 自由探索、头脑风暴（无需提交） |
| 2️⃣ | `/opsx:new <name>` | 创建新 change，生成首个规格产物 |
| 3️⃣ | `/opsx:continue` | 继续完善，生成下一个产物 |
| 4️⃣ | `/opsx:apply` | 开始实现（执行生成的任务） |
| 5️⃣ | `/opsx:archive` | 归档完成的 change |

### 最小化示例

```
第一次：
  /opsx:explore                    # 头脑风暴，不提交
  /opsx:new dark-mode              # 创建 change：proposal.md

  /opsx:continue                   # 生成 design.md
  /opsx:ff                          # 快进：一次生成所有剩余产物

第二次：
  /opsx:apply                      # 开始执行任务
  /opsx:verify                     # 验证实现结果
  /opsx:archive                    # 归档变更

完成！
```

### 产物结构（自动生成）

```
openspec/
  changes/
    dark-mode/
      proposal.md     # 动机与变更清单
      design.md       # 技术决策
      tasks.md        # 可执行任务列表
      implementation/ # 实现过程记录
```

### 快速参考

- **迭代修改**：随时修改任意产物，OpenSpec 会检测过期并提示重新生成
- **快速推进**：`/opsx:ff` 一次生成所有剩余产物（无需逐个 `/opsx:continue`）
- **多并行**：支持多个 `change` 同时进行，最后 `/opsx:bulk-archive` 批量归档
- **长期维护**：`/opsx:sync` 将规格合并回 `openspec/specs/` 作为项目文档

**核心优势**：流式工作流 + 随时回头修改 + 完整变更历史
