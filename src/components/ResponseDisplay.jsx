import React, { useRef, useEffect } from 'react';
import { HistoryEntryType } from '../modules/history';

/**
 * 响应显示组件
 * 显示游戏历史记录和NPC响应
 * @param {Object} props - 组件属性
 * @param {Array} props.history - 历史记录数组
 */
const ResponseDisplay = ({ history = [] }) => {
  // 创建引用，用于自动滚动
  const messagesEndRef = useRef(null);

  // 当历史记录更新时，自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history]);

  /**
   * 根据历史条目类型获取CSS类名
   * @param {string} type - 历史条目类型
   * @returns {string} CSS类名
   */
  const getEntryClassName = (type) => {
    switch (type) {
      case HistoryEntryType.ACTION:
        return 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700';
      case HistoryEntryType.NPC_RESPONSE:
        return 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700';
      case HistoryEntryType.SYSTEM:
        return 'bg-purple-50 dark:bg-purple-900 border-purple-200 dark:border-purple-700';
      case HistoryEntryType.ENVIRONMENT:
        return 'bg-amber-50 dark:bg-amber-900 border-amber-200 dark:border-amber-700';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  /**
   * 根据情绪获取CSS类名
   * @param {string} emotion - 情绪状态
   * @returns {string} CSS类名
   */
  const getEmotionClassName = (emotion) => {
    switch (emotion) {
      case 'happy':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'sad':
        return 'text-blue-600 dark:text-blue-400';
      case 'angry':
        return 'text-red-600 dark:text-red-400';
      case 'fearful':
        return 'text-purple-600 dark:text-purple-400';
      case 'disgusted':
        return 'text-green-600 dark:text-green-400';
      case 'surprised':
        return 'text-pink-600 dark:text-pink-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  /**
   * 渲染历史条目
   * @param {Object} entry - 历史条目
   * @param {number} index - 索引
   * @returns {JSX.Element} 渲染的历史条目
   */
  const renderHistoryEntry = (entry, index) => {
    const timestamp = entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : '';
    const className = getEntryClassName(entry.type);

    switch (entry.type) {
      case HistoryEntryType.ACTION:
        return (
          <div key={index} className={`p-3 mb-3 rounded-lg border ${className}`}>
            <div className="flex justify-between items-start">
              <div className="font-semibold">{entry.actorId || '未知'}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{timestamp}</div>
            </div>
            <div className="mt-1">{entry.content}</div>
          </div>
        );

      case HistoryEntryType.NPC_RESPONSE:
        const emotionClass = entry.metadata?.emotion ? 
          getEmotionClassName(entry.metadata.emotion) : '';
        
        return (
          <div key={index} className={`p-3 mb-3 rounded-lg border ${className}`}>
            <div className="flex justify-between items-start">
              <div className="font-semibold flex items-center">
                {entry.npcId || '未知'}
                {entry.metadata?.emotion && (
                  <span className={`ml-2 text-xs ${emotionClass}`}>
                    {entry.metadata.emotion}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{timestamp}</div>
            </div>
            <div className="mt-1">{entry.content}</div>
          </div>
        );

      case HistoryEntryType.SYSTEM:
        return (
          <div key={index} className={`p-3 mb-3 rounded-lg border ${className}`}>
            <div className="flex justify-between items-start">
              <div className="font-semibold">系统</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{timestamp}</div>
            </div>
            <div className="mt-1">{entry.message}</div>
          </div>
        );

      case HistoryEntryType.ENVIRONMENT:
        return (
          <div key={index} className={`p-3 mb-3 rounded-lg border ${className}`}>
            <div className="flex justify-between items-start">
              <div className="font-semibold">环境: {entry.locationId || '未知位置'}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{timestamp}</div>
            </div>
            <div className="mt-1">{entry.description}</div>
          </div>
        );

      default:
        return (
          <div key={index} className={`p-3 mb-3 rounded-lg border ${className}`}>
            <div className="flex justify-between items-start">
              <div className="font-semibold">未知类型</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{timestamp}</div>
            </div>
            <div className="mt-1">{JSON.stringify(entry)}</div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-bold mb-4">游戏历史</h2>
      
      {history.length === 0 ? (
        <div className="text-center p-8 text-gray-500 dark:text-gray-400">
          没有历史记录。开始你的冒险吧！
        </div>
      ) : (
        <div className="space-y-2">
          {history.map(renderHistoryEntry)}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

export default ResponseDisplay;
