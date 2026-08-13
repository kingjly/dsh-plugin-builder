# 安全

## 密钥

- 生成文件里只出现环境变量名或 `ctx.credentials` 引用，例如 `apiKeyEnv: OPENWEATHER_API_KEY`。
- 用户聊天里贴出来的 token 不要写入磁盘。
- 不要发明 `~/.my-plugin/secrets.json`。
- 校验失败时不要把密钥打进日志。

## 危险能力

工具若能执行命令、写任意路径、打内网、转支凭据：

- 默认收紧：工作区相对路径、超时、输出上限。
- 破坏性操作走 `tools/pre-execute` 审批，不要静默执行。
- 不要提供「关闭沙箱」的默认配置。
- 描述里写清副作用，让模型知道这不是只读。

## 配置与加载

- 误配在 load 失败，不要装一半当没看见。
- `!!js` 只用于官方允许的 config / disabled 表达式。其他元数据保持字面量。
- 树外插件不要假设能写进 Web Settings。配置走 patch 或 preset。

## Git prepare

`prepare` 在用户机器、安装时、不在 agent 沙箱里执行。不要在 prepare 里下载未知脚本、不要发网上传环境。文档里写明 prepare 做什么。

## 自修改

不要默认挂 `dsh-tool-cordis`。那会让模型改真实运行时。用户没有明确要求自修改，就不要写进 bundle。
