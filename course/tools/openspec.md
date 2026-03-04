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

# 2. 初始化项目（会在 .claude/skills/ 目录生成技能文件）
openspec init --tools claude,cursor

# 3.（可选）启用扩展工作流 - 如需更细粒度控制
openspec config profile  # 选择 expanded 或其他 profile
openspec update          # 应用配置更新
```

### 核心工作流（默认 core profile）

| 步骤 | 命令 | 说明 |
|------|------|------|
| 1️⃣ | `/opsx:explore` | 自由探索、头脑风暴（无需提交） |
| 2️⃣ | `/opsx:propose` | 创建 change + 生成所有规划产物（一步到位） |
| 3️⃣ | `/opsx:apply` | 开始实现（执行生成的任务） |
| 4️⃣ | `/opsx:archive` | 归档完成的 change |

### 扩展工作流（需配置启用）

| 步骤 | 命令 | 说明 |
|------|------|------|
| 1️⃣ | `/opsx:new <name>` | 仅创建 change 脚手架 |
| 2️⃣ | `/opsx:continue` | 逐个生成下一个产物 |
| 3️⃣ | `/opsx:ff` | 快进：一次生成所有剩余规划产物 |
| 4️⃣ | `/opsx:apply` | 开始实现 |
| 5️⃣ | `/opsx:verify` | 验证实现是否符合规格 |
| 6️⃣ | `/opsx:sync` | 预览或合并规格（不归档） |
| 7️⃣ | `/opsx:archive` | 归档 change |
| 8️⃣ | `/opsx:bulk-archive` | 批量归档多个 changes |

### 最小化示例（默认工作流）

```
# 快速开始（推荐）
/opsx:explore                    # 头脑风暴，不提交
/opsx:propose dark-mode          # 一步创建：proposal + specs + design + tasks

/opsx:apply                      # 开始执行任务
/opsx:archive                    # 归档变更

完成！
```

### 最小化示例（扩展工作流）

```
第一次（规划阶段）：
  /opsx:explore                  # 头脑风暴，不提交
  /opsx:new dark-mode            # 仅创建脚手架

  /opsx:continue                 # 生成第一个产物（proposal.md）
  /opsx:continue                 # 生成下一个产物（specs/）
  /opsx:ff                       # 快进：一次生成剩余所有产物（design + tasks）

第二次（实现与验证）：
  /opsx:apply                    # 开始执行任务
  /opsx:verify                   # 验证实现结果
  /opsx:archive                  # 归档变更

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

**核心命令（默认可用）：**
- **`/opsx:propose`**：一步到位创建 change + 所有规划产物（推荐快速开始）
- **`/opsx:apply`**：执行生成的任务列表
- **`/opsx:archive`**：归档完成的 change

**扩展命令（需配置启用）：**
- **快速推进**：`/opsx:ff` 一次生成所有剩余产物（无需逐个 `/opsx:continue`）
- **多并行**：支持多个 `change` 同时进行，最后 `/opsx:bulk-archive` 批量归档
- **长期维护**：`/opsx:sync` 将规格合并回 `openspec/specs/` 作为项目文档
- **验证实现**：`/opsx:verify` 检查实现是否符合规格要求

**核心特性：**
- **迭代修改**：随时修改任意产物，OpenSpec 会检测过期并提示重新生成
- **流式工作流**：非阶段式，可随时回头修改任意产物
- **完整历史**：所有变更记录持久化存储

---

## 扩展工作流（Expanded Workflow）详解

### 什么是扩展工作流？

OpenSpec 提供两种工作模式：

| 模式 | 特点 | 适用场景 |
|------|------|----------|
| **Core Workflow**<br>（核心工作流） | 一步到位<br>`/opsx:propose` 直接生成全部产物 | • 小型功能<br>• 需求明确<br>• 快速迭代 |
| **Expanded Workflow**<br>（扩展工作流） | 逐步精化<br>每个产物单独生成和审查 | • 复杂功能<br>• 需要仔细设计<br>• 团队协作 |

**核心区别**：扩展工作流允许你在**每个产物生成后**进行审查、修改和迭代，然后再进入下一个产物。

### 产物依赖关系

OpenSpec 的产物遵循依赖图（Dependency Graph）：

```
proposal.md (提案：为什么做这个变更？)
    ↓
    ├── specs/ (规格：需要满足哪些需求？)
    │
    └── design.md (设计：如何技术实现？)
            ↓
        tasks.md (任务清单：具体实现步骤)
            ↓
    implementation/ (实现代码)
```

**依赖规则**：
- `proposal` 无依赖，可直接创建
- `specs` 和 `design` 都依赖 `proposal`，可并行生成
- `tasks` 依赖 `specs` 和 `design`，必须等两者完成

### 为什么需要扩展工作流？

**场景 1：复杂功能需要分阶段思考**

```
❌ 核心工作流：一次生成所有产物
   /opsx:propose user-authentication
   → 一次性产出：proposal + specs + design + tasks
   → 问题：AI 可能在没有充分理解需求的情况下就生成了设计和任务

✅ 扩展工作流：逐步深化理解
   /opsx:new user-authentication
   /opsx:continue  → 生成 proposal.md（先明确"为什么"）
   [人工审查 proposal，调整动机和范围]

   /opsx:continue  → 生成 specs/（基于确认的 proposal）
   [人工审查 specs，补充场景和边界条件]

   /opsx:continue  → 生成 design.md（基于完善的 specs）
   [人工审查设计决策，选择技术方案]

   /opsx:continue  → 生成 tasks.md（基于确认的设计）
```

**场景 2：团队协作需要阶段性交接**

```
产品经理：
   /opsx:new add-payment-gateway
   /opsx:continue  → 生成 proposal.md
   [审查并确认业务需求]

架构师：
   /opsx:continue  → 生成 design.md
   [设计技术架构，选择支付 SDK]

开发者：
   /opsx:continue  → 生成 tasks.md
   /opsx:apply     → 执行实现
```

**场景 3：需要精细验证和反馈**

```
/opsx:apply              → 实现任务
/opsx:verify             → 验证实现质量（扩展工作流独有）
   ✓ Completeness：所有任务都完成了吗？
   ✓ Correctness：实现符合规格意图吗？
   ✓ Coherence：代码遵循设计决策吗？
[根据验证结果调整代码]

/opsx:sync              → 预览规格合并（扩展工作流独有）
[确认无误后再归档]

/opsx:archive           → 归档变更
```

### 扩展工作流命令详解

#### 1. `/opsx:new <change-name>` - 创建脚手架

```bash
/opsx:new add-dark-mode
```

**作用**：仅创建 `openspec/changes/add-dark-mode/` 目录，不生成任何产物文件。

**何时使用**：
- 需求还不够清晰，想先创建占位
- 准备逐步生成和审查每个产物

#### 2. `/opsx:continue` - 逐个生成产物

```bash
/opsx:continue
```

**作用**：根据依赖图，生成**下一个可以生成**的产物。

**工作流程**：
```
第 1 次执行 → 生成 proposal.md（无依赖）
第 2 次执行 → 生成 specs/（依赖 proposal，已满足）
第 3 次执行 → 生成 design.md（依赖 proposal，已满足）
第 4 次执行 → 生成 tasks.md（依赖 specs + design，已满足）
```

**关键特性**：
- ✅ 每次只生成**一个产物**
- ✅ 自动检查依赖是否满足
- ✅ 在每次生成后可暂停审查

#### 3. `/opsx:ff [change-name]` - 快进生成

```bash
/opsx:ff add-dark-mode
```

**作用**：一次性生成**所有剩余的规划产物**（proposal → specs → design → tasks）。

**使用场景**：
- 已经通过 `/opsx:continue` 生成并审查了前几个产物
- 对剩余产物有信心，想快速完成规划阶段
- 类似于核心工作流的 `/opsx:propose`，但可以在任意阶段使用

**示例**：
```bash
/opsx:new user-profile
/opsx:continue          # 生成 proposal.md
[仔细审查 proposal，确认业务需求]

/opsx:ff                # 快进生成 specs + design + tasks
[跳过逐个审查，直接完成规划]
```

#### 4. `/opsx:verify` - 验证实现质量

```bash
/opsx:verify
```

**作用**：验证实现代码是否符合规格要求，从 3 个维度评估：

| 维度 | 检查内容 | 示例 |
|------|----------|------|
| **Completeness**<br>（完整性） | • 所有任务都完成了？<br>• 所有需求都实现了？<br>• 所有场景都覆盖了？ | ❌ tasks.md 中的"添加暗色主题切换按钮"未实现 |
| **Correctness**<br>（正确性） | • 实现符合规格意图？<br>• 边界情况处理了？ | ❌ 规格要求支持系统主题，但代码只支持手动切换 |
| **Coherence**<br>（一致性） | • 设计决策反映在代码中？<br>• 遵循既定模式？ | ⚠️ design.md 使用 Context API，但代码用了 Redux |

**输出示例**：
```
CRITICAL: Task 2.1 "Add localStorage persistence" not implemented
WARNING: design.md specifies JWT but code uses session cookies
SUGGESTION: Consider extracting theme logic into a custom hook
```

**何时使用**：
- 实现完成后，归档前
- 想确保代码质量和规格一致性
- **注意**：验证不会阻止归档，只是提供反馈

#### 5. `/opsx:sync` - 预览规格合并

```bash
/opsx:sync
```

**作用**：预览或执行规格合并到 `openspec/specs/`（source of truth），但**不归档** change。

**使用场景**：
- 想提前查看合并后的规格结构
- 需要将规格同步到主文档，但变更还在进行中
- 用于长期维护的项目文档管理

**与 `/opsx:archive` 的区别**：
- `/opsx:sync`：只更新规格，change 保持活跃
- `/opsx:archive`：更新规格 + 移动 change 到 archive 目录

#### 6. `/opsx:bulk-archive` - 批量归档

```bash
/opsx:bulk-archive
```

**作用**：一次性归档多个已完成的 changes。

**使用场景**：
- 同时进行多个小功能开发
- 集中清理已完成的 changes
- 批量操作提高效率

### 典型扩展工作流实例

**完整流程示例：添加用户认证功能**

```bash
# ===== 阶段 1：规划与设计 =====

# 1. 创建 change 脚手架
/opsx:new user-authentication

# 2. 生成提案（说明为什么需要用户认证）
/opsx:continue
# AI 生成：openspec/changes/user-authentication/proposal.md
# [人工审查]：确认业务动机、范围、用户故事

# 3. 生成规格（详细需求和场景）
/opsx:continue
# AI 生成：openspec/changes/user-authentication/specs/auth/spec.md
# [人工审查]：补充边界条件、错误场景、安全要求

# 4. 生成设计文档（技术方案）
/opsx:continue
# AI 生成：openspec/changes/user-authentication/design.md
# [人工审查]：确认使用 JWT、选择加密算法、设计 token 刷新机制

# 5. 生成任务清单
/opsx:continue
# AI 生成：openspec/changes/user-authentication/tasks.md
# [人工审查]：调整任务顺序、补充测试任务

# ===== 阶段 2：实现 =====

# 6. 执行实现
/opsx:apply
# AI 按照 tasks.md 逐个实现任务

# ===== 阶段 3：验证与归档 =====

# 7. 验证实现质量
/opsx:verify
# 输出：
# ✓ Completeness: All tasks completed
# ⚠️ Correctness: Password strength validation missing
# ✓ Coherence: JWT implementation matches design

# 8. 根据验证结果修复问题
[补充密码强度验证代码]

# 9. 再次验证
/opsx:verify
# 输出：✓ All checks passed

# 10. 预览规格合并（可选）
/opsx:sync
# 查看合并到 openspec/specs/ 的效果

# 11. 归档变更
/opsx:archive
# 移动到：openspec/changes/archive/2025-03-04-user-authentication/
# 更新：openspec/specs/ 的 source of truth
```

### 如何启用扩展工作流？

**默认情况**：OpenSpec 使用 `core` profile，只有 4 个基础命令。

**启用步骤**：

```bash
# 1. 配置 profile（交互式选择）
openspec config profile
# 选择：expanded

# 2. 应用配置，更新技能文件
openspec update
# 更新：.claude/skills/opsx/ 目录下的技能文件

# 3. 确认新命令已可用
# 现在可以使用：/opsx:new, /opsx:continue, /opsx:ff, /opsx:verify, /opsx:sync, /opsx:bulk-archive
```

### 何时使用扩展工作流？

**✅ 推荐使用扩展工作流：**
- 功能复杂度高（超过 5 个任务）
- 需要多方审查（产品、架构、开发）
- 技术决策有争议（需要逐步讨论）
- 长期维护项目（需要完整文档）
- 安全敏感功能（需要严格验证）

**❌ 不必使用扩展工作流：**
- 简单 bug 修复
- 文档更新
- 配置调整
- 实验性原型（快速试错）

**💡 灵活混合：**
```bash
# 快速开始（核心工作流）
/opsx:propose simple-feature
/opsx:apply
/opsx:archive

# 遇到复杂功能时切换（扩展工作流）
/opsx:new complex-feature
/opsx:continue  # 逐步审查
/opsx:verify    # 严格验证
/opsx:archive
```

---

## 拓展阅读

### Profile（工作流配置文件）

OpenSpec 支持不同的工作流 profile，决定了哪些命令可用：

- **`core` profile（默认）**：提供最精简的命令集
  - `/opsx:explore` - 探索和头脑风暴
  - `/opsx:propose` - 一步创建 change + 所有规划产物
  - `/opsx:apply` - 实现任务
  - `/opsx:archive` - 归档变更

- **`expanded` profile（扩展）**：提供更细粒度的控制
  - 包含 core 的所有命令
  - `/opsx:new` - 仅创建 change 脚手架
  - `/opsx:continue` - 逐个生成产物
  - `/opsx:ff` - 快进生成所有剩余产物
  - `/opsx:verify` - 验证实现
  - `/opsx:sync` - 同步规格到项目文档
  - `/opsx:bulk-archive` - 批量归档
  - `/opsx:onboard` - 引导式端到端工作流

**切换 profile：**
```bash
openspec config profile  # 交互式选择 profile
openspec update          # 应用配置并更新技能文件
```

### 自定义 Schema

如果内置的 workflow 不满足需求，可以创建自定义 schema：

```bash
# 创建自定义 schema（交互式）
openspec schema init research-first

# 创建自定义 schema（非交互式）
openspec schema init rapid \
  --description "Rapid iteration workflow" \
  --artifacts "proposal,tasks" \
  --default
```

创建的结构：
```
openspec/schemas/rapid/
├── schema.yaml           # Schema 定义
└── templates/
    ├── proposal.md       # proposal 模板
    └── tasks.md          # tasks 模板
```

### CLI 命令

除了 AI 斜杠命令（`/opsx:*`），OpenSpec 还提供直接的 CLI 命令：

**工作流状态查询：**
```bash
openspec status                    # 查看当前工作流进度
openspec status --json             # JSON 格式输出
openspec instructions              # 获取当前阶段的下一步指示
openspec templates                 # 列出可用的模板路径
```

**归档命令：**
```bash
openspec archive add-dark-mode                # 归档指定 change
openspec archive add-dark-mode --yes          # 跳过确认提示（适合 CI）
openspec archive update-ci-config --skip-specs # 跳过 spec 更新
openspec archive add-dark-mode --no-validate  # 跳过验证（不推荐）
```

归档后的目录结构：
```
openspec/changes/archive/2025-01-24-add-dark-mode/
```

**更新配置：**
```bash
openspec update                    # 更新 AI 工具配置文件
openspec update --force            # 强制更新
openspec update ./my-project       # 更新指定项目
```

### 限制与注意事项

1. **Profile 依赖**：
   - 默认只有 `core` profile 的命令可用
   - 使用扩展命令前需要先配置并启用对应的 profile

2. **AI 工具集成**：
   - `openspec init --tools` 会在对应目录生成技能文件
   - Claude: `.claude/skills/opsx/`
   - Cursor: 参考工具特定路径

3. **产物生成顺序**：
   - `/opsx:propose` 一次生成所有产物（proposal → specs → design → tasks）
   - 扩展工作流中 `/opsx:continue` 按顺序逐个生成
   - `/opsx:ff` 跳过逐个生成，直接完成所有剩余产物

4. **归档行为**：
   - 归档会将 change 移动到 `openspec/changes/archive/` 目录
   - 使用时间戳命名避免冲突
   - 可选择是否更新 specs（`--skip-specs`）

5. **配置文件**：
   - 初始化时会提示创建 `openspec/config.yaml`（可选但推荐）
   - 用于项目级别的配置管理

### 相关资源

- 官方文档：https://github.com/fission-ai/openspec
- Context7 文档：https://context7.com/fission-ai/openspec
- npm 包：https://www.npmjs.com/package/@fission-ai/openspec
