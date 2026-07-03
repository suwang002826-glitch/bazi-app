# GitHub 小白操作手册

你不需要一次学会 GitHub。第一阶段只要会五件事：

1. 创建仓库
2. 上传项目
3. 邀请朋友
4. 创建任务
5. 看 Pull Request

## 最推荐方式：GitHub Desktop

GitHub Desktop 是图形界面，比命令行简单。

### 第一步：安装并登录

1. 打开 https://desktop.github.com/
2. 下载并安装 GitHub Desktop
3. 用你的 GitHub 账号登录

### 第二步：添加本地项目

1. 打开 GitHub Desktop
2. 点击 `File`
3. 点击 `Add Local Repository`
4. 选择这个项目文件夹：

```text
C:\Users\Admin\Documents\Codex\2026-06-27\jie-mi\outputs\bazi-app
```

### 第三步：发布到 GitHub

1. 点击 GitHub Desktop 里的 `Publish repository`
2. 名字填：`bazi-app`
3. 勾选 `Keep this code private`
4. 点击发布

发布后，你会得到一个类似这样的地址：

```text
https://github.com/你的用户名/bazi-app
```

把这个地址发给 Codex，后面的 Issue、分支、PR 可以继续让 Codex 帮你处理。

## 网页方式：不用安装软件

如果暂时不想安装 GitHub Desktop，也可以用网页上传。

### 第一步：创建仓库

1. 打开 https://github.com/
2. 点击右上角 `+`
3. 点击 `New repository`
4. Repository name 填：`bazi-app`
5. 选择 `Private`
6. 不要勾选 README
7. 点击 `Create repository`

### 第二步：上传文件

1. 打开刚创建的仓库
2. 点击 `Add file`
3. 点击 `Upload files`
4. 把本地项目文件夹里的源码拖进去
5. 不要上传这些文件夹：

```text
node_modules
dist
.git
```

6. 页面底部点击 `Commit changes`

## 邀请朋友

1. 打开仓库页面
2. 点击 `Settings`
3. 点击 `Collaborators`
4. 点击 `Add people`
5. 输入朋友的 GitHub 用户名或邮箱
6. 发送邀请

朋友接受邀请后，就能一起协作。

## 创建任务

1. 打开仓库页面
2. 点击 `Issues`
3. 点击 `New issue`
4. 选择 `功能任务`
5. 填目标和验收标准
6. 点击 `Submit new issue`

## 你以后每天只看三个地方

- `Code`：项目文件
- `Issues`：任务清单
- `Pull requests`：检查和合并改动

其他按钮暂时不用管。

## 遇到看不懂的页面

把页面截图发给 Codex，或者直接告诉 Codex 你现在看到哪些按钮。Codex 会告诉你下一步点哪里。
