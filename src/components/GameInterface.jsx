import React, { useState, useEffect } from 'react';
import TRPGActionPanel from './TRPGActionPanel';
import ResponseDisplay from './ResponseDisplay';
import GameStateDisplay from './GameStateDisplay';
import CharacterPanel from './CharacterPanel';
import WorldBookPanel from './WorldBookPanel';
import SettingsPanel from './SettingsPanel';
import gameState from '../modules/game_state';
import historyManager from '../modules/history';
import agentRegistry from '../modules/agent_registry';
import transition from '../modules/transition';
import agentPolicy from '../modules/agent_policy';

/**
 * 游戏主界面组件
 * 整合所有游戏功能的中央界面
 */
const GameInterface = () => {
  // 状态
  const [currentTab, setCurrentTab] = useState('game'); // game, characters, worldbook, settings
  const [gameStateData, setGameStateData] = useState(gameState.getState());
  const [history, setHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [systemMessage, setSystemMessage] = useState('');
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true' || 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  // 初始化
  useEffect(() => {
    // 加载游戏状态
    gameState.initialize();
    setGameStateData(gameState.getState());
    
    // 加载历史记录
    historyManager.loadFromLocalStorage();
    setHistory(historyManager.getRecentHistory(20));
    
    // 初始化角色注册表
    agentRegistry.initialize();
    
    // 监听游戏状态变化
    const handleStateChange = () => {
      setGameStateData({...gameState.getState()});
    };
    
    // 监听历史记录变化
    const handleHistoryChange = () => {
      setHistory(historyManager.getRecentHistory(20));
    };
    
    // 添加事件监听
    window.addEventListener('gameStateChanged', handleStateChange);
    window.addEventListener('historyChanged', handleHistoryChange);
    
    // 清理函数
    return () => {
      window.removeEventListener('gameStateChanged', handleStateChange);
      window.removeEventListener('historyChanged', handleHistoryChange);
    };
  }, []);

  // 处理暗黑模式切换
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  /**
   * 处理行为提交
   * @param {Object} action - 行为对象
   */
  const handleActionSubmit = async (action) => {
    try {
      setIsProcessing(true);
      setSystemMessage('处理中...');
      
      // 添加行为到历史记录
      historyManager.addActionEntry(action);
      
      // 应用状态转移
      const newState = transition.applyTransition(action);
      
      // 生成NPC响应
      const responses = await agentPolicy.generateSceneResponses(action);
      
      // 将响应添加到历史记录
      responses.forEach(({ agentId, response }) => {
        if (response.type === 'dialogue') {
          historyManager.addNPCResponseEntry(agentId, response.content, {
            emotion: response.emotion,
            intensity: response.emotionIntensity
          });
        }
      });
      
      // 保存历史记录
      historyManager.saveToLocalStorage();
      
      setSystemMessage('');
    } catch (error) {
      console.error('处理行为失败:', error);
      setSystemMessage(`错误: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * 处理游戏重置
   */
  const handleResetGame = () => {
    if (window.confirm('确定要重置游戏吗？这将清除所有进度。')) {
      gameState.reset();
      historyManager.clearHistory();
      setGameStateData({...gameState.getState()});
      setHistory([]);
      setSystemMessage('游戏已重置');
    }
  };

  /**
   * 处理游戏保存
   */
  const handleSaveGame = () => {
    try {
      // 保存游戏状态
      gameState.saveToLocalStorage();
      
      // 保存历史记录
      historyManager.saveToLocalStorage();
      
      setSystemMessage('游戏已保存');
      
      // 3秒后清除消息
      setTimeout(() => {
        setSystemMessage('');
      }, 3000);
    } catch (error) {
      console.error('保存游戏失败:', error);
      setSystemMessage(`保存失败: ${error.message}`);
    }
  };

  /**
   * 处理游戏导出
   */
  const handleExportGame = () => {
    try {
      // 导出游戏数据
      const exportData = {
        gameState: gameState.exportState(),
        history: historyManager.exportHistory(),
        agents: agentRegistry.exportAgents()
      };
      
      // 创建下载链接
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const exportFileDefaultName = `ai_trpg_save_${new Date().toISOString().slice(0, 10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      setSystemMessage('游戏已导出');
      
      // 3秒后清除消息
      setTimeout(() => {
        setSystemMessage('');
      }, 3000);
    } catch (error) {
      console.error('导出游戏失败:', error);
      setSystemMessage(`导出失败: ${error.message}`);
    }
  };

  /**
   * 处理游戏导入
   * @param {Event} event - 文件输入事件
   */
  const handleImportGame = (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target.result);
          
          // 导入游戏状态
          if (importData.gameState) {
            gameState.importState(importData.gameState);
            setGameStateData({...gameState.getState()});
          }
          
          // 导入历史记录
          if (importData.history) {
            historyManager.importHistory(importData.history);
            setHistory(historyManager.getRecentHistory(20));
          }
          
          // 导入角色
          if (importData.agents) {
            agentRegistry.importAgents(importData.agents);
          }
          
          setSystemMessage('游戏已导入');
          
          // 3秒后清除消息
          setTimeout(() => {
            setSystemMessage('');
          }, 3000);
        } catch (error) {
          console.error('解析导入数据失败:', error);
          setSystemMessage(`导入失败: ${error.message}`);
        }
      };
      
      reader.onerror = () => {
        setSystemMessage('读取文件失败');
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('导入游戏失败:', error);
      setSystemMessage(`导入失败: ${error.message}`);
    } finally {
      // 清除文件输入
      event.target.value = null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* 顶部导航栏 */}
      <header className="bg-indigo-600 dark:bg-indigo-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">AI TRPG 系统</h1>
          
          {/* 导航标签 */}
          <nav className="flex space-x-4">
            <button 
              className={`px-3 py-1 rounded-md ${currentTab === 'game' ? 'bg-indigo-800 dark:bg-indigo-700' : 'hover:bg-indigo-700 dark:hover:bg-indigo-600'}`}
              onClick={() => setCurrentTab('game')}
            >
              游戏
            </button>
            <button 
              className={`px-3 py-1 rounded-md ${currentTab === 'characters' ? 'bg-indigo-800 dark:bg-indigo-700' : 'hover:bg-indigo-700 dark:hover:bg-indigo-600'}`}
              onClick={() => setCurrentTab('characters')}
            >
              角色
            </button>
            <button 
              className={`px-3 py-1 rounded-md ${currentTab === 'worldbook' ? 'bg-indigo-800 dark:bg-indigo-700' : 'hover:bg-indigo-700 dark:hover:bg-indigo-600'}`}
              onClick={() => setCurrentTab('worldbook')}
            >
              世界书
            </button>
            <button 
              className={`px-3 py-1 rounded-md ${currentTab === 'settings' ? 'bg-indigo-800 dark:bg-indigo-700' : 'hover:bg-indigo-700 dark:hover:bg-indigo-600'}`}
              onClick={() => setCurrentTab('settings')}
            >
              设置
            </button>
          </nav>
          
          {/* 工具栏 */}
          <div className="flex items-center space-x-2">
            <button 
              className="p-2 rounded-full hover:bg-indigo-700 dark:hover:bg-indigo-600"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? "切换到亮色模式" : "切换到暗色模式"}
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
            <button 
              className="p-2 rounded-full hover:bg-indigo-700 dark:hover:bg-indigo-600"
              onClick={handleSaveGame}
              title="保存游戏"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      
      {/* 系统消息 */}
      {systemMessage && (
        <div className="bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500 text-blue-700 dark:text-blue-200 p-4">
          <p>{systemMessage}</p>
        </div>
      )}
      
      {/* 主要内容区域 */}
      <main className="flex-grow flex overflow-hidden">
        {/* 游戏界面 */}
        {currentTab === 'game' && (
          <div className="flex flex-col md:flex-row w-full h-full overflow-hidden">
            {/* 左侧：游戏状态和历史记录 */}
            <div className="w-full md:w-1/3 p-4 overflow-y-auto border-r border-gray-200 dark:border-gray-700">
              <GameStateDisplay gameState={gameStateData} />
            </div>
            
            {/* 右侧：响应显示和行为输入 */}
            <div className="w-full md:w-2/3 flex flex-col h-full">
              {/* 响应显示区域 */}
              <div className="flex-grow p-4 overflow-y-auto">
                <ResponseDisplay history={history} />
              </div>
              
              {/* 行为输入区域 */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <TRPGActionPanel 
                  onSubmit={handleActionSubmit} 
                  disabled={isProcessing}
                  gameState={gameStateData}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* 角色面板 */}
        {currentTab === 'characters' && (
          <div className="w-full h-full overflow-y-auto p-4">
            <CharacterPanel />
          </div>
        )}
        
        {/* 世界书面板 */}
        {currentTab === 'worldbook' && (
          <div className="w-full h-full overflow-y-auto p-4">
            <WorldBookPanel />
          </div>
        )}
        
        {/* 设置面板 */}
        {currentTab === 'settings' && (
          <div className="w-full h-full overflow-y-auto p-4">
            <SettingsPanel 
              onResetGame={handleResetGame}
              onExportGame={handleExportGame}
              onImportGame={handleImportGame}
            />
          </div>
        )}
      </main>
      
      {/* 底部状态栏 */}
      <footer className="bg-gray-200 dark:bg-gray-800 p-2 text-sm text-gray-600 dark:text-gray-400">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            游戏ID: {gameStateData.gameId} | 回合: {gameStateData.turn} | 阶段: {gameStateData.phase}
          </div>
          <div>
            {new Date().toLocaleString()}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GameInterface;
