# 打包、Profile 与加载顺序

官方真源：`docs/user/develop/basic/publish.md`。

## 两个 manifest

- **组合包 bundle**：你分发的 npm 包。`package.json` 里 `dsh.bundle.patch` 指向 `cordis.patch.yml`。
- **profile**：用户机器上 `$DSH_HOME/profiles/<name>`。`dsh.profile.bundles` 是有序列表。不要手写 profile，用 `dsh plugin`。

没有 `dsh.bundle` 的包可以当依赖装，但不会激活一层，CLI 会警告。

## 开发 vs 安装

开发（源码树，POSIX 绝对路径）：

```yaml
- insert:
    - id: hello
      name: '/absolute/path/to/plugin/src/index.ts'
      config:
        greeting: Hi
```

```sh
pnpm dsh web --patch ./cordis.dev.yml
```

Windows 上的 Node ESM import specifier 必须写成文件 URL：

```yaml
- insert:
    - id: hello
      name: 'file:///D:/path/to/plugin/src/index.ts'
```

不要写 `D:/...`；Node 会把 `d:` 解释为不支持的 URL 协议。

安装后的 patch 用包名：

```yaml
- insert:
    - id: hello
      name: dsh-hello-plugin
```

```sh
dsh plugin --profile web add ./hello-plugin
dsh --profile web --dump-config
dsh --profile web
```

`dsh plugin --profile web remove dsh-hello-plugin` 同时去掉依赖和层。

## 层顺序（后写的整行胜出）

1. profile 列出的各 bundle patch（先 `@deepseek-ai/dsh-base`）
2. profile 自己的 `cordis.patch.yml`
3. `$DSH_HOME/cordis.patch.yml`
4. 每个 `--patch`，按 argv

Patch **按 id 整行替换 config**，不深度合并。覆盖官方行时必须重述该行需要的全部键。给用户留可改的默认值，细节放 schema。

## Git / npm / tarball

```sh
dsh plugin --profile web add github:you/hello-plugin#<sha>
```

Git 装的是源码，**不会**替你跑普通 `build`。作者必须提供自包含 `prepare`（不要假设旁边有 monorepo）。用户还要在该 profile 的 `pnpm-workspace.yaml` 授权：

```yaml
allowBuilds:
  dsh-hello-plugin: true
```

`allowBuilds` 等于允许安装时在本机执行该包代码。只给信任源授权，并钉 commit。

不想要这道授权：

- `pnpm publish` 发布已构建的 `lib/` / `dist/`
- `pnpm pack`，用户 `dsh plugin add ./pkg-0.1.0.tgz`

## 发现

仓库加 GitHub topic `dsh-plugin`。
