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
- [关于后端](#关于后端)
- [安装后端](#安装后端)
- [启动后端](#启动后端)

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

自2026/8/30起，我加入的部署后端的教程
你需要事先准备

[uv下载帮助文档](https://uv.doczh.com/getting-started/installation/#_2)

[python下载](https://www.python.org/)

> 一般而言下载的速度比较慢，我推荐你使用诸如`Free Download Manager `或 `Motrix` 等第三方工具来辅助下载 ！

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

这套教程的维护由清汉负责，如对教程有建议，指正者可联系我 QQ `1121840744`。

- 项目骨干：笨笨狐狸 `3674887670`
- 项目领导者：笨蛋千寻 `1549258401`
- 后端 & 前端维护与开发人员：Lich|et `2869580566`、Eptazocine `3070025462`
- 外置链接维护者：Jason·CJ `3549287757`

## 关于后端

后端是拿`python`写的

笨笨狐狸凑凑的

凑凑狐狸笨笨的

在日常牵拉完更新后，此时连接上 `http://localhost:4321/`

页面也许会无响应，刷新几次后，`cmd`后端会**频繁**显示诸如

```cmd
[GraphQL] Network error: fetch failed
21:49:24 [302] /forum/basic-science 19ms
......
```

届时如果你想在主页面进行交互会发现点击交互后毫无相应（有相应也只是刷新一下），`F12`打开控制台后会发现如

`Refused to create......`

等字样，当然，这和`csp`无关
届时我们就需要安装后端了

## 安装后端

重新启用一个cmd窗口
输入

```cmd
git clone https://github.com/LKM-AHZ/LKM-service
cd LKM-service
```

完成后，如果你按照的是[原教程](https://github.com/LKM-AHZ/LKM-service)的做法，此时直接输入

```cmd
uv sync
```

大概率会直接反应为

```cmd
error: Request failed after 3 retries
Caused by: Failed to download ......
Caused by: 由于连接方在一段时间后没有正确答复或连接的主机没有反应，连接尝试失败。 (os error 10060)
```

诸如此类

这说明本机上的`python`版本无法满足需求

对于已安装的，输入

```cmd
python --version
```

以检测，不要想着用`uv venv --python python`偷懒

如果你直接使用

```cmd
uv venv --python python
```

它会告诉你后端对于`python`的要求需要`python`本身的版本大于等于3.13

最好安装`python3.13`，即便你有比`3.13`更高的版本，`uv`也会自行下载`python3.13`，对，就很鸡肋

当然

输入

```cmd
where python
```

以查询本地已安装的`python`的位置

输入

```cmd
py --list
```

以查看目前可用的`python`端口

我们依次输入

```cmd
cd C:\Users\Administrator\LKM-service
rmdir /s /q .venv
uv python pin 3.13
```

一共20多MB，下载的速度可能要慢一些，下载好了会提示你

```cmd
Pinned `.python-version` to `3.13`
```

然后我们输入

```cmd
uv sync
```

如果这是你第一次安装后端，截止至2026/8/30，你一共需要下载共计88个组件

> 对自己的网速没保证的，裸连的情况下下载大约需要一个小时

安装完成后

它会自动列出表单

```cmd
Resolved 113 packages in 219ms
Prepared 88 packages in 34m 23s
Installed 111 packages in 25.00s
 + aiosqlite==0.22.1
 + alembic==1.18.5
 + annotated-doc==0.0.4
......
```

考虑验证下载的文件是否完整，输入

```cmd
uv run pytest -v
```

以校验，如输出

> === 720 passed, 6 deselected in 288.92s (0:04:48) ===

则说明安装成功

## 启动后端

如果你输入

```cmd
uvicorn main:app --reload
```

后，`cmd`提示你

> 'uvicorn' 不是内部或外部命令，也不是可运行的程序或批处理文件。

这八成是因为 `uvicorn` 安装在项目的虚拟环境 `.venv` 里，没有装到全局
在当前目录下（`cd C:\Users\Administrator\LKM-service`）
输入

```cmd
uv run uvicorn main:app --reload
```

`uv run` 的作用是：在项目的虚拟环境里查找并执行后面的命令。

在输入后如果输出如

```cmd
INFO:     Will watch for changes in these directories: ['C:\\Users\\Administrator\\LKM-service']
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [7112] using WatchFiles
......
```

则说明后端启动成功。

届时再在浏览器中访问

> http://localhost:8000/

如有响应
重新启用一个`cmd`
输入

```cmd
cd LKM-official-website
pnpm dev
```

即可看到（类似于这样的）输出

```cmd
23:38:58 [302] /forum/basic-science 322ms
23:38:58 [200] /forum 18ms
23:38:59 [302] /forum/basic-science 16ms
23:38:59 [200] /forum 20ms
23:39:02 [302] /forum/basic-science 8ms
23:39:02 [200] /forum 31ms
```

则说明问问题已经解决

（目前的交互页面只是一个空架子，所以点了没响应也是正常的）

在后续的开发中
确保完成更新后
先输入

```cmd
cd C:\Users\Administrator\LKM-service
uv run uvicorn main:app --reload
```

再输入

```cmd
cd LKM-official-website
>pnpm run
```

即可
（就目前而言，后端貌似没什么作用）

退出后端程序按`Ctrl+C`即可。
