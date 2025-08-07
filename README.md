# ProxyEverythingCloudFlare
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
