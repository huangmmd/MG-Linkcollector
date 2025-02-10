// ==UserScript==
// @name         MG-Linkcollector
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  提取页面中的磁力\Ed2k链接并收集到文本框中，支持跨网页收集，文本框内容实时更新。快捷键：监测当前页面（Alt+Q），删除当前链接（Alt+W），清除全部（Alt+A），一键复制（Alt+S），展开/关闭（无快捷键）。
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

  // 提取磁力链接和Edk2链接
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
  }

  // 获取文本框的显示状态
  function getTextBoxDisplayState() {
    return localStorage.getItem('textBoxDisplayState') || 'none';
  }

  // 设置文本框的显示状态
  function setTextBoxDisplayState(state) {
    localStorage.setItem('textBoxDisplayState', state);
  }

  // 创建文本框和悬浮按钮
  function createTextBoxAndButtons() {
    var textBox = document.createElement('textarea');
    textBox.id = 'magnetLinksBox';
    textBox.style.position = 'fixed';
    textBox.style.bottom = '200px';
    textBox.style.right = '10px';
    textBox.style.width = '300px';
    textBox.style.height = '200px';
    textBox.style.zIndex = '9999';
    textBox.placeholder = '提取的磁力链接将显示在这里...';
    textBox.style.display = getTextBoxDisplayState(); // 根据保存的状态设置显示或隐藏

    var toggleButton = document.createElement('button');
    toggleButton.id = 'toggleLinksBoxButton';
    toggleButton.title = '快捷键: 无'; // 添加快捷键信息
    toggleButton.style.position = 'fixed';
    toggleButton.style.bottom = '10px';
    toggleButton.style.right = '10px';
    toggleButton.style.width = '100px';
    toggleButton.style.height = '40px';
    toggleButton.style.zIndex = '9999';
    toggleButton.style.background = '#4CAF50';
    toggleButton.style.color = 'white';
    toggleButton.style.border = 'none';
    toggleButton.style.borderRadius = '5px';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.fontSize = '14px';
    toggleButton.textContent = '展开/关闭';
    toggleButton.addEventListener('click', function() {
      var textBox = document.getElementById('magnetLinksBox');
      if (textBox.style.display === 'none') {
        var savedLinks = getSavedMagnetLinks();
        textBox.value = savedLinks.map((link, index) => `${index + 1}. ${link}`).join('\n');
        textBox.style.display = 'block';
        setTextBoxDisplayState('block'); // 保存显示状态
      } else {
        textBox.style.display = 'none';
        setTextBoxDisplayState('none'); // 保存隐藏状态
      }
    });

    var deleteCurrentButton = document.createElement('button');
    deleteCurrentButton.id = 'deleteCurrentLinksButton';
    deleteCurrentButton.title = '快捷键: Alt+W'; // 添加快捷键信息
    deleteCurrentButton.style.position = 'fixed';
    deleteCurrentButton.style.bottom = '60px';
    deleteCurrentButton.style.right = '10px';
    deleteCurrentButton.style.width = '100px';
    deleteCurrentButton.style.height = '40px';
    deleteCurrentButton.style.zIndex = '9999';
    deleteCurrentButton.style.background = '#FF9800';
    deleteCurrentButton.style.color = 'white';
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

    var copyButton = document.createElement('button');
    copyButton.id = 'copyLinksButton';
    copyButton.title = '快捷键: Alt+S'; // 添加快捷键信息
    copyButton.style.position = 'fixed';
    copyButton.style.bottom = '110px';
    copyButton.style.right = '10px';
    copyButton.style.width = '100px';
    copyButton.style.height = '40px';
    copyButton.style.zIndex = '9999';
    copyButton.style.background = '#2196F3';
    copyButton.style.color = 'white';
    copyButton.style.border = 'none';
    copyButton.style.borderRadius = '5px';
    copyButton.style.cursor = 'pointer';
    copyButton.style.fontSize = '14px';
    copyButton.textContent = '一键复制';
    copyButton.addEventListener('click', function() {
      var textBox = document.getElementById('magnetLinksBox');
      var linksWithNumbers = textBox.value.split('\n');
      var plainLinks = linksWithNumbers.map(link => link.split('. ').slice(1).join('. ')).filter(link => link);
      textBox.value = plainLinks.join('\n');
      textBox.select();
      document.execCommand('copy');
      alert('已复制所有链接到剪贴板！');
      var savedLinks = getSavedMagnetLinks();
      textBox.value = savedLinks.map((link, index) => `${index + 1}. ${link}`).join('\n');
    });

    var clearAllButton = document.createElement('button');
    clearAllButton.id = 'clearAllLinksButton';
    clearAllButton.title = '快捷键: Alt+A'; // 添加快捷键信息
    clearAllButton.style.position = 'fixed';
    clearAllButton.style.bottom = '160px';
    clearAllButton.style.right = '10px';
    clearAllButton.style.width = '100px';
    clearAllButton.style.height = '40px';
    clearAllButton.style.zIndex = '9999';
    clearAllButton.style.background = '#F44336';
    clearAllButton.style.color = 'white';
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

    var monitorCurrentButton = document.createElement('button');
    monitorCurrentButton.id = 'monitorCurrentLinksButton';
    monitorCurrentButton.title = '快捷键: Alt+Q'; // 添加快捷键信息
    monitorCurrentButton.style.position = 'fixed';
    monitorCurrentButton.style.bottom = '210px';
    monitorCurrentButton.style.right = '10px';
    monitorCurrentButton.style.width = '100px';
    monitorCurrentButton.style.height = '40px';
    monitorCurrentButton.style.zIndex = '9999';
    monitorCurrentButton.style.background = '#008CBA';
    monitorCurrentButton.style.color = 'white';
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

    document.body.appendChild(textBox);
    document.body.appendChild(toggleButton);
    document.body.appendChild(deleteCurrentButton);
    document.body.appendChild(copyButton);
    document.body.appendChild(clearAllButton);
    document.body.appendChild(monitorCurrentButton);
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

  // 检查当前页面是否在允许的网站列表中
  function isAllowedSite() {
    var currentUrl = window.location.href;
    var allowedSites = GM_getValue('allowedSites', '').split('\n').map(site => site.trim()).filter(site => site);
    var allowAllSites = GM_getValue('allowAllSites', true);

    if (allowAllSites) {
      return true;
    }

    for (var site of allowedSites) {
      if (currentUrl.startsWith(site)) {
        return true;
      }
    }
    return false;
  }

  // 设置菜单命令
  GM_registerMenuCommand('设置', function() {
    var hideButtons = GM_getValue('hideButtons', false);
    var version = GM_info.script.version; // 获取插件版本号
    var author = GM_info.script.author; // 获取插件作者信息
    var allowedSites = GM_getValue('allowedSites', ''); // 获取允许的网站列表
    var allowAllSites = GM_getValue('allowAllSites', true); // 默认允许所有网站

    var html = `
      <div style="padding: 30px; background-color: white; border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 2px 30px rgba(0, 0, 0, 0.1); width: 400px; height: 300px; font-size: 18px;">
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
          <span style="margin-right: 10px;">允许适用脚本于任何网站</span>
          <label class="switch">
            <input type="checkbox" id="allowAllSitesCheckbox" ${allowAllSites ? 'checked' : ''}>
            <span class="slider round"></span>
          </label>
        </label>
        <br>
        <label style="display: flex; align-items: center;">
          <span style="margin-right: 10px;">仅允许用该脚本的网站（每行一个URL）</span>
          <textarea id="allowedSitesTextarea" style="width: 300px; height: 100px;">${allowedSites}</textarea>
        </label>
        <br>
        <button id="saveSettingsButton" style="margin-top: 20px; padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">保存</button>
        <button id="closeSettingsButton" style="margin-top: 10px; padding: 10px 20px; background-color: #F44336; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">关闭</button>
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

      var allowAllSitesCheckbox = document.getElementById('allowAllSitesCheckbox');
      GM_setValue('allowAllSites', allowAllSitesCheckbox.checked);

      var allowedSitesTextarea = document.getElementById('allowedSitesTextarea');
      GM_setValue('allowedSites', allowedSitesTextarea.value);

      // 更新按钮显示状态
      var toggleButton = document.getElementById('toggleLinksBoxButton');
      var deleteCurrentButton = document.getElementById('deleteCurrentLinksButton');
      var copyButton = document
            var clearAllButton = document.getElementById('clearAllLinksButton');
      var monitorCurrentButton = document.getElementById('monitorCurrentLinksButton');
      if (hideButtonsCheckbox.checked) {
        toggleButton.style.display = 'none';
        deleteCurrentButton.style.display = 'none';
        copyButton.style.display = 'none';
        clearAllButton.style.display = 'none';
        monitorCurrentButton.style.display = 'none';
      } else {
        toggleButton.style.display = 'block';
        deleteCurrentButton.style.display = 'block';
        copyButton.style.display = 'block';
        clearAllButton.style.display = 'block';
        monitorCurrentButton.style.display = 'block';
      }

      // 关闭设置菜单
      document.body.removeChild(div);
    });

    document.getElementById('closeSettingsButton').addEventListener('click', function() {
      document.body.removeChild(div);
    });
  });

  // 主逻辑
  if (isAllowedSite()) {
    createTextBoxAndButtons();
    bindHotkeys();
  }
})();