import React, { useState } from 'react';

/**
 * 游戏状态显示组件
 * 显示当前游戏状态信息
 * @param {Object} props - 组件属性
 * @param {Object} props.gameState - 游戏状态对象
 */
const GameStateDisplay = ({ gameState = {} }) => {
  // 状态
  const [expandedSection, setExpandedSection] = useState('player');

  /**
   * 切换展开的部分
   * @param {string} section - 部分名称
   */
  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  /**
   * 渲染玩家信息
   * @returns {JSX.Element} 玩家信息组件
   */
  const renderPlayerInfo = () => {
    const player = gameState.player || {};
    
    return (
      <div className="mb-4">
        <button
          className="flex justify-between items-center w-full p-2 bg-indigo-100 dark:bg-indigo-900 rounded-md"
          onClick={() => toggleSection('player')}
        >
          <h3 className="text-lg font-semibold">玩家信息</h3>
          <svg
            className={`w-5 h-5 transition-transform ${expandedSection === 'player' ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        {expandedSection === 'player' && (
          <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm">
            <div className="mb-2">
              <span className="font-semibold">名称:</span> {player.name || '未命名'}
            </div>
            {player.description && (
              <div className="mb-2">
                <span className="font-semibold">描述:</span> {player.description}
              </div>
            )}
            {player.location && (
              <div className="mb-2">
                <span className="font-semibold">位置:</span> {player.location}
              </div>
            )}
            
            {/* 显示玩家物品栏 */}
            {player.inventory && player.inventory.length > 0 && (
              <div className="mt-3">
                <h4 className="font-semibold mb-1">物品栏:</h4>
                <ul className="list-disc list-inside">
                  {player.inventory.map((item, index) => (
                    <li key={index}>{item.name || item.id}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* 显示玩家状态效果 */}
            {player.status && player.status.length > 0 && (
              <div className="mt-3">
                <h4 className="font-semibold mb-1">状态效果:</h4>
                <ul className="list-disc list-inside">
                  {player.status.map((status, index) => (
                    <li key={index}>{status.name}: {status.description}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  /**
   * 渲染环境信息
   * @returns {JSX.Element} 环境信息组件
   */
  const renderEnvironmentInfo = () => {
    const environment = gameState.environment || {};
    const currentLocation = environment.currentLocation;
    const location = currentLocation && environment.locations ? 
      environment.locations[currentLocation] : null;
    
    return (
      <div className="mb-4">
        <button
          className="flex justify-between items-center w-full p-2 bg-green-100 dark:bg-green-900 rounded-md"
          onClick={() => toggleSection('environment')}
        >
          <h3 className="text-lg font-semibold">环境信息</h3>
          <svg
            className={`w-5 h-5 transition-transform ${expandedSection === 'environment' ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        {expandedSection === 'environment' && (
          <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm">
            {location ? (
              <>
                <div className="mb-2">
                  <span className="font-semibold">当前位置:</span> {location.name || currentLocation}
                </div>
                {location.description && (
                  <div className="mb-2">
                    <span className="font-semibold">描述:</span> {location.description}
                  </div>
                )}
                
                {/* 显示位置中的物体 */}
                {location.objects && location.objects.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-semibold mb-1">物体:</h4>
                    <ul className="list-disc list-inside">
                      {location.objects.map((object, index) => (
                        <li key={index}>{object.name || object.id}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* 显示可用出口 */}
                {location.exits && Object.keys(location.exits).length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-semibold mb-1">出口:</h4>
                    <ul className="list-disc list-inside">
                      {Object.entries(location.exits).map(([direction, exit]) => (
                        <li key={direction}>
                          {direction}: {typeof exit === 'string' ? exit : exit.target}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray-500 dark:text-gray-400">
                没有当前位置信息
              </div>
            )}
            
            {/* 显示时间和天气 */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="mb-1">
                <span className="font-semibold">时间:</span> {environment.currentTime || '未知'}
              </div>
              <div>
                <span className="font-semibold">天气:</span> {environment.currentWeather || '未知'}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  /**
   * 渲染NPC信息
   * @returns {JSX.Element} NPC信息组件
   */
  const renderNPCInfo = () => {
    const agents = gameState.agents || [];
    const currentLocation = gameState.environment?.currentLocation;
    
    // 过滤当前位置的NPC
    const npcsInLocation = currentLocation ? 
      agents.filter(agent => agent.location === currentLocation) : 
      agents;
    
    return (
      <div className="mb-4">
        <button
          className="flex justify-between items-center w-full p-2 bg-amber-100 dark:bg-amber-900 rounded-md"
          onClick={() => toggleSection('npcs')}
        >
          <h3 className="text-lg font-semibold">NPC信息</h3>
          <svg
            className={`w-5 h-5 transition-transform ${expandedSection === 'npcs' ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        {expandedSection === 'npcs' && (
          <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm">
            {npcsInLocation.length > 0 ? (
              <div>
                <h4 className="font-semibold mb-2">当前位置的角色:</h4>
                {npcsInLocation.map((npc, index) => (
                  <div key={index} className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                    <div className="font-semibold">{npc.name || npc.id}</div>
                    {npc.description && (
                      <div className="text-sm mt-1">{npc.description}</div>
                    )}
                    {npc.currentEmotion && (
                      <div className="text-sm mt-1">
                        <span className="font-semibold">情绪:</span> {npc.currentEmotion}
                        {npc.emotionIntensity && ` (${npc.emotionIntensity})`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400">
                当前位置没有NPC
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  /**
   * 渲染世界书信息
   * @returns {JSX.Element} 世界书信息组件
   */
  const renderWorldBookInfo = () => {
    const worldBook = gameState.worldBook || {};
    const entries = worldBook.entries || [];
    
    return (
      <div className="mb-4">
        <button
          className="flex justify-between items-center w-full p-2 bg-purple-100 dark:bg-purple-900 rounded-md"
          onClick={() => toggleSection('worldbook')}
        >
          <h3 className="text-lg font-semibold">世界书</h3>
          <svg
            className={`w-5 h-5 transition-transform ${expandedSection === 'worldbook' ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        {expandedSection === 'worldbook' && (
          <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm">
            {worldBook.mainSetting && (
              <div className="mb-3">
                <h4 className="font-semibold mb-1">主要设定:</h4>
                <p>{worldBook.mainSetting}</p>
              </div>
            )}
            
            {entries.length > 0 ? (
              <div>
                <h4 className="font-semibold mb-2">条目:</h4>
                {entries.map((entry, index) => (
                  <div key={index} className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                    <div className="font-semibold">{entry.name || entry.id}</div>
                    {entry.content && (
                      <div className="text-sm mt-1">{entry.content}</div>
                    )}
                    {entry.category && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        分类: {entry.category}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400">
                没有世界书条目
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  /**
   * 渲染游戏信息
   * @returns {JSX.Element} 游戏信息组件
   */
  const renderGameInfo = () => {
    return (
      <div className="mb-4">
        <button
          className="flex justify-between items-center w-full p-2 bg-blue-100 dark:bg-blue-900 rounded-md"
          onClick={() => toggleSection('game')}
        >
          <h3 className="text-lg font-semibold">游戏信息</h3>
          <svg
            className={`w-5 h-5 transition-transform ${expandedSection === 'game' ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        {expandedSection === 'game' && (
          <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm">
            <div className="mb-2">
              <span className="font-semibold">游戏ID:</span> {gameState.gameId || '未知'}
            </div>
            <div className="mb-2">
              <span className="font-semibold">回合:</span> {gameState.turn || 0}
            </div>
            <div className="mb-2">
              <span className="font-semibold">阶段:</span> {gameState.phase || '未知'}
            </div>
            {gameState.storyInfo && (
              <div className="mt-3">
                <h4 className="font-semibold mb-1">故事信息:</h4>
                {gameState.storyInfo.title && (
                  <div className="mb-1">
                    <span className="font-semibold">标题:</span> {gameState.storyInfo.title}
                  </div>
                )}
                {gameState.storyInfo.currentPlot && (
                  <div className="mb-1">
                    <span className="font-semibold">当前情节:</span> {gameState.storyInfo.currentPlot}
                  </div>
                )}
              </div>
            )}
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              创建时间: {gameState.createdAt ? new Date(gameState.createdAt).toLocaleString() : '未知'}
              <br />
              更新时间: {gameState.updatedAt ? new Date(gameState.updatedAt).toLocaleString() : '未知'}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">游戏状态</h2>
      
      {renderPlayerInfo()}
      {renderEnvironmentInfo()}
      {renderNPCInfo()}
      {renderWorldBookInfo()}
      {renderGameInfo()}
    </div>
  );
};

export default GameStateDisplay;
