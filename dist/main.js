// 暗黑模式切换
const darkModeToggle = document.getElementById('dark-mode-toggle');
if (darkModeToggle) {
  darkModeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const isDarkMode = document.documentElement.classList.contains('dark');
    localStorage.setItem('darkMode', isDarkMode.toString());
  });
}

// 检测系统暗黑模式偏好
if (localStorage.getItem('darkMode') === 'true' || 
    (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
}

// 标签页切换
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('.tab-panel');

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    // 移除所有标签页的活跃状态
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabPanels.forEach(panel => panel.classList.remove('active'));
    
    // 设置当前标签页为活跃状态
    button.classList.add('active');
    const tabId = button.getAttribute('data-tab');
    document.getElementById(`${tabId}-panel`).classList.add('active');
  });
});

// 发送行动
const actionInput = document.getElementById('action-input');
const sendActionButton = document.getElementById('send-action');
const responseDisplay = document.querySelector('.response-display');

if (sendActionButton && actionInput && responseDisplay) {
  sendActionButton.addEventListener('click', () => {
    const actionText = actionInput.value.trim();
    if (actionText) {
      // 创建玩家消息
      const playerMessage = document.createElement('div');
      playerMessage.className = 'message player-message';
      
      const messageHeader = document.createElement('div');
      messageHeader.className = 'message-header';
      
      const playerName = document.createElement('span');
      playerName.className = 'player-name';
      playerName.textContent = '玩家';
      
      const messageContent = document.createElement('p');
      messageContent.textContent = actionText;
      
      messageHeader.appendChild(playerName);
      playerMessage.appendChild(messageHeader);
      playerMessage.appendChild(messageContent);
      
      responseDisplay.appendChild(playerMessage);
      
      // 清空输入框
      actionInput.value = '';
      
      // 滚动到底部
      responseDisplay.scrollTop = responseDisplay.scrollHeight;
      
      // 模拟NPC回复
      setTimeout(() => {
        const npcMessage = document.createElement('div');
        npcMessage.className = 'message npc-message';
        
        const npcHeader = document.createElement('div');
        npcHeader.className = 'message-header';
        
        const npcName = document.createElement('span');
        npcName.className = 'npc-name';
        npcName.textContent = '旅店老板';
        
        const npcContent = document.createElement('p');
        npcContent.textContent = '哦？那个传言啊...据说山里的古老神殿中藏着一件宝物，能够实现持有者的愿望。不过，已经有很多冒险者进去后再也没有回来过。我劝你还是好好休息，不要去冒这个险。';
        
        npcHeader.appendChild(npcName);
        npcMessage.appendChild(npcHeader);
        npcMessage.appendChild(npcContent);
        
        responseDisplay.appendChild(npcMessage);
        
        // 滚动到底部
        responseDisplay.scrollTop = responseDisplay.scrollHeight;
      }, 1000);
    }
  });
}

// 快捷行动选项
const actionOptions = document.querySelectorAll('.action-option');
if (actionOptions.length > 0) {
  actionOptions.forEach(option => {
    option.addEventListener('click', () => {
      if (actionInput) {
        actionInput.value = option.textContent;
        actionInput.focus();
      }
    });
  });
}
