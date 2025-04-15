import React, { useState, useEffect } from 'react';
import gameState from '../modules/game_state';
import llmAdapter, { LLMProvider, ModelType } from '../modules/llm_adapter';

/**
 * 设置面板组件
 * 用于配置游戏和LLM参数
 * @param {Object} props - 组件属性
 * @param {Function} props.onResetGame - 重置游戏的回调函数
 * @param {Function} props.onExportGame - 导出游戏的回调函数
 * @param {Function} props.onImportGame - 导入游戏的回调函数
 */
const SettingsPanel = ({ onResetGame, onExportGame, onImportGame }) => {
  // 状态
  const [llmConfig, setLLMConfig] = useState({});
  const [gameConfig, setGameConfig] = useState({});
  const [activeTab, setActiveTab] = useState('llm'); // llm, game, interface, data
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now()); // 用于重置文件输入

  // 加载配置
  useEffect(() => {
    loadConfigurations();
  }, []);

  // 加载配置
  const loadConfigurations = () => {
    // 加载LLM配置
    const llmConfigData = llmAdapter.getConfig();
    setLLMConfig(llmConfigData);
    
    // 加载游戏配置
    const state = gameState.getState();
    setGameConfig({
      maxHistoryLength: state.maxHistoryLength || 100,
      autoSave: state.autoSave !== false,
      autoSaveInterval: state.autoSaveInterval || 5,
      debugMode: state.debugMode || false
    });
  };

  // 处理LLM配置变更
  const handleLLMConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setLLMConfig({
      ...llmConfig,
      [name]: type === 'checkbox' ? checked : (
        type === 'number' ? Number(value) : value
      )
    });
  };

  // 处理游戏配置变更
  const handleGameConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setGameConfig({
      ...gameConfig,
      [name]: type === 'checkbox' ? checked : (
        type === 'number' ? Number(value) : value
      )
    });
  };

  // 保存LLM配置
  const handleSaveLLMConfig = () => {
    try {
      llmAdapter.updateConfig(llmConfig);
      alert('LLM配置已保存');
    } catch (error) {
      console.error('保存LLM配置失败:', error);
      alert(`保存失败: ${error.message}`);
    }
  };

  // 保存游戏配置
  const handleSaveGameConfig = () => {
    try {
      gameState.updateState({
        maxHistoryLength: gameConfig.maxHistoryLength,
        autoSave: gameConfig.autoSave,
        autoSaveInterval: gameConfig.autoSaveInterval,
        debugMode: gameConfig.debugMode
      });
      alert('游戏配置已保存');
    } catch (error) {
      console.error('保存游戏配置失败:', error);
      alert(`保存失败: ${error.message}`);
    }
  };

  // 测试LLM连接
  const handleTestConnection = async () => {
    try {
      setIsTestingConnection(true);
      setConnectionStatus(null);
      
      // 临时应用配置
      const tempConfig = { ...llmConfig };
      llmAdapter.updateConfig(tempConfig);
      
      // 测试连接
      const isConnected = await llmAdapter.checkConnection();
      
      setConnectionStatus(isConnected ? 'success' : 'error');
    } catch (error) {
      console.error('测试连接失败:', error);
      setConnectionStatus('error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  // 处理文件导入
  const handleFileImport = (e) => {
    if (onImportGame) {
      onImportGame(e);
      // 重置文件输入
      setFileInputKey(Date.now());
    }
  };

  // 渲染LLM设置标签页
  const renderLLMTab = () => {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">LLM设置</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              提供商
            </label>
            <select
              name="provider"
              value={llmConfig.provider || LLMProvider.OPENAI}
              onChange={handleLLMConfigChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
            >
              <option value={LLMProvider.OPENAI}>OpenAI</option>
              <option value={LLMProvider.LOCAL}>本地模型</option>
              <option value={LLMProvider.MOCK}>模拟模式</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              模型
            </label>
            <input
              type="text"
              name="model"
              value={llmConfig.model || ''}
              onChange={handleLLMConfigChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
              placeholder="例如: gpt-3.5-turbo"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              模型类型
            </label>
            <select
              name="modelType"
              value={llmConfig.modelType || ModelType.CHAT}
              onChange={handleLLMConfigChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
            >
              <option value={ModelType.CHAT}>聊天模型</option>
              <option value={ModelType.COMPLETION}>文本补全模型</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              API密钥
            </label>
            <input
              type="password"
              name="apiKey"
              value={llmConfig.apiKey || ''}
              onChange={handleLLMConfigChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
              placeholder="输入你的API密钥"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              API端点 (可选)
            </label>
            <input
              type="text"
              name="apiEndpoint"
              value={llmConfig.apiEndpoint || ''}
              onChange={handleLLMConfigChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
              placeholder="例如: https://api.openai.com/v1"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              温度 (0-1)
            </label>
            <input
              type="range"
              name="temperature"
              min="0"
              max="1"
              step="0.1"
              value={llmConfig.temperature || 0.7}
              onChange={handleLLMConfigChange}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>更确定 (0)</span>
              <span>{llmConfig.temperature || 0.7}</span>
              <span>更随机 (1)</span>
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              最大令牌数
            </label>
            <input
              type="number"
              name="maxTokens"
              value={llmConfig.maxTokens || 1000}
              onChange={handleLLMConfigChange}
              min="100"
              max="8000"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
            />
          </div>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="useProxy"
                checked={llmConfig.useProxy || false}
                onChange={handleLLMConfigChange}
                className="mr-2"
              />
              <span className="text-gray-700 dark:text-gray-300">使用代理</span>
            </label>
          </div>
          
          {llmConfig.useProxy && (
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                代理URL
              </label>
              <input
                type="text"
                name="proxyUrl"
                value={llmConfig.proxyUrl || ''}
                onChange={handleLLMConfigChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                placeholder="例如: http://localhost:8080/"
              />
            </div>
          )}
          
          <div className="flex space-x-2">
            <button
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
              onClick={handleSaveLLMConfig}
            >
              保存配置
            </button>
            <button
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              onClick={handleTestConnection}
              disabled={isTestingConnection}
            >
              {isTestingConnection ? '测试中...' : '测试连接'}
            </button>
          </div>
          
          {connectionStatus && (
            <div className={`p-3 rounded ${
              connectionStatus === 'success' 
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
            }`}>
              {connectionStatus === 'success' 
                ? '连接成功！LLM API可用。' 
                : '连接失败。请检查你的API密钥和设置。'}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 渲染游戏设置标签页
  const renderGameTab = () => {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">游戏设置</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              最大历史记录长度
            </label>
            <input
              type="number"
              name="maxHistoryLength"
              value={gameConfig.maxHistoryLength || 100}
              onChange={handleGameConfigChange}
              min="10"
              max="1000"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
            />
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              保存在内存中的最大历史记录数量
            </div>
          </div>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="autoSave"
                checked={gameConfig.autoSave !== false}
                onChange={handleGameConfigChange}
                className="mr-2"
              />
              <span className="text-gray-700 dark:text-gray-300">启用自动保存</span>
            </label>
          </div>
          
          {gameConfig.autoSave !== false && (
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                自动保存间隔（分钟）
              </label>
              <input
                type="number"
                name="autoSaveInterval"
                value={gameConfig.autoSaveInterval || 5}
                onChange={handleGameConfigChange}
                min="1"
                max="60"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
              />
            </div>
          )}
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="debugMode"
                checked={gameConfig.debugMode || false}
                onChange={handleGameConfigChange}
                className="mr-2"
              />
              <span className="text-gray-700 dark:text-gray-300">调试模式</span>
            </label>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              启用额外的日志和调试信息
            </div>
          </div>
          
          <button
            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
            onClick={handleSaveGameConfig}
          >
            保存配置
          </button>
        </div>
      </div>
    );
  };

  // 渲染界面设置标签页
  const renderInterfaceTab = () => {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">界面设置</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              主题
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={document.documentElement.classList.contains('dark') === false}
                  onChange={() => {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('darkMode', 'false');
                  }}
                  className="mr-2"
                />
                <span className="text-gray-700 dark:text-gray-300">亮色</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={document.documentElement.classList.contains('dark') === true}
                  onChange={() => {
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('darkMode', 'true');
                  }}
                  className="mr-2"
                />
                <span className="text-gray-700 dark:text-gray-300">暗色</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="theme"
                  value="system"
                  checked={localStorage.getItem('darkMode') === null}
                  onChange={() => {
                    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (isDark) {
                      document.documentElement.classList.add('dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                    }
                    localStorage.removeItem('darkMode');
                  }}
                  className="mr-2"
                />
                <span className="text-gray-700 dark:text-gray-300">跟随系统</span>
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              字体大小
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
              onChange={(e) => {
                document.documentElement.style.fontSize = e.target.value;
                localStorage.setItem('fontSize', e.target.value);
              }}
              value={localStorage.getItem('fontSize') || '16px'}
            >
              <option value="14px">小</option>
              <option value="16px">中</option>
              <option value="18px">大</option>
              <option value="20px">特大</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  // 渲染数据管理标签页
  const renderDataTab = () => {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">数据管理</h2>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <h3 className="font-medium mb-2">导出游戏数据</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              导出当前游戏的所有数据，包括游戏状态、历史记录和角色信息。
            </p>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={onExportGame}
            >
              导出数据
            </button>
          </div>
          
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <h3 className="font-medium mb-2">导入游戏数据</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              从文件导入游戏数据，将覆盖当前的游戏状态。
            </p>
            <label className="inline-block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer">
              选择文件
              <input
                type="file"
                className="hidden"
                accept=".json"
                onChange={handleFileImport}
                key={fileInputKey}
              />
            </label>
          </div>
          
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <h3 className="font-medium mb-2">重置游戏</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              重置游戏到初始状态，将删除所有进度。此操作不可撤销。
            </p>
            <button
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              onClick={onResetGame}
            >
              重置游戏
            </button>
          </div>
          
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <h3 className="font-medium mb-2">清除本地存储</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              清除浏览器中保存的所有游戏数据。此操作不可撤销。
            </p>
            <button
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              onClick={() => {
                if (window.confirm('确定要清除所有本地存储数据吗？此操作不可撤销。')) {
                  localStorage.clear();
                  alert('本地存储已清除。请刷新页面。');
                }
              }}
            >
              清除存储
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-6">设置</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* 标签页导航 */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex">
            <button
              className={`px-4 py-2 ${
                activeTab === 'llm' 
                  ? 'border-b-2 border-indigo-500 text-indigo-500' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('llm')}
            >
              LLM设置
            </button>
            <button
              className={`px-4 py-2 ${
                activeTab === 'game' 
                  ? 'border-b-2 border-indigo-500 text-indigo-500' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('game')}
            >
              游戏设置
            </button>
            <button
              className={`px-4 py-2 ${
                activeTab === 'interface' 
                  ? 'border-b-2 border-indigo-500 text-indigo-500' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('interface')}
            >
              界面设置
            </button>
            <button
              className={`px-4 py-2 ${
                activeTab === 'data' 
                  ? 'border-b-2 border-indigo-500 text-indigo-500' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('data')}
            >
              数据管理
            </button>
          </nav>
        </div>
        
        {/* 标签页内容 */}
        <div className="p-6">
          {activeTab === 'llm' && renderLLMTab()}
          {activeTab === 'game' && renderGameTab()}
          {activeTab === 'interface' && renderInterfaceTab()}
          {activeTab === 'data' && renderDataTab()}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
