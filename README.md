https://greasyfork.org/zh-CN/scripts/526394-mg-linkcollector   插件地址
   
为了确保能获取所有网页的磁力链接，该插件有以下保障措施：
1.使用 DOMContentLoaded 事件代替 window.onload，以确保脚本在DOM完全加载后执行。
2.使用 MutationObserver 来监听DOM的变化。一旦检测到新的磁力链接被添加到页面中，立即提取并保存。
3.添加一个新的按钮“监测当前页面”。当用户点击这个按钮时，会重新获取当前页面的磁力链接并更新到文本框中。
4.在脚本中添加一个定时器。这个定时器会在脚本加载后3秒触发，调用 extractMagnetLinks 函数提取磁力链接，并调用 saveMagnetLinks 函数保存这些链接。

算无遗策- -（笑）
