/**
 * 首次安装时的预置快捷入口（顺序、网址、移动/桌面设置）。
 * 仅在全新安装且 sync/local 均无用户数据时写入 local；不会覆盖已有数据。
 * 同步：node scripts/extract-shortcuts-from-log.mjs --write
 */
export const DEFAULT_INSTALL_SHORTCUTS = [
  { title: "语雀", url: "https://www.yuque.com/", mobile: true },
  { title: "wps待办", url: "https://todo.wps.cn/?groupId=1", mobile: true },
  { title: "有道", url: "https://dict.youdao.com/", mobile: true },
  { title: "小红书", url: "https://www.xiaohongshu.com/explore", mobile: false },
  { title: "抖音", url: "https://www.douyin.com/jingxuan", mobile: false },
  { title: "抖音聊天", url: "https://www.douyin.com/chat?isPopup=1", mobile: true },
  { title: "微博", url: "https://weibo.com/", mobile: true },
  { title: "Instagram", url: "https://www.instagram.com/", mobile: false },
  { title: "TikTok", url: "https://www.tiktok.com/", mobile: false },
];
