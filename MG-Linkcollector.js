// ==UserScript==
// @name         MG-Linkcollector
// @namespace    http://tampermonkey.net/
// @version      2.1.2
// @description  提取页面中的磁力\Ed2k链接并收集到文本框中，支持跨网页收集，文本框内容实时更新。快捷键：监测当前页面（Alt+Q），删除当前链接（Alt+W），清除全部（Alt+A），一键复制（Alt+S），展开/关闭（无快捷键）。新增功能：自动获取新标签页的链接，聚焦页面超过2秒后再次自动获取。
// @author       黄萌萌可爱多
// @match        *://*/*
// @license      MIT
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
  'use strict';

  // 提取磁力链接和Ed2k链接
  function extractMagnetLinks() {
    var magnetLinks = [];
    var linkElements = document.getElementsByTagName('a');
    for (var i = 0; i < linkElements.length; i++) {
        var linkElement = linkElements[i];
        var link = linkElement.href;
        if (link.startsWith('magnet:') || link.startsWith('ed2k:')) {
            magnetLinks.push(link);
        }
    }
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    while (walker.nextNode()) {
        var node = walker.currentNode;
        var text = node.textContent.trim();
        if (text.startsWith('magnet:') || text.startsWith('ed2k:')) {
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
    var combinedLinks = Array.from(new Set([...savedLinks, ...magnetLinks]));
    try {
      localStorage.setItem('magnetLinks', JSON.stringify(combinedLinks));
    } catch (e) {
      if (e instanceof DOMException && e.code === 22) {
        console.warn('localStorage空间不足，正在清理旧数据...');
        var maxLinks = 100;
        if (combinedLinks.length > maxLinks) {
          combinedLinks = combinedLinks.slice(-maxLinks);
        }
        localStorage.setItem('magnetLinks', JSON.stringify(combinedLinks));
        console.log('清理完成，现在可以继续保存新数据。');
      } else {
        throw e;
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
    alert("已清除全部链接"); // 添加提醒
  }

  // 更新文本框内容
  function updateTextBox() {
    var textBox = document.getElementById('magnetLinksBox');
    var savedLinks = getSavedMagnetLinks();
    textBox.value = savedLinks.map((link, index) => `${index + 1}. ${link}`).join('\n');
  }

  // 创建文本框和悬浮按钮
  function createTextBoxAndButtons() {
    var textBox = document.createElement('textarea');
    textBox.id = 'magnetLinksBox';
    textBox.style.position = 'fixed';
    textBox.style.bottom = '170px';  // 从 200px 调整为 170px
    textBox.style.right = '10px';
    textBox.style.width = '300px';
    textBox.style.height = '200px';
    textBox.style.zIndex = '9999';
    textBox.placeholder = '提取的磁力链接将显示在这里...';
    textBox.readOnly = true; // 设置为只读
    document.body.appendChild(textBox);

    var buttonBaseStyle = {
      position: 'fixed',
      right: '10px',
      width: '70px', // 缩小30%
      height: '28px', // 缩小30%
      zIndex: '9999',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '10px', // 缩小字体以适应按钮
      marginBottom: '5px', // 按钮之间的间隔
      whiteSpace: 'nowrap' // 防止换行
    };

    var monitorCurrentButton = document.createElement('button');
    monitorCurrentButton.id = 'monitorCurrentLinksButton';
    monitorCurrentButton.title = '快捷键: Alt+Q';
    monitorCurrentButton.style.background = '#008CBA';
    monitorCurrentButton.style.color = 'white';
    Object.assign(monitorCurrentButton.style, buttonBaseStyle);
    monitorCurrentButton.style.bottom = '10px';
    monitorCurrentButton.textContent = '监测当前页面';
    monitorCurrentButton.addEventListener('click', function() {
      var newMagnetLinks = extractMagnetLinks();
      saveMagnetLinks(newMagnetLinks);
      updateTextBox();
    });
    document.body.appendChild(monitorCurrentButton);

    var deleteCurrentButton = document.createElement('button');
    deleteCurrentButton.id = 'deleteCurrentLinksButton';
    deleteCurrentButton.title = '快捷键: Alt+W';
    deleteCurrentButton.style.background = '#FF9800';
    deleteCurrentButton.style.color = 'white';
    Object.assign(deleteCurrentButton.style, buttonBaseStyle);
    deleteCurrentButton.style.bottom = '43px';
    deleteCurrentButton.textContent = '删除当前链接';
    deleteCurrentButton.addEventListener('click', function() {
      var currentLinks = extractMagnetLinks();
      deleteCurrentPageLinks(currentLinks);
      updateTextBox();
    });
    document.body.appendChild(deleteCurrentButton);

    var clearAllButton = document.createElement('button');
    clearAllButton.id = 'clearAllLinksButton';
    clearAllButton.title = '快捷键: Alt+A';
    clearAllButton.style.background = '#F44336';
    clearAllButton.style.color = 'white';
    Object.assign(clearAllButton.style, buttonBaseStyle);
    clearAllButton.style.bottom = '76px';
    clearAllButton.textContent = '清除全部';
    clearAllButton.addEventListener('click', function() {
      clearAllLinks();
      updateTextBox();
    });
    document.body.appendChild(clearAllButton);

    var copyButton = document.createElement('button');
    copyButton.id = 'copyLinksButton';
    copyButton.title = '快捷键: Alt+S';
    copyButton.style.background = '#2196F3';
    copyButton.style.color = 'white';
    Object.assign(copyButton.style, buttonBaseStyle);
    copyButton.style.bottom = '109px';
    copyButton.textContent = '一键复制';
    copyButton.addEventListener('click', function() {
      var savedLinks = getSavedMagnetLinks();
      GM_setClipboard(savedLinks.join('\n'), 'text');
      alert('已复制所有链接到剪贴板！');
    });
    document.body.appendChild(copyButton);

    var toggleButton = document.createElement('button');
    toggleButton.id = 'toggleLinksBoxButton';
    toggleButton.title = '展开/关闭';
    toggleButton.style.background = '#4CAF50';
    toggleButton.style.color = 'white';
    Object.assign(toggleButton.style, buttonBaseStyle);
    toggleButton.style.bottom = '142px';  // 保持原有按钮位置不变
    toggleButton.textContent = '展开/关闭';
    toggleButton.addEventListener('click', function() {
        var textBox = document.getElementById('magnetLinksBox');
        if (textBox.style.display === 'none') {
            textBox.style.display = 'block';
            GM_setValue('textBoxVisible', true);
        } else {
            textBox.style.display = 'none';
            GM_setValue('textBoxVisible', false);
        }
    });
    document.body.appendChild(toggleButton);
  }

  // 绑定快捷键
  function bindHotkeys() {
    document.addEventListener('keydown', function(event) {
      if (event.altKey) {
        switch (event.key.toLowerCase()) {
          case 'q':
            document.getElementById('monitorCurrentLinksButton').click();
            break;
          case 'w':
            document.getElementById('deleteCurrentLinksButton').click();
            break;
          case 'a':
            document.getElementById('clearAllLinksButton').click();
            break;
          case 's':
            document.getElementById('copyLinksButton').click();
            break;
        }
      }
    });
  }

  // 监听localStorage变化并更新文本框
  function setupStorageListener() {
    window.addEventListener('storage', function(event) {
      if (event.key === 'magnetLinks') {
        updateTextBox();
      }
    });
  }

  // 自动获取链接的逻辑
  function autoExtractLinks() {
    var newMagnetLinks = extractMagnetLinks();
    saveMagnetLinks(newMagnetLinks);
    updateTextBox();
  }

  // 监听窗口焦点变化
  function listenFocusEvents() {
    let lastFocusTime = Date.now();
    let isFocused = false;

    window.addEventListener('focus', function() {
      isFocused = true;
      let currentTime = Date.now();
      if (currentTime - lastFocusTime > 2000) { // 超过2秒
        autoExtractLinks();
      }
      lastFocusTime = currentTime;
    });

    window.addEventListener('blur', function() {
      isFocused = false;
    });
  }

  // 检查当前页面是否在允许的网站列表中
  function isAllowedSite() {
    var allowAllSites = GM_getValue('allowAllSites', true);
    if (allowAllSites) {
        return true;
    }
    var allowedSites = GM_getValue('allowedSites', '').split('\n').map(site => site.trim()).filter(site => site !== '');
    var currentUrl = window.location.href;
    for (var site of allowedSites) {
        if (currentUrl.startsWith(site)) {
            return true;
        }
    }
    return false;
  }

  // 油猴面板设置
  function setupSettings() {
    GM_registerMenuCommand('设置', function() {
      var hideButtons = GM_getValue('hideButtons', false);
      var version = GM_info.script.version;
      var author = GM_info.script.author;
      var allowedSites = GM_getValue('allowedSites', '');
    });
  }

  createTextBoxAndButtons();
  bindHotkeys();
  setupStorageListener();
  listenFocusEvents();
  if (isAllowedSite()) {
    autoExtractLinks();
  }
  setupSettings();

})();