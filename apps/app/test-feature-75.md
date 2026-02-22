# 测试 Feature #75: PuraToDo 在 macOS 系统应用列表中

## 测试日期
2026-02-22

## 前置条件
- PuraToDo.app 已构建并安装
- 位置: /Applications/PuraToDo.app
- 版本: 0.2.0

## 测试步骤

### 1. 验证 App 安装位置
✅ App 已安装在 /Applications 目录
```bash
ls -la /Applications/ | grep -i pura
# 输出: drwxr-xr-x@   3 getn  admin     96 Feb 22 00:10 PuraToDo.app
```

### 2. 在 Launchpad 中查找（需要手动操作）
**测试步骤：**
1. 点击 Dock 上的 Launchpad 图标（或按 F4 / 四指捏合手势）
2. 在搜索框输入 "PuraToDo"
3. 查找 PuraToDo app 图标（蓝色复选框图标）

**预期结果：**
- ✅ PuraToDo 图标出现在 Launchpad 中
- ✅ 图标显示正确（带 AppIcon）
- ✅ 点击图标可以启动应用

### 3. 固定到 Dock（可选）
**测试步骤：**
1. 在 Launchpad 中找到 PuraToDo
2. 拖拽到 Dock 栏
3. 释放鼠标

**预期结果：**
- ✅ PuraToDo 出现在 Dock 中
- ✅ 点击 Dock 图标可以快速启动

### 4. 验证 App 正常启动
**测试步骤：**
1. 从 Launchpad 或 Dock 点击 PuraToDo
2. 等待应用窗口出现

**预期结果：**
- ✅ 应用窗口成功打开
- ✅ 显示登录界面
- ✅ 窗口标题显示 "PuraToDo"
- ✅ 菜单栏显示 "PuraToDo" 菜单

## 自动化验证（部分）

### 检查 App Bundle 信息
```bash
# 查看 App 基本信息
plutil -p /Applications/PuraToDo.app/Contents/Info.plist | grep -E "CFBundle|CFIcon"

# 验证可执行文件
file /Applications/PuraToDo.app/Contents/MacOS/PuraToDo

# 检查代码签名
codesign -dv /Applications/PuraToDo.app
```

### 使用命令行启动验证
```bash
# 从命令行启动应用
open /Applications/PuraToDo.app

# 检查进程是否运行
ps aux | grep -i puratodo
```

## 测试结果

### 系统集成验证
- ✅ App 已正确安装在 /Applications
- ⏸️ Launchpad 显示（需要手动验证）
- ⏸️ Dock 固定（需要手动验证）
- ⏸️ 启动功能（需要手动验证）

### 建议
由于 agent-browser 是 web 浏览器自动化工具，无法测试 macOS 系统界面。
建议手动完成以下操作：
1. 打开 Launchpad 验证图标显示
2. 启动应用验证功能正常
3. 如果一切正常，更新 feature_list.json 中 #75 的 passes 为 true

## 下一步
如果手动测试通过，可以继续实现其他功能：
- #80: 深度链接（需要 tauri-plugin-deep-link）
- #81: 本地通知（需要 tauri-plugin-notification）
- #83-84: Windows/Linux 构建（需要相应平台环境）
