# LKM 新手指南 · 从零搭建并加入开发

> 本教程施用于面向希望参与 **LKM 官方网站**（`LKM-official-website`）开发的成员，介绍环境部署、开发工具、常见问题、日常更新与上传改动的完整流程。下文简称`LKM`，后端为独立部署。其余详见此处说明。
>
> 建议开发在电脑端完成，以下以 **Windows + cmd** 为例。默认你已基本会使用 GitHub（[还不会？点我](https://www.bilibili.com/video/BV1m4GhzEER3/?spm_id_from=333.337.search-card.all.click&vd_source=0fd643b947c80b42ab465c4ed3101244)）。

---

## 读前须知

本教程由**清汉**`QQ1121840744`负责更新与维护，任何对本教程有意见或修改者，请务必以私信的方式联系我！！！未征得本人同意，严禁修改此处的任何内容，同时也欢迎各位指出本教程的错误/遗漏之处。

`cmd`同下文的`终端`一词。

对于旧文档，见

- [README2.md](./README2.md)
- [GETTING_STARTED.md](./GETTING_STARTED.md)
- [CODING_STANDARDS.md](./CODING_STANDARDS.md)

---

## 快速导航

- [环境部署](#环境部署)
- [开发工具部署](#开发工具部署)
- [下载过程中易遇到的问题](#下载过程中易遇到的问题)
- [更新pnpm v12.6.0后遇到的错误](#更新pnpm-v1260后遇到的错误)
- [关于后续的更新](#关于后续的更新)
- [关于合并分支时冲突的情况](#关于合并分支时冲突的情况)
- [启动开发平台](#启动开发平台)
- [熟悉网站架构](#熟悉网站架构)
- [正式加入](#正式加入)
- [上传你的改动](#上传你的改动)
- [外置链接](#外置链接)
- [联系我们](#联系我们)
- [关于后端](#关于后端)
- [安装后端](#安装后端)
- [启动后端](#启动后端)
- [关于postgresql](#关于postgresql)
- [关于lkm-ahzlkm-official-static与其安装教程](#关于lkm-ahzlkm-official-static与其安装教程)
- [关于如何完整地访问目前网站的内容](#关于如何完整地访问目前网站的内容)

---

## 前言

理科迷（`LKM`）的官网基于 Astro 架构搭建，目前处于测试阶段，部分功能尚有不完善之处。若你有兴趣参与网站建设，欢迎加入技术委员会（QQ 群 `1104277319`）以更深入地交流。

- 总仓库地址：[LKM-AHZ/LKM-official-website](https://github.com/LKM-AHZ/LKM-official-website)

- 后端仓库地址：[LKM-AHZ/LKM-service: backend](https://github.com/LKM-AHZ/LKM-service)

不过自2026/9/28日以来，官网被**笨蛋千寻**和**笨笨狐狸**拆了个稀碎，目前而言，网站分为如下六大板块，其余四个板块分别为：

- 理科迷开发公约文档 : [LKM-AHZ/LKM-Documents](https://github.com/LKM-AHZ/LKM-Documents)

- `LKM`适用于`VScode`的插件: [LKM-AHZ/LKM-on-VSCode](https://github.com/LKM-AHZ/LKM-on-VSCode)

- 后独立于`LKM-official-website`的`http://127.0.0.1:4321`端口,也称作社区前端: [LKM-AHZ/LKM-official-static](https://github.com/LKM-AHZ/LKM-official-static)

- `LKM`网站的本地开发与部署编排仓库：[LKM-AHZ/LKM-Website](https://github.com/LKM-AHZ/LKM-Website)

如下，我介绍对网站的部署和开发。
主要涉及到`总仓库`(你目前所处的页面)、`后端仓库`和`LKM-AHZ/LKM-official-static`

目前，[LKM-official-website](https://github.com/LKM-AHZ/LKM-official-website)是网站的`总前端`，你可以在[LKM-AHZ](https://github.com/LKM-AHZ)看到目前所有的总分支。

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

> 如果你不想让项目默认安装在 C 盘，考虑让`git clone`在克隆的时候指定要克隆到的路径，可以在后面标定你要克隆的位置，这里以`E:\LKM Website`为例，注意，要先建立一个名为`LKM Website`的文件夹，再打开终端执行克隆命令

```cmd
git clone https://github.com/LKM-AHZ/LKM-official-website "E:\LKM Website"
```

在后续的操作中请记得输入参数 `/d` 来改变盘符。

运行命令安装依赖：

```cmd
pnpm install
```

之后再运行：

```cmd
pnpm run dev
```

此时会输出 `$ astro dev`。随后打开浏览器（默认为 `Edge`）访问 <http://localhost:4321/> 即可看到目前的官网。

- [返回标题](#lkm-新手指南--从零搭建并加入开发)

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

- [返回标题](#lkm-新手指南--从零搭建并加入开发)

## 更新pnpm v12.6.0后遇到的错误

部分用户可能在顺手更新到`pnpm v12.6.0`后遇到了诸如

```cmd
C:\Users\Administrator\LKM-official-website>pnpm --version
'"C:\Users\Administrator\AppData\Local\pnpm\.tools\pnpm\12.6.0\bin\\..\node_modules\pnpm\pnpm"'
不是内部或外部命令，也不是可运行的程序
或批处理文件。
```

这类错误

解决的方法也比较简单，首先来验证一下你的确装载了`pnpm`
无论你是在当前目录运行也好，在默认目录运行也罢

```cmd
dir "%LOCALAPPDATA%\pnpm\.tools\pnpm\12.6.0\node_modules\pnpm\dist"
type "%LOCALAPPDATA%\pnpm\.tools\pnpm\12.6.0\node_modules\pnpm\pnpm"
node "%LOCALAPPDATA%\pnpm\.tools\pnpm\12.6.0\node_modules\pnpm\bin\pnpm.mjs" --version
```

确认输出不是空的或者报错后，基本确定是更新后的`shim`问题，我们改一下`shim`即可

```cmd
cd LKM-official-website
```

当然，你也可以在默认终端路径中直接运行

```
cd /d "%LOCALAPPDATA%\pnpm\.tools\pnpm\12.6.0\bin"
copy pnpm.CMD pnpm.CMD.bak
```

这一步是为了备份

```cmd
notepad pnpm.CMD
```

记事本打开pnpm.CMD后，把内容整个替换成这两行

```notepad
@SETLOCAL
@node "%~dp0\..\node_modules\pnpm\bin\pnpm.mjs" %*
```

保存后，重启终端再进入当前目录继续开发即可。

究其原因，大概率是占位文件故意不带 `shebang`，靠 `libc` 兜底，且`Windows CMD` 只看扩展名，根本原因是`install.js` 没跑成。当然，我这里不做过多赘述。
对pnpm有意见者，可以去`pnpm`的[官网](https://github.com/pnpm/pnpm)中的[issues](https://github.com/pnpm/pnpm/issues)页面向开发者反馈。

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

## 关于合并分支时冲突的情况

在你更改完并选择提交到仓库的途中，如果在这期间有其他人比你先一步完成了对仓库的提交，则仓库会驳回你的提交，此时你再想提交，就会进入这个页面

```cmd
Merge branch 'main' of github.com:LKM-AHZ/LKM-official-website
# Please enter a commit message to explain why this merge is necessary,
# especially if it merges an updated upstream into a topic branch.
#
# Lines starting with '#' will be ignored, and an empty message aborts
# the commit.
~                                                               ......
```

这是 `Git `在让你填写这次合并提交`merge commit`的说明，默认用 `Vim` 打开，你可以在下方的输入栏中输入如下指令

```cmd
:wq
```

保留这次合并,保存并退出

```cmd
:q!
```

取消这次合并,不保存退出

一般而言我们建议选择前者。

完成后退出重新提交即可。

## 启动开发平台

确保完成上述**所有**步骤后，重新启用一个终端，输入并执行：

```cmd
cd LKM-official-website
pnpm dev
```

浏览器访问 <http://localhost:4321/>。VSCode 进入 `LKM-official-website` 文件夹即可启动开发平台（记得勾选"我完全信任"）。

> `pnpm run dev` 仅启动 **Astro（端口 4321）**。仓库不含后端，后端请求经 `API_URL` 代理到真实后端（见 `.env.example`），未配置则前端仅提供不依赖 API 的页面。

目前 Astro 采用的是**热更新（HMR）**架构，修改源文件的同时改动会迅速反映到网页上。

不过此时你会看到终端提示你

```cmd
[graphql] ......
未配置 API_URL，SSR 回退到 http://localhost:8000/graphql/v1
(node:1236) Warning: `--localstorage-file` was provided without a valid path
(Use `node --trace-warnings ...` to show where the warning was created)
```

这是因为端口`http://127.0.0.1:4321`端口已从`LKM-AHZ/LKM-official-static`中独立拆分了出去

目前的官网并没有这份内容。有关进一步的说明，详见[关于如何完整地访问目前网站的内容](#关于如何完整地访问目前网站的内容)

- [返回标题](#lkm-新手指南--从零搭建并加入开发)

## 熟悉网站架构

建议先熟悉一下项目的基本架构。例如要编写起始页的信息，具体位置在：

`LKM-official-website\src\pages\index.astro`

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

要让改动通过 `pending` 并显示为 `success`，首先需要知道改动的文件路径。以 `src\pages\index.astro` 为例，**假设**对它做出了改动，则 `cmd` 输入：

```cmd
pnpm exec prettier --write src\pages\index.astro
git add src\pages\index.astro
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

- [返回标题](#lkm-新手指南--从零搭建并加入开发)

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

对于一些具体的内容，详见[后端](https://github.com/LKM-AHZ/LKM-service)的`README`

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

以校验，如输出的结果类似为

> === 720 passed, 6 deselected in 288.92s (0:04:48) ===

则说明安装成功

- [返回标题](#lkm-新手指南--从零搭建并加入开发)

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

## 关于`postgresql`

如果你需要安装`postgresql`，`postgresql`的官方网址为

[官网](www.postgresql.org)

进入后，点击下方的`Download→`按钮

在`PostgreSQL Downloads`标题下面的`Packages and Installers`下选择

`Windows`

然后你会看见`Windows installers`

下面的第一个子标题`Interactive installer by EDB`

第一段`Download the installer`单击后进入

https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

页面

在`Windows x86-64`页面单击那个蓝色的小图标即可开始下载
具体的教程参见

https://www.runoob.com/postgresql/windows-install-postgresql.html

此外，如果你中途不小心把向导关闭了

启动应用程序的文件在`pgAdmin 4\runtime\pgAdmin4.exe` 处

或者你直接在开始菜单中搜索pgAdmin4也行。

- [返回标题](#lkm-新手指南--从零搭建并加入开发)

## 关于`LKM-AHZ/LKM-official-static`与其安装教程

这里就不在详细赘述[LKM-AHZ/LKM-official-static](https://github.com/LKM-AHZ/LKM-official-static)的内容了，它在`README`处有写。

首先我们优先考虑安装，重新启用一个`cmd`输入并执行

```cmd
git clone https://github.com/LKM-AHZ/LKM-official-static
```

整体克隆下来后

```cmd
cd LKM-official-static
```

输入

```cmd
pnpm install
pnpm dev
```

即可，`pnpm dev`就是启动开发平台的命令，不过别忘了，如果嫌下载太慢，别忘了在`pnpm install`后面加参数`--network-concurrency=2 --fetch-timeout=60000`

对于LKM-AHZ/LKM-official-static，如果在启动开发平台的途中遇到错误，请联系笨笨狐狸`QQ 3674887670`或是在群里`1104277319`反馈。

## 关于如何完整地访问目前网站的内容

截止至目前为止，如果你想在本地体验完整的网站内容

除去后端的因素，确保你按照本教程成功**安装**并**验证**了

- [LKM-official-website](#启动开发平台)和 [LKM-official-static](#关于lkm-ahzlkm-official-static与其安装教程) 后

我们注意到

如果只启动`LKM-official-website`

那么在你所打开的`http://127.0.0.1:4321`中的任何页面的交互是没有任何响应的

如果只启动LKM-official-static并访问`http://127.0.0.1:4321`

会显示

http://localhost:4321 拒绝访问

那么真相就只有一个了

你需要先启动`LKM-official-static`

再启动`LKM-official-website` 即可访问到完整的内容

后续的开发工作将基于此进行。
