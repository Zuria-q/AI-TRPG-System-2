/**
 * history.js
 * 记录游戏历史，包括状态变化和行为记录
 */

import gameState from './game_state';

/**
 * 历史记录类型枚举
 * @readonly
 * @enum {string}
 */
export const HistoryEntryType = {
  /** 行为记录 */
  ACTION: 'action',
  /** 状态变化 */
  STATE_CHANGE: 'state_change',
  /** 系统事件 */
  SYSTEM: 'system',
  /** NPC响应 */
  NPC_RESPONSE: 'npc_response',
  /** 环境描述 */
  ENVIRONMENT: 'environment'
};

/**
 * 历史管理类
 * 负责记录和管理游戏历史
 */
class HistoryManager {
  constructor() {
    this.history = [];
    this.maxHistoryLength = 1000; // 历史记录最大长度
  }

  /**
   * 添加历史记录
   * @param {Object} entry - 历史记录条目
   * @returns {Object} 添加的历史记录条目
   */
  addEntry(entry) {
    // 确保条目有ID和时间戳
    const completeEntry = {
      id: this._generateEntryId(),
      timestamp: Date.now(),
      ...entry
    };
    
    // 添加到历史记录
    this.history.push(completeEntry);
    
    // 如果超过最大长度，移除最旧的记录
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }
    
    return completeEntry;
  }

  /**
   * 添加行为历史记录
   * @param {Object} action - 行为对象
   * @param {Object} [result] - 行为结果
   * @returns {Object} 添加的历史记录条目
   */
  addActionEntry(action, result = null) {
    return this.addEntry({
      type: HistoryEntryType.ACTION,
      action,
      result,
      actorId: action.actorId,
      content: action.content
    });
  }

  /**
   * 添加状态变化历史记录
   * @param {Object} previousState - 变化前的状态
   * @param {Object} currentState - 变化后的状态
   * @param {string} [cause] - 变化原因
   * @returns {Object} 添加的历史记录条目
   */
  addStateChangeEntry(previousState, currentState, cause = null) {
    // 计算状态差异
    const changes = this._calculateStateDiff(previousState, currentState);
    
    return this.addEntry({
      type: HistoryEntryType.STATE_CHANGE,
      changes,
      cause
    });
  }

  /**
   * 添加系统事件历史记录
   * @param {string} eventType - 事件类型
   * @param {string} message - 事件消息
   * @param {Object} [data] - 事件数据
   * @returns {Object} 添加的历史记录条目
   */
  addSystemEntry(eventType, message, data = null) {
    return this.addEntry({
      type: HistoryEntryType.SYSTEM,
      eventType,
      message,
      data
    });
  }

  /**
   * 添加NPC响应历史记录
   * @param {string} npcId - NPC ID
   * @param {string} content - 响应内容
   * @param {Object} [metadata] - 元数据
   * @returns {Object} 添加的历史记录条目
   */
  addNPCResponseEntry(npcId, content, metadata = null) {
    return this.addEntry({
      type: HistoryEntryType.NPC_RESPONSE,
      npcId,
      content,
      metadata
    });
  }

  /**
   * 添加环境描述历史记录
   * @param {string} locationId - 位置ID
   * @param {string} description - 环境描述
   * @param {Object} [metadata] - 元数据
   * @returns {Object} 添加的历史记录条目
   */
  addEnvironmentEntry(locationId, description, metadata = null) {
    return this.addEntry({
      type: HistoryEntryType.ENVIRONMENT,
      locationId,
      description,
      metadata
    });
  }

  /**
   * 获取完整历史记录
   * @returns {Array} 历史记录数组
   */
  getHistory() {
    return this.history;
  }

  /**
   * 获取最近的历史记录
   * @param {number} count - 记录数量
   * @returns {Array} 历史记录数组
   */
  getRecentHistory(count) {
    return this.history.slice(-count);
  }

  /**
   * 获取特定类型的历史记录
   * @param {string} type - 历史记录类型
   * @param {number} [count] - 记录数量限制
   * @returns {Array} 历史记录数组
   */
  getHistoryByType(type, count = null) {
    const filteredHistory = this.history.filter(entry => entry.type === type);
    
    if (count !== null) {
      return filteredHistory.slice(-count);
    }
    
    return filteredHistory;
  }

  /**
   * 获取特定角色的历史记录
   * @param {string} actorId - 角色ID
   * @param {number} [count] - 记录数量限制
   * @returns {Array} 历史记录数组
   */
  getHistoryByActor(actorId, count = null) {
    const filteredHistory = this.history.filter(entry => 
      (entry.actorId === actorId) || 
      (entry.type === HistoryEntryType.NPC_RESPONSE && entry.npcId === actorId)
    );
    
    if (count !== null) {
      return filteredHistory.slice(-count);
    }
    
    return filteredHistory;
  }

  /**
   * 获取特定时间范围的历史记录
   * @param {number} startTime - 开始时间戳
   * @param {number} endTime - 结束时间戳
   * @returns {Array} 历史记录数组
   */
  getHistoryByTimeRange(startTime, endTime) {
    return this.history.filter(entry => 
      entry.timestamp >= startTime && entry.timestamp <= endTime
    );
  }

  /**
   * 清除历史记录
   */
  clearHistory() {
    this.history = [];
  }

  /**
   * 导出历史记录为JSON字符串
   * @returns {string} JSON字符串
   */
  exportHistory() {
    return JSON.stringify(this.history, null, 2);
  }

  /**
   * 从JSON字符串导入历史记录
   * @param {string} jsonString - JSON字符串
   * @returns {boolean} 是否成功导入
   */
  importHistory(jsonString) {
    try {
      const importedHistory = JSON.parse(jsonString);
      
      if (!Array.isArray(importedHistory)) {
        throw new Error('导入的历史记录不是数组');
      }
      
      this.history = importedHistory;
      return true;
    } catch (error) {
      console.error('导入历史记录失败:', error);
      return false;
    }
  }

  /**
   * 保存历史记录到本地存储
   * @param {string} [key='ai_trpg_history'] - 存储键名
   * @returns {boolean} 是否成功保存
   */
  saveToLocalStorage(key = 'ai_trpg_history') {
    try {
      const serializedHistory = JSON.stringify(this.history);
      localStorage.setItem(key, serializedHistory);
      return true;
    } catch (error) {
      console.error('保存历史记录失败:', error);
      return false;
    }
  }

  /**
   * 从本地存储加载历史记录
   * @param {string} [key='ai_trpg_history'] - 存储键名
   * @returns {boolean} 是否成功加载
   */
  loadFromLocalStorage(key = 'ai_trpg_history') {
    try {
      const serializedHistory = localStorage.getItem(key);
      
      if (!serializedHistory) {
        return false;
      }
      
      const loadedHistory = JSON.parse(serializedHistory);
      this.history = loadedHistory;
      return true;
    } catch (error) {
      console.error('加载历史记录失败:', error);
      return false;
    }
  }

  /**
   * 生成唯一的历史记录条目ID
   * @private
   * @returns {string} 条目ID
   */
  _generateEntryId() {
    return `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 计算状态差异
   * @private
   * @param {Object} previousState - 变化前的状态
   * @param {Object} currentState - 变化后的状态
   * @returns {Object} 状态差异
   */
  _calculateStateDiff(previousState, currentState) {
    const changes = {};
    
    // 简单的浅层差异检测
    // 实际应用中可能需要更复杂的深层差异检测
    for (const key in currentState) {
      if (JSON.stringify(previousState[key]) !== JSON.stringify(currentState[key])) {
        changes[key] = {
          previous: previousState[key],
          current: currentState[key]
        };
      }
    }
    
    return changes;
  }

  /**
   * 获取可用于提示的历史摘要
   * @param {number} [maxLength=500] - 最大字符长度
   * @returns {string} 历史摘要
   */
  getHistorySummaryForPrompt(maxLength = 500) {
    // 获取最近的历史记录
    const recentHistory = this.getRecentHistory(10);
    
    // 格式化为文本
    let summary = recentHistory.map(entry => {
      switch (entry.type) {
        case HistoryEntryType.ACTION:
          return `[行为] ${entry.actorId}: ${entry.content}`;
        case HistoryEntryType.NPC_RESPONSE:
          return `[NPC] ${entry.npcId}: ${entry.content}`;
        case HistoryEntryType.ENVIRONMENT:
          return `[环境] ${entry.description}`;
        case HistoryEntryType.SYSTEM:
          return `[系统] ${entry.message}`;
        default:
          return null;
      }
    })
    .filter(line => line !== null)
    .join('\n');
    
    // 如果超过最大长度，截断
    if (summary.length > maxLength) {
      summary = summary.substring(summary.length - maxLength);
      // 确保从完整的行开始
      summary = summary.substring(summary.indexOf('\n') + 1);
    }
    
    return summary;
  }
}

// 创建单例实例
const historyManager = new HistoryManager();

export default historyManager;
