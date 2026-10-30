# SeekMate

[English](./README.md) | [简体中文](./README.zh-Hans.md)

SeekMate 是一款基于 Expo 和 React Native 构建的 **Android 端 NodeSeek 非官方客户端**，让你在移动设备上更方便地浏览和参与社区。

## 界面预览

![SeekMate 浅色和深色模式下的首页、版块、未登录个人页面和设置界面](./docs/images/overview.webp)

_截图来自 0.0.18 版本，当前界面可能有所不同。_

## 功能特性

- **浏览帖子**：查看最新主题和回复，或按版块浏览。
- **阅读内容**：查看正文和评论，支持分页、下拉刷新和加载更多。
- **发布帖子**：使用富文本编辑器，可通过 NodeImage 上传图片。
- **搜索内容**：搜索帖子并查看最近搜索记录。
- **个人中心**：查看账户统计和最近浏览的帖子。
- **每日签到**：手动签到，或在应用启动时自动签到。
- **查看通知**：查看未读提醒并跳转至 NodeSeek 网页。

## 平台支持

目前支持 **Android**。

## 下载

- [Google Play](https://play.google.com/store/apps/details?id=com.angiin.seekmate)
- [GitHub Releases](https://github.com/mrzhiin/seekmate/releases)（APK）

## 说明

上传图片前需在设置中配置 NodeImage API Key。Key 保存在本机，上传时会发送给 NodeImage，但不会远程同步；每次成功登录（包括重新登录）或退出登录时都会清空。

## 许可证

本项目使用 [MIT License](./LICENSE)。

## 致谢

- [NodeSeek](https://www.nodeseek.com/)
- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
