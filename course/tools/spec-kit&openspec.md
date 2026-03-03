## SpecKit vs OpenSpec 工具对比

### 1. 基本信息

| 维度     | SpecKit                       | OpenSpec                                     |
| -------- | ----------------------------- | -------------------------------------------- |
| 来源     | GitHub 官方                   | fission-ai（社区）                           |
| 技术栈   | Python（依赖 `uv`）           | Node.js（依赖 `npm`）                        |
| 安装方式 | `uv tool install specify-cli` | `npm install -g @fission-ai/openspec@latest` |
| 初始化   | `specify init --ai claude`    | `openspec init --tools claude,cursor`        |
| 命令前缀 | `/speckit.*`                  | `/opsx:*`                                    |
| 官方仓库 | github.com/github/spec-kit    | github.com/fission-ai/openspec               |

---

### 2. 核心理念

| 维度         | SpecKit                                                                     | OpenSpec                                                         |
| ------------ | --------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **哲学**     | 「先写规格，再写代码」—— 经过多步精化，而非一次性生成                       | 「动作，而非阶段」—— 流式迭代，随时可以对任意产物进行修改        |
| **流程模型** | **阶段锁定式**：constitution → specify → plan → tasks → implement，线性推进 | **流式 DAG**：依赖关系驱动产物生成，任意时刻可以跳回修改任何阶段 |
| **约束风格** | 强制顺序，阶段门控                                                          | 依赖图作为「可能性提示」，而非强制顺序                           |
| **可定制性** | 固定产物结构，通过扩展系统（`specify extension`）增加命令                   | 完全自定义 YAML Schema，可自定义任意产物、依赖关系和 AI 指令     |

---

### 3. 工作流对比

#### SpecKit 工作流

```
constitution → specify → [clarify] → plan → tasks → [analyze] → implement
```

| 命令                    | 作用                               | 产物                                                    |
| ----------------------- | ---------------------------------- | ------------------------------------------------------- |
| `/speckit.constitution` | 建立项目宪法（编码规范、架构原则） | `.specify/memory/constitution.md`                       |
| `/speckit.specify`      | 描述要构建的功能（What/Why）       | `specs/{branch}/spec.md`                                |
| `/speckit.clarify`      | 澄清规格歧义（可选）               | —                                                       |
| `/speckit.plan`         | 指定技术栈，生成技术方案           | `plan.md`, `data-model.md`, `contracts/`, `research.md` |
| `/speckit.tasks`        | 生成可执行任务清单                 | `specs/{branch}/tasks.md`                               |
| `/speckit.analyze`      | 校验三者一致性（可选）             | —                                                       |
| `/speckit.implement`    | 按任务列表逐步实现                 | —                                                       |
| `/speckit.checklist`    | 生成自定义质量检查清单（可选）     | —                                                       |

#### OpenSpec (OPSX) 工作流

```
explore → new → [continue] → [ff] → apply → [verify] → [sync] → archive
```

| 命令                 | 作用                                             |
| -------------------- | ------------------------------------------------ |
| `/opsx:explore`      | 自由探索模式，头脑风暴，无需立即提交             |
| `/opsx:new`          | 创建新 change，生成首个可用产物                  |
| `/opsx:continue`     | 继续当前 change，生成下一个可用产物              |
| `/opsx:ff <name>`    | 快进（Fast-Forward）：一次生成所有剩余产物       |
| `/opsx:apply [name]` | 开始执行（类似 implement），带过期检测           |
| `/opsx:verify`       | 验证实现结果                                     |
| `/opsx:sync`         | 将 change 中的 delta spec 同步回主规格目录       |
| `/opsx:archive`      | 归档完成的 change（可批量 `/opsx:bulk-archive`） |

---

### 4. 产物结构对比

#### SpecKit 固定产物

```
specs/
  {branch}/             # 自动编号分支，如 001-photo-albums
    spec.md             # 需求规格
    plan.md             # 技术方案
    data-model.md       # 数据模型
    contracts/          # API 契约
    research.md         # 技术调研
    tasks.md            # 可执行任务清单
    checklists/
      requirements.md
.specify/
  memory/
    constitution.md
```

#### OpenSpec 可自定义产物（YAML Schema）

```
openspec/
  schemas/
    my-workflow/
      schema.yaml       # 完全自定义工作流
  changes/
    add-dark-mode/
      proposal.md       # 按 schema 生成
      design.md
      tasks.md
    archive/            # 归档目录
openspec/
  specs/                # 同步后的长期规格
```

**自定义 Schema 示例：**

```yaml
# openspec/schemas/rapid/schema.yaml
name: rapid
artifacts:
  - id: proposal
    generates: proposal.md
    requires: []
  - id: tasks
    generates: tasks.md
    requires: [proposal] # 跳过 design，快速迭代
apply:
  requires: [tasks]
  tracks: tasks.md
```

---

### 5. 关键功能差异

| 功能               | SpecKit                            | OpenSpec                                             |
| ------------------ | ---------------------------------- | ---------------------------------------------------- |
| **Schema 自定义**  | ❌ 固定流程，仅通过扩展扩充命令    | ✅ YAML 定义任意产物和 DAG 依赖                      |
| **迭代修改规格**   | ⚠️ 阶段锁定，不推荐回头修改        | ✅ 随时修改任意产物，支持过期检测与重新生成          |
| **变更归档**       | ❌ 无归档/历史管理概念             | ✅ 完整的 change 生命周期管理（active → archive）    |
| **多 change 并行** | ❌ 基于 git branch 管理            | ✅ 每个 change 为独立目录，支持并行 + bulk-archive   |
| **过期检测**       | ❌                                 | ✅ apply 时主动检测上游产物是否已更新，提示重新生成  |
| **扩展系统**       | ✅ 完整扩展市场（Jira、Linear 等） | ❌ 无官方扩展系统                                    |
| **长期规格同步**   | ❌ 无                              | ✅ `sync` 命令将 delta spec 合并回 `openspec/specs/` |
| **项目宪法**       | ✅ `/speckit.constitution`         | ❌ 通过 `config.yaml` 的 `rules` 字段替代            |
| **技术调研产物**   | ✅ 内置 `research.md`              | 需在自定义 schema 中手动添加                         |

---

### 6. 支持的 AI 代理

| SpecKit                                                                                                | OpenSpec                                                 |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| claude, gemini, copilot, cursor-agent, codex, windsuff, qwen, opencode, codebuddy, auggie, kilocode, q | claude, cursor, copilot, windsurf（通过 `--tools` 指定） |

---

### 7. 适用场景建议

| 场景                                       | 推荐工具     | 原因                                                |
| ------------------------------------------ | ------------ | --------------------------------------------------- |
| 团队有统一规范，希望强制 SDD 流程          | **SpecKit**  | 阶段锁定保证规范性，扩展系统可接入 Jira/Linear      |
| 需要高度自定义工作流（如先做调研再写需求） | **OpenSpec** | YAML Schema 可随意定义产物顺序和依赖                |
| 需要频繁迭代规格、中途改设计               | **OpenSpec** | 流式工作流 + 过期检测 + 随时重新生成产物            |
| 管理多个并行开发中的功能特性               | **OpenSpec** | Change 目录隔离 + bulk-archive                      |
| 想要开箱即用的完整 SDD 规范                | **SpecKit**  | GitHub 出品，内置 constitution/spec/plan/tasks 全套 |
| Node.js 项目，避免引入 Python 依赖         | **OpenSpec** | npm 安装，零额外生态依赖                            |

---

**简要总结：** SpecKit 是「有主见的 SDD 框架」，流程结构清晰、扩展生态更完整，适合团队推行规范化开发；OpenSpec 是「灵活的规格管理工具」，以自定义 YAML Schema 和 change 生命周期管理见长，适合需要迭代灵活性的项目。
