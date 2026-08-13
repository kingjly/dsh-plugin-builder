# 请求

写一个 dsh 插件，模型能调用 greet 跟指定名字打招呼。

# 期望

- 形态：树外工具插件
- `defineTool({ name: 'greet' })`
- `dsh.bundle` + `cordis.patch.yml`
- 开发命令：`pnpm dsh web --patch ./cordis.dev.yml`
