// ==UserScript==
// @name         MG-Linkcollector
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  提取页面中的磁力链接并收集到文本框中，支持跨网页收集，文本框内容实时更新，使用快捷键CTRL+Q能快速删除当前页的磁力链接
// @author       黄萌萌可爱多
// @match        *://*/*
// @license      MIT
// @grant        GM_registerMenuCommand
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
  'use strict';

  // 提取磁力链接
  function extractMagnetLinks() {
    var magnetLinks = [];
    // 遍历所有链接
    var linkElements = document.getElementsByTagName('a');
    for (var i = 0; i < linkElements.length; i++) {
      var linkElement = linkElements[i];
      var link = linkElement.href;
      if (link.startsWith('magnet:')) {
        magnetLinks.push(link);
      }
    }
    // 遍历所有文本节点
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    while (walker.nextNode()) {
      var node = walker.currentNode;
      var text = node.textContent.trim();
      if (text.startsWith('magnet:')) {
        magnetLinks.push(text);
      }
    }
    return magnetLinks;
  }

  // 从localStorage中获取已保存的磁力链接
  function getSavedMagnetLinks() {
    var savedLinks = localStorage.getItem('magnetLinks');
    return savedLinks ? JSON.parse(savedLinks) : [];
  }

  // 将新的磁力链接保存到localStorage
  function saveMagnetLinks(magnetLinks) {
    var savedLinks = getSavedMagnetLinks();
    // 合并新链接和已保存的链接，去重
    var combinedLinks = Array.from(new Set([...savedLinks, ...magnetLinks]));
    try {
      // 尝试保存到localStorage
      localStorage.setItem('magnetLinks', JSON.stringify(combinedLinks));
    } catch (e) {
      if (e instanceof DOMException && e.code === 22) { // 22 是 QUOTA_EXCEEDED_ERR
        // 如果localStorage满了，清理旧数据
        console.warn('localStorage空间不足，正在清理旧数据...');
        // 清理旧数据，保留最近的100个链接
        var maxLinks = 100;
        if (combinedLinks.length > maxLinks) {
          combinedLinks = combinedLinks.slice(-maxLinks); // 保留最近的100个链接
        }
        localStorage.setItem('magnetLinks', JSON.stringify(combinedLinks));
        console.log('清理完成，现在可以继续保存新数据。');
      } else {
        throw e; // 如果是其他错误，抛出异常
      }
    }
  }

  // 删除当前页面的磁力链接
  function deleteCurrentPageLinks(currentLinks) {
    var savedLinks = getSavedMagnetLinks();
    var updatedLinks = savedLinks.filter(link => !currentLinks.includes(link));
    localStorage.setItem('magnetLinks', JSON.stringify(updatedLinks));
  }

  // 清除所有磁力链接
  function clearAllLinks() {
    localStorage.removeItem('magnetLinks');
  }

  // 创建文本框和悬浮按钮
  function createTextBoxAndButtons() {
    // 创建文本框
    var textBox = document.createElement('textarea');
    textBox.id = 'magnetLinksBox';
    textBox.style.position = 'fixed';
    textBox.style.bottom = '200px'; // 调整文本框位置
    textBox.style.right = '10px';
    textBox.style.width = '300px';
    textBox.style.height = '200px';
    textBox.style.display = 'none'; // 默认隐藏
    textBox.style.zIndex = '9999';
    textBox.placeholder = '提取的磁力链接将显示在这里...';

    // 创建悬浮按钮
    var toggleButton = document.createElement('button');
    toggleButton.id = 'toggleLinksBoxButton';
    toggleButton.style.position = 'fixed';
    toggleButton.style.bottom = '10px'; // 按钮悬浮在页面底部
    toggleButton.style.right = '10px';
    toggleButton.style.width = '100px';
    toggleButton.style.height = '40px';
    toggleButton.style.zIndex = '9999';
    toggleButton.style.background = '#4CAF50'; // 按钮背景颜色
    toggleButton.style.color = 'white'; // 按钮文字颜色
    toggleButton.style.border = 'none';
    toggleButton.style.borderRadius = '5px';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.fontSize = '14px';
    toggleButton.textContent = '展开/关闭';
    toggleButton.addEventListener('click', function() {
        var textBox = document.getElementById('magnetLinksBox');
        if (textBox.style.display === 'none') {
            // 每次展开时重新从localStorage中读取并显示链接，添加序号
            var savedLinks = getSavedMagnetLinks();
            textBox.value = savedLinks.map((link, index) => `${index + 1}. ${link}`).join('\n');
            textBox.style.display = 'block';
        } else {
            textBox.style.display = 'none';
        }
    });

    // 创建删除当前链接按钮
    var deleteCurrentButton = document.createElement('button');
    deleteCurrentButton.id = 'deleteCurrentLinksButton';
    deleteCurrentButton.style.position = 'fixed';
    deleteCurrentButton.style.bottom = '60px'; // 按钮悬浮在页面底部
    deleteCurrentButton.style.right = '10px';
    deleteCurrentButton.style.width = '100px';
    deleteCurrentButton.style.height = '40px';
    deleteCurrentButton.style.zIndex = '9999';
    deleteCurrentButton.style.background = '#FF9800'; // 按钮背景颜色
    deleteCurrentButton.style.color = 'white'; // 按钮文字颜色
    deleteCurrentButton.style.border = 'none';
    deleteCurrentButton.style.borderRadius = '5px';
    deleteCurrentButton.style.cursor = 'pointer';
    deleteCurrentButton.style.fontSize = '14px';
    deleteCurrentButton.textContent = '删除当前链接';
    deleteCurrentButton.addEventListener('click', function() {
        var currentLinks = extractMagnetLinks();
        deleteCurrentPageLinks(currentLinks);
        var textBox = document.getElementById('magnetLinksBox');
        textBox.value = getSavedMagnetLinks().join('\n');
    });

    // 创建一键复制按钮
    var copyButton = document.createElement('button');
    copyButton.id = 'copyLinksButton';
    copyButton.style.position = 'fixed';
    copyButton.style.bottom = '110px'; // 按钮悬浮在页面底部
    copyButton.style.right = '10px';
    copyButton.style.width = '100px';
    copyButton.style.height = '40px';
    copyButton.style.zIndex = '9999';
    copyButton.style.background = '#2196F3'; // 按钮背景颜色
    copyButton.style.color = 'white'; // 按钮文字颜色
    copyButton.style.border = 'none';
    copyButton.style.borderRadius = '5px';
    copyButton.style.cursor = 'pointer';
    copyButton.style.fontSize = '14px';
    copyButton.textContent = '一键复制';
    copyButton.addEventListener('click', function() {
        var textBox = document.getElementById('magnetLinksBox');
        // 获取文本框中的内容并去除序号
        var linksWithNumbers = textBox.value.split('\n');
        var plainLinks = linksWithNumbers.map(link => link.split('. ').slice(1).join('. ')).filter(link => link);
        textBox.value = plainLinks.join('\n');
        textBox.select();
        document.execCommand('copy');
        alert('已复制所有链接到剪贴板！');
        // 恢复文本框中的序号
        var savedLinks = getSavedMagnetLinks();
        textBox.value = savedLinks.map((link, index) => `${index + 1}. ${link}`).join('\n');
    });

    // 创建清除全部按钮
    var clearAllButton = document.createElement('button');
    clearAllButton.id = 'clearAllLinksButton';
    clearAllButton.style.position = 'fixed';
    clearAllButton.style.bottom = '160px'; // 按钮悬浮在页面底部
    clearAllButton.style.right = '10px';
    clearAllButton.style.width = '100px';
    clearAllButton.style.height = '40px';
    clearAllButton.style.zIndex = '9999';
    clearAllButton.style.background = '#F44336'; // 按钮背景颜色
    clearAllButton.style.color = 'white'; // 按钮文字颜色
    clearAllButton.style.border = 'none';
    clearAllButton.style.borderRadius = '5px';
    clearAllButton.style.cursor = 'pointer';
    clearAllButton.style.fontSize = '14px';
    clearAllButton.textContent = '清除全部';
    clearAllButton.addEventListener('click', function() {
        clearAllLinks();
        var textBox = document.getElementById('magnetLinksBox');
        textBox.value = '';
    });

    // 创建监测当前页面按钮
    var monitorCurrentButton = document.createElement('button');
    monitorCurrentButton.id = 'monitorCurrentLinksButton';
    monitorCurrentButton.style.position = 'fixed';
    monitorCurrentButton.style.bottom = '210px'; // 按钮悬浮在页面底部
    monitorCurrentButton.style.right = '10px';
    monitorCurrentButton.style.width = '100px';
    monitorCurrentButton.style.height = '40px';
    monitorCurrentButton.style.zIndex = '9999';
    monitorCurrentButton.style.background = '#008CBA'; // 按钮背景颜色
    monitorCurrentButton.style.color = 'white'; // 按钮文字颜色
    monitorCurrentButton.style.border = 'none';
    monitorCurrentButton.style.borderRadius = '5px';
    monitorCurrentButton.style.cursor = 'pointer';
    monitorCurrentButton.style.fontSize = '14px';
    monitorCurrentButton.textContent = '监测当前页面';
    monitorCurrentButton.addEventListener('click', function() {
        var newMagnetLinks = extractMagnetLinks();
        saveMagnetLinks(newMagnetLinks);
        var textBox = document.getElementById('magnetLinksBox');
        if (textBox.style.display !== 'none') {
            var savedLinks = getSavedMagnetLinks();
            textBox.value = savedLinks.map((link, index) => `${index + 1}. ${link}`).join('\n');
        }
    });

    // 将文本框和按钮添加到页面
    document.body.appendChild(textBox);
    document.body.appendChild(toggleButton); // 展开/关闭按钮
    document.body.appendChild(deleteCurrentButton); // 删除当前链接按钮
    document.body.appendChild(copyButton); // 一键复制按钮
    document.body.appendChild(clearAllButton); // 清除全部按钮
    document.body.appendChild(monitorCurrentButton); // 监测当前页面按钮

    // 检查是否隐藏按钮
    var hideButtons = GM_getValue('hideButtons', false);
    if (hideButtons) {
      toggleButton.style.display = 'none';
      deleteCurrentButton.style.display = 'none';
      copyButton.style.display = 'none';
      clearAllButton.style.display = 'none';
    }
  }

  // 设置菜单命令
  GM_registerMenuCommand('设置', function() {
    var hideButtons = GM_getValue('hideButtons', false);
    var version = GM_info.script.version; // 获取插件版本号
    var author = GM_info.script.author; // 获取插件作者信息
    var excludedSites = GM_getValue('excludedSites', ''); // 获取排除的网站列表
    var html = `
      <div style="padding: 30px; background-color: white; border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 2px 30px rgba(0, 0, 0, 0.1); width: 400px; height: 250px; font-size: 18px;">
        <h2>设置</h2>
        <p>作者: ${author}</p>
        <p>版本: ${version}</p>
        <label style="display: flex; align-items: center;">
          <span style="margin-right: 10px;">隐藏悬浮按钮</span>
          <label class="switch">
            <input type="checkbox" id="hideButtonsCheckbox" ${hideButtons ? 'checked' : ''}>
            <span class="slider round"></span>
          </label>
        </label>
        <br>
        <label style="display: flex; align-items: center;">
          <span style="margin-right: 10px;">排除的网站（每行一个URL）</span>
          <textarea id="excludedSitesTextarea" style="width: 300px; height: 100px;">${excludedSites}</textarea>
        </label>
        <br>
        <button id="saveSettingsButton" style="margin-top: 20px; padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">保存</button>
      </div>
    `;
    var div = document.createElement('div');
    div.innerHTML = html;
    div.style.position = 'fixed';
    div.style.top = '50%';
    div.style.left = '50%';
    div.style.transform = 'translate(-50%, -50%)';
    div.style.zIndex = '10000';
    document.body.appendChild(div);

    document.getElementById('saveSettingsButton').addEventListener('click', function() {
      var hideButtonsCheckbox = document.getElementById('hideButtonsCheckbox');
      GM_setValue('hideButtons', hideButtonsCheckbox.checked);
      var hideButtons = hideButtonsCheckbox.checked;
      var toggleButton = document.getElementById('toggleLinksBoxButton');
      var deleteCurrentButton = document.getElementById('deleteCurrentLinksButton');
      var copyButton = document.getElementById('copyLinksButton');
      var clearAllButton = document.getElementById('clearAllLinksButton');
      toggleButton.style.display = hideButtons ? 'none' : 'block';
      deleteCurrentButton.style.display = hideButtons ? 'none' : 'block';
      copyButton.style.display = hideButtons ? 'none' : 'block';
      clearAllButton.style.display = hideButtons ? 'none' : 'block';

      // 保存排除的网站列表
      var excludedSitesTextarea = document.getElementById('excludedSitesTextarea');
      GM_setValue('excludedSites', excludedSitesTextarea.value);

      document.body.removeChild(div);
    });
});

// 检查当前页面是否在排除的网站列表中
function isExcludedSite() {
    var currentUrl = window.location.href;
    var excludedSites = GM_getValue('excludedSites', '').split('\n').map(site => site.trim()).filter(site => site);
    for (var site of excludedSites) {
        if (currentUrl.startsWith(site)) {
            return true;
        }
    }
    return false;
}

// 主逻辑
if (!isExcludedSite()) {
    var magnetLinks = extractMagnetLinks();
    if (magnetLinks.length > 0) {
        saveMagnetLinks(magnetLinks);
    }
    createTextBoxAndButtons();

    // 添加键盘事件监听器
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.key === 'q') {
            var currentLinks = extractMagnetLinks();
            deleteCurrentPageLinks(currentLinks);
            var textBox = document.getElementById('magnetLinksBox');
            if (textBox.style.display !== 'none') {
                textBox.value = getSavedMagnetLinks().join('\n');
            }
        }
    });

    // 使用 MutationObserver 监听 DOM 变化
    var observer = new MutationObserver(function(mutationsList, observer) {
        for (var mutation of mutationsList) {
            if (mutation.type === 'childList' || mutation.type === 'attributes') {
                var newMagnetLinks = extractMagnetLinks();
                saveMagnetLinks(newMagnetLinks);
            }
        }
    });

    var config = { childList: true, subtree: true, attributes: true, characterData: true };
    observer.observe(document.body, config);

    // 确保每次页面加载时都提取并保存磁力链接
    setTimeout(function() {
        var newMagnetLinks = extractMagnetLinks();
        saveMagnetLinks(newMagnetLinks);
        var textBox = document.getElementById('magnetLinksBox');
        if (textBox.style.display !== 'none') {
            var savedLinks = getSavedMagnetLinks();
            textBox.value = savedLinks.map((link, index) => `${index + 1}. ${link}`).join('\n');
        }
    }, 3000); // 3秒后执行

}

})();
