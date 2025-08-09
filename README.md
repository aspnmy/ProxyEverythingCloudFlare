# ProxyEverythingCloudFlare 万站互联

Proxy Everything with CF Workers ,万站互联

## 部署在CloudFlare的worker上的，反代脚本

## 部署方式

- 登陆CloudFlare
- 新建一个woker，点击编辑代码
- 上传woker.js，点击部署
- 给woker绑定自己的域名
- 访问，按照界面的提示就行反代即可

## 特别说明

- 只要是CloudFlare本身不能访问到的网站，就无法反代

## 黑名单配置

- 在 `worker.js` 文件中找到 `BLACKLIST` 数组
- 添加需要屏蔽的域名到数组中，例如：
  ```javascript
  const BLACKLIST = [
    'example.com',
    'blocked-site.com'
  ];
  ```
- 常用恶意网站目录
```github
# 收录主要为带有木马、病毒、恶意软件的网站目录
https://github.com/aspnmy/CN-Malicious-website-list.git
```
## about

- https://t.me/+YfCVhGWyKxoyMDhl

## 手机测试端

- v1.0.0 无业务规则，全转发
- v1.0.1 内置黑名单，黑名单列表中的站点不予以跳转
- v1.0.2 增加域名长度限制（16字符）和非法参数检测,避免业务滥用
- v1.0.3 优化前端提示信息显示
- v1.0.4 增加ws反代协议支持