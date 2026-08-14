# 已安装插件的识别与生命周期

适用于 `@deepseek-ai/dsh@0.1.0-rc.6`。版本变化时先复核 `dsh-app-boot`、Cordis Loader/HMR 和 plugin inventory 契约。

## 先区分四种状态

| 状态 | 判断依据 | 操作 |
|---|---|---|
| 已安装 | profile `package.json` 的依赖与 `dsh.profile.bundles` | `dsh plugin --profile <name> add/remove` |
| 已配置 | 组合后的 Loader 树存在该 entry | `dsh --profile <name> --dump-config` |
| 已启用 | inventory 的 `enabled` 为 true | 用户 patch 的 `disabled` 覆盖 |
| 已挂载 | inventory 的 `fiberPhase` 为 `active` | Loader 运行状态 |

Settings 的官方 inventory 是只读投影，只返回 `entryId`、`moduleName`、`enabled` 和 `fiberPhase`；它没有来源字段，也没有启停方法。

## 识别官方、自定义与第三方插件

不要仅凭 inventory 名称判断。把实时 entry 反查到 bundle patch，再检查实际 profile 的 `package.json`、lockfile、`node_modules` 链接目标和包仓库元数据：

- DSH 安装自带、仓库指向 `deepseek-ai/deepseek-harness` 的 bundle：官方。
- `link:`、`file:`、workspace 或指向用户项目目录的 junction：本地自定义。
- Git/GitHub specifier：外部 Git 插件；记录仓库和 commit，不自动称为用户自制。
- registry 中非官方包：第三方 npm 插件。
- 证据不足：标记未知，不根据 `dsh-` 前缀猜测。

来源属于安装层元数据，不能只从 `pluginInventory.list()` 得出。

## 锁定实际运行目录

不要默认使用 `~/.dsh`。项目可能通过环境变量启动在 `.dsh-home`，Windows 进程命令行也不会显示父进程继承的环境变量。

1. 查启动命令、服务管理脚本或当前项目的 `.dsh-home`。
2. 检查 `$DSH_HOME/profiles/<profile>/package.json`、profile 与 home 两级 `cordis.patch.yml`、依赖链接和存储更新时间。home 级 patch 更晚应用；同 id 覆盖会遮住 profile 级结果。
3. 使用同一个 home 执行 dump：

```powershell
$env:DSH_HOME = 'C:\absolute\path\.dsh-home'
dsh --profile web --dump-config
```

```sh
DSH_HOME=/absolute/path/.dsh-home dsh --profile web --dump-config
```

实时 inventory 中的 `entryId` 是 Loader 路径，例如 `include:showcase-aurora-ui`。用户 patch 通常要命中 bundle 中的 raw id `showcase-aurora-ui`。从 bundle patch 或 `--dump-config` 确认 raw id，不要机械删除前缀。

## 热停用与热启用

前提：包仍在 profile 依赖中，bundle 仍在 `dsh.profile.bundles` 中。这样状态才能跨重启保持一致。

在实际 profile 的 `cordis.patch.yml` 中合并一个精确覆盖：

```yaml
- id: showcase-aurora-ui
  disabled: true
```

启用时设为 `false`，或只删除该条中的 `disabled` 覆盖以恢复 bundle 默认值：

```yaml
- id: showcase-aurora-ui
  disabled: false
```

约束：

- 保留文件中的其他 patch、注释与 `!!js`；不要用会破坏自定义 YAML tag 的普通序列化器重写整文件。
- 已有同 id patch 时合并 `disabled`，不要堆叠含义冲突的重复项。
- 默认把单 profile 状态写入 profile patch；若 home 级已有同 id 覆盖，先解析其意图并消除冲突，不要在较早层反复写无效值。
- 不修改插件包自带的 `cordis.patch.yml` 来保存用户状态。
- 不用删除依赖或 bundle 的方式冒充热停用。

DSH 会监听 profile 和 home 级用户 patch。命中后 Loader 可在同一服务进程内 dispose 或 init entry。

## 验证顺序

1. 记录服务 PID/启动时间和目标插件的 inventory 基线。
2. 写入最小 patch，等待 HMR 完成。
3. 重新查询 inventory：停用应为 `enabled: false`；启用应为 `enabled: true`，通常随后进入 `active`。
4. 对 Client 插件刷新一个浏览器页面再检查 UI。当前已打开页面可能不会动态卸载或加载 Client contribution；这不等于 Host 热切换失败。
5. 确认无关插件仍正常，并报告全过程是否重启。

若无效，依次检查：home/profile 错误、较晚的 home patch 覆盖了 profile patch、使用了 effective id 而非 raw id、HMR 未激活或 watcher 失败、只修改了 `package.json`、运行进程早于 manifest 变更导致内存树与磁盘 bundle 清单不一致。

## 安装与卸载

```sh
dsh plugin --profile web add ./dsh-example
dsh plugin --profile web remove dsh-example
```

这类命令修改依赖和 bundle manifest，不是运行时热切换。完成后重启服务，再用相同 `DSH_HOME` 验证。

## 构建可操作的管理 UI

官方 inventory 只读。若用户要 UI 开关，构建一个常驻的 Host + Client 管理插件：Host 端只允许修改已确认 profile 中的白名单 entry id，原子写用户 patch并保留回滚信息；Client 端展示来源和状态并调用该受限接口。不要让管理器自行停用，也不要让浏览器直接写任意文件。
