# LKM 新手指南 · 从零搭建并加入开发

> 本指南面向希望参与 **LKM 官方网站**（`LKM-official-website`）开发的成员，介绍环境部署、开发工具、常见问题、日常更新与上传改动的完整流程。仓库仅含前端（Astro + Vue + React），后端为独立部署的真实服务。
>
> 建议开发在电脑端完成，以下以 **Windows + cmd** 为例。默认你已基本会使用 GitHub（[还不会？点我](https://www.bilibili.com/video/BV1m4GhzEER3/?spm_id_from=333.337.search-card.all.click&vd_source=0fd643b947c80b42ab465c4ed3101244)）。

---

## 快速导航

- [环境部署](#环境部署)
- [开发工具部署](#开发工具部署)
- [下载过程中易遇到的问题](#下载过程中易遇到的问题)
- [关于后续的更新](#关于后续的更新)
- [启动开发平台](#启动开发平台)
- [熟悉网站架构](#熟悉网站架构)
- [正式加入](#正式加入)
- [上传你的改动](#上传你的改动)
- [外置链接](#外置链接)
- [联系我们](#联系我们)

---

## 前言

理科迷（`LKM`）的官网基于 Astro 架构搭建，目前处于测试阶段，部分功能尚有不完善之处。若你有兴趣参与网站建设，欢迎加入技术委员会（QQ 群 `1104277319`）以更深入地交流。

- 总仓库地址：[LKM-AHZ/LKM-official-website](https://github.com/LKM-AHZ/LKM-official-website)
- 后端仓库地址：[LKM-AHZ/LKM-service: backend](https://github.com/LKM-AHZ/LKM-service)

## 环境部署

**oi！小登！** 你需要准备如下工具来完成开发环境的部署，后续所有操作将在 `cmd`（命令提示符）中执行：

- `Git bash`（以下简称 `git`）
- `pnpm`
- `NodeJS 24+`
- 一个稳定可靠的网络

下载地址：[Git bash](https://git-scm.com/install/windows)、[Pnpm](https://pnpm.io/zh/installation)、[NodeJS](https://nodejs.org)

> 相关的安装教程可在 `CSDN` 或 `B站` 等平台找到。

安装好这些工具后，打开 `cmd`，输入指令：

```cmd
git clone https://github.com/LKM-AHZ/LKM-official-website.git
```

克隆完成后，进入项目所在的本地目录下：

```cmd
cd LKM-official-website
```

> 如果你不想让项目默认安装在 C 盘，在后续的操作中请记得输入参数 `/d` 来改变盘符。

运行命令安装依赖：

```cmd
pnpm install
```

之后再运行：

```cmd
pnpm run dev
```

此时会输出 `$ astro dev`。随后打开浏览器（默认为 `Edge`）访问 <http://localhost:4321/> 即可看到目前的官网。

## 开发工具部署

通常情况下我们选用 [VSCode](https://code.visualstudio.com/Download?_exp_download=fb315fc982) 进行开发。安装完 VSCode 后，需要在 VSCode 的插件商店中下载如下组件：

- `Nodejs`（extensions for nodejs）
- `Pnpm`（Pnpm commands for VSCode）
- `Astro`（Language support for Astro）
- `MDX`（Language support for MDX）

随后用 VSCode 打开文件夹（默认位置为 C 盘 `C:\Users\<你的用户名>\LKM-official-website`）即可完成开发环境的部署。也可以直接用 `cmd` 的 `code` 命令来打开。

## 下载过程中易遇到的问题

对于 `github` 本身，用户可用 `SSL` 来解决大部分 `git clone` 时遇到的网络波动问题。

而 `pnpm install` 这一步骤本身也极易受到网络干扰，例如等待一段时间后输出红色字幕警告：

```bash
[ERR_PNPM_META_FETCH_FAIL] GET https://registry.npmjs.org/......: The operation was aborted due to timeout
```

此时就要尝试切换镜像源了。**更换完镜像源后需清除缓存**：

```cmd
pnpm store prune
```

如果只是中途发生错误，并不需要更换镜像源，清除缓存即可：

```cmd
pnpm clean --lockfile
```

检查网络延迟（仅供参考）：

```cmd
npm ping
```

通过设置如下环境参数，`pnpm` 的下载会稳定很多：

```cmd
set NODE_OPTIONS=--dns-result-order=ipv4first
set PNPM_NETWORK_CONCURRENCY=4
set PNPM_FETCH_TIMEOUT=60000
```

也可以通过在 `pnpm install` 后追加参数的形式稳定下载：

```cmd
pnpm install --network-concurrency=1 --fetch-timeout=60000
```

官网的下载速度一般较慢，可以改用镜像源来加快进度（默认在 `LKM-official-website` 根目录执行，这里以淘宝镜像源为例）：

```cmd
pnpm config set registry https://registry.npmmirror.com
pnpm store prune
pnpm install --network-concurrency=2 --fetch-timeout=60000
```

## 关于后续的更新

```cmd
cd LKM-official-website
```

先使用 `git stash` 保留你的更改：

```cmd
git stash
```

在后续使用中，如需更新别人的内容，需要手动完成，依次输入：

```cmd
git stash
git pull
pnpm install --network-concurrency=2 --fetch-timeout=60000
```

如看到类似的输出 `Already up to date`，则说明更新已完成。

## 启动开发平台

确保完成上述步骤后，重新启用一个终端：

```cmd
cd LKM-official-website
pnpm dev
```

浏览器访问 <http://localhost:4321/>。VSCode 进入 `LKM-official-website` 文件夹即可启动开发平台（记得勾选"我完全信任"）。

> `pnpm run dev` 仅启动 **Astro（端口 4321）**。仓库不含后端，后端请求经 `API_URL` 代理到真实后端（见 `.env.example`），未配置则前端仅提供不依赖 API 的页面。

目前 Astro 采用的是**热更新（HMR）**架构，修改源文件的同时改动会迅速反映到网页上。

## 熟悉网站架构

建议先熟悉一下项目的基本架构。例如要编写起始页的信息，具体位置在：

`LKM-official-website\src\pages\official\index.astro`

其余的请详见 [README.md](./README.md) 的「项目结构」与「页面路由」。

## 正式加入

在做好加入开发组（目前叫技术组）的准备后，你需要准备一个 `github` 账号和一个能用的邮箱（如 QQ 邮箱）。**确保你的账户有效且不会被盗，并保证我们能够与你取得联系。**

向有关部门提交申请后，如果通过，会发给你一封加入组织的邮件。首先需要在本地登录你的 `github` 账户，在 `LKM-official-website` 目录下的 `cmd` 中输入：

```cmd
git config --global user.email "you@example.com"
git config --global user.name "Your Name"
```

- 在 `you@example.com` 处填入你的 `github` 账户绑定的邮箱
- 在 `Your Name` 处填入你的 `github` 账户昵称

其次，在收到邮件后同意并加入到组织中，并确保项目管理者已授予你更改仓库的权限（即 `write` 权限），可以在个人主页 [repositories](https://github.com/settings/repositories) 处查看。

## 上传你的改动

```cmd
cd LKM-official-website
```

确保你的改动已经在本地文件中保存完毕（VSCode 快捷键是 `CTRL+S`）。**此外，请确保改动前你已和总仓库同步**：

```cmd
git pull
```

在 `cmd` 终端（默认为 `LKM-official-website` 目录）输入如下命令将改动上传至仓库：

```cmd
git add .
git commit -m "<请输入文本>"
git push
```

上传后仓库大概率会显示 **Some checks were not successful**，可以在 [Commits · LKM-AHZ/LKM-official-website](https://github.com/LKM-AHZ/LKM-official-website/commits/main/) 中查看详情原因。

要让改动通过 `pending` 并显示为 `success`，首先需要知道改动的文件路径。以 `src\pages\official\index.astro` 为例，**假设**对它做出了改动，则 `cmd` 输入：

```cmd
pnpm exec prettier --write src\pages\official\index.astro
git add src\pages\official\index.astro
git commit -m "请输入文本"
git push
```

如果一次性修改了多个文件，可以在每个 `src\...` 后空一格再接着上传（实机时 `...` 是具体路径）：

```cmd
pnpm exec prettier --write src\... src\... src\...
```

对于其他的路径同理。

适合较大的改动时，可以先在本地验证一遍：

```cmd
pnpm run check
```

如要统一 Prettier 格式：

```cmd
pnpm exec prettier --write .
```

（如果只是想单个统一，输入 `pnpm exec prettier --write (具体的文件路径)`）

在全程无报错的情况下即可上传至仓库。

## 外置链接

对外测试访问地址为 <http://124.220.55.235/>（当前为测试 IP 直连，HTTP 为主）。

感谢 `Jason·CJ`（QQ `3549287757`）。

## 联系我们

这套教程的维护由清汉负责，如对教程有建议可联系 QQ `1121840744`。

- 项目骨干：笨笨狐狸 `3674887670`
- 项目领导者：笨蛋千寻 `1549258401`
- 后端 & 前端维护与开发人员：Lich|et `2869580566`、Eptazocine `3070025462`
- 外置链接维护者：Jason·CJ `3549287757`
