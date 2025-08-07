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

## about
- https://t.me/+YfCVhGWyKxoyMDhl

## 手机测试端
- v1.0.0 无业务规则，全转发
- v1.0.1 内置黑名单，黑名单列表中的站点不予以跳转
- v1.0.2 限制网址长度，长度大于32个的字符串会直接截断，避免业务滥用
