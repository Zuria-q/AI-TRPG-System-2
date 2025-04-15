/**
 * memory_manager.js
 * 管理上下文记忆，提供记忆检索和优先级排序
 */

import gameState from './game_state';
import historyManager from './history';
import agentRegistry from './agent_registry';

/**
 * 记忆类型枚举
 * @readonly
 * @enum {string}
 */
export const MemoryType = {
  /** 事件记忆 */
  EVENT: 'event',
  /** 角色记忆 */
  CHARACTER: 'character',
  /** 关系记忆 */
  RELATIONSHIP: 'relationship',
  /** 环境记忆 */
  ENVIRONMENT: 'environment',
  /** 知识记忆 */
  KNOWLEDGE: 'knowledge',
  /** 目标记忆 */
  GOAL: 'goal'
};

/**
 * 记忆重要性枚举
 * @readonly
 * @enum {number}
 */
export const MemoryImportance = {
  /** 低重要性 */
  LOW: 1,
  /** 中等重要性 */
  MEDIUM: 2,
  /** 高重要性 */
  HIGH: 3,
  /** 关键重要性 */
  CRITICAL: 4
};

/**
 * 记忆管理器类
 * 负责管理和检索上下文记忆
 */
class MemoryManager {
  constructor() {
    this.memories = new Map();
    this.agentMemories = new Map();
    this.maxMemories = 1000;
    this.decayRate = 0.05; // 每次访问后的记忆衰减率
  }

  /**
   * 初始化记忆管理器
   */
  initialize() {
    // 从游戏状态加载记忆
    const state = gameState.getState();
    
    if (state.memories && Array.isArray(state.memories)) {
      state.memories.forEach(memory => {
        this.addMemory(memory);
      });
    }
    
    // 从角色加载记忆
    const agents = agentRegistry.getAllAgents();
    
    agents.forEach(agent => {
      if (agent.memoryIds && Array.isArray(agent.memoryIds)) {
        this.agentMemories.set(agent.id, new Set(agent.memoryIds));
      } else {
        this.agentMemories.set(agent.id, new Set());
      }
    });
  }

  /**
   * 添加记忆
   * @param {Object} memory - 记忆对象
   * @returns {string} 记忆ID
   */
  addMemory(memory) {
    // 确保记忆有ID
    if (!memory.id) {
      memory.id = this._generateMemoryId();
    }
    
    // 确保记忆有时间戳
    if (!memory.createdAt) {
      memory.createdAt = new Date().toISOString();
    }
    
    memory.updatedAt = new Date().toISOString();
    
    // 添加记忆
    this.memories.set(memory.id, memory);
    
    // 如果超过最大记忆数，移除最旧的记忆
    if (this.memories.size > this.maxMemories) {
      this._removeOldestMemory();
    }
    
    // 更新游戏状态
    this._updateGameStateMemories();
    
    return memory.id;
  }

  /**
   * 从历史记录创建记忆
   * @param {Object} historyEntry - 历史记录条目
   * @param {string} [type=MemoryType.EVENT] - 记忆类型
   * @param {number} [importance=MemoryImportance.MEDIUM] - 记忆重要性
   * @returns {string} 记忆ID
   */
  createMemoryFromHistory(historyEntry, type = MemoryType.EVENT, importance = MemoryImportance.MEDIUM) {
    const memory = {
      id: this._generateMemoryId(),
      type,
      content: this._formatHistoryContent(historyEntry),
      sourceId: historyEntry.id,
      sourceType: 'history',
      importance,
      relevance: 1.0,
      lastAccessed: new Date().toISOString(),
      accessCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        historyType: historyEntry.type,
        timestamp: historyEntry.timestamp
      }
    };
    
    return this.addMemory(memory);
  }

  /**
   * 创建角色记忆
   * @param {string} agentId - 角色ID
   * @param {string} content - 记忆内容
   * @param {Object} [options={}] - 记忆选项
   * @returns {string} 记忆ID
   */
  createAgentMemory(agentId, content, options = {}) {
    const agent = agentRegistry.getAgent(agentId);
    
    if (!agent) {
      throw new Error(`角色不存在: ${agentId}`);
    }
    
    const memory = {
      id: this._generateMemoryId(),
      type: options.type || MemoryType.CHARACTER,
      content,
      agentId,
      importance: options.importance || MemoryImportance.MEDIUM,
      relevance: 1.0,
      lastAccessed: new Date().toISOString(),
      accessCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: options.metadata || {}
    };
    
    const memoryId = this.addMemory(memory);
    
    // 将记忆与角色关联
    this._associateMemoryWithAgent(memoryId, agentId);
    
    return memoryId;
  }

  /**
   * 获取记忆
   * @param {string} memoryId - 记忆ID
   * @returns {Object|null} 记忆对象，如果不存在则返回null
   */
  getMemory(memoryId) {
    const memory = this.memories.get(memoryId);
    
    if (memory) {
      // 更新访问信息
      memory.lastAccessed = new Date().toISOString();
      memory.accessCount += 1;
      
      // 更新记忆
      this.memories.set(memoryId, memory);
    }
    
    return memory || null;
  }

  /**
   * 更新记忆
   * @param {string} memoryId - 记忆ID
   * @param {Object} updates - 更新的属性
   * @returns {Object|null} 更新后的记忆对象，如果不存在则返回null
   */
  updateMemory(memoryId, updates) {
    const memory = this.memories.get(memoryId);
    
    if (!memory) {
      return null;
    }
    
    const updatedMemory = {
      ...memory,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.memories.set(memoryId, updatedMemory);
    
    // 更新游戏状态
    this._updateGameStateMemories();
    
    return updatedMemory;
  }

  /**
   * 删除记忆
   * @param {string} memoryId - 记忆ID
   * @returns {boolean} 是否成功删除
   */
  deleteMemory(memoryId) {
    const memory = this.memories.get(memoryId);
    
    if (!memory) {
      return false;
    }
    
    // 从记忆映射中移除
    this.memories.delete(memoryId);
    
    // 从角色关联中移除
    if (memory.agentId) {
      this._dissociateMemoryFromAgent(memoryId, memory.agentId);
    }
    
    // 更新游戏状态
    this._updateGameStateMemories();
    
    return true;
  }

  /**
   * 获取角色的记忆
   * @param {string} agentId - 角色ID
   * @returns {Array} 记忆对象数组
   */
  getAgentMemories(agentId) {
    const memoryIds = this.agentMemories.get(agentId);
    
    if (!memoryIds) {
      return [];
    }
    
    return Array.from(memoryIds)
      .map(id => this.getMemory(id))
      .filter(memory => memory !== null);
  }

  /**
   * 获取特定类型的记忆
   * @param {string} type - 记忆类型
   * @returns {Array} 记忆对象数组
   */
  getMemoriesByType(type) {
    return Array.from(this.memories.values())
      .filter(memory => memory.type === type);
  }

  /**
   * 根据内容搜索记忆
   * @param {string} query - 搜索查询
   * @param {Object} [options={}] - 搜索选项
   * @returns {Array} 记忆对象数组
   */
  searchMemories(query, options = {}) {
    const memories = Array.from(this.memories.values());
    
    // 过滤记忆
    let filteredMemories = memories;
    
    if (options.type) {
      filteredMemories = filteredMemories.filter(memory => memory.type === options.type);
    }
    
    if (options.agentId) {
      filteredMemories = filteredMemories.filter(memory => memory.agentId === options.agentId);
    }
    
    if (options.minImportance) {
      filteredMemories = filteredMemories.filter(memory => memory.importance >= options.minImportance);
    }
    
    // 搜索内容
    const results = filteredMemories.filter(memory => 
      memory.content.toLowerCase().includes(query.toLowerCase())
    );
    
    // 按相关性排序
    results.sort((a, b) => {
      // 计算相关性得分
      const scoreA = this._calculateRelevanceScore(a, query);
      const scoreB = this._calculateRelevanceScore(b, query);
      
      return scoreB - scoreA;
    });
    
    // 限制结果数量
    if (options.limit && options.limit > 0) {
      return results.slice(0, options.limit);
    }
    
    return results;
  }

  /**
   * 获取最相关的记忆
   * @param {Object} context - 上下文对象
   * @param {number} [limit=10] - 结果数量限制
   * @returns {Array} 记忆对象数组
   */
  getRelevantMemories(context, limit = 10) {
    const memories = Array.from(this.memories.values());
    
    // 计算每个记忆的相关性
    const scoredMemories = memories.map(memory => ({
      memory,
      score: this._calculateContextRelevance(memory, context)
    }));
    
    // 按相关性排序
    scoredMemories.sort((a, b) => b.score - a.score);
    
    // 获取最相关的记忆
    const relevantMemories = scoredMemories
      .slice(0, limit)
      .map(item => item.memory);
    
    // 更新访问信息
    relevantMemories.forEach(memory => {
      memory.lastAccessed = new Date().toISOString();
      memory.accessCount += 1;
      this.memories.set(memory.id, memory);
    });
    
    return relevantMemories;
  }

  /**
   * 生成记忆摘要
   * @param {Array} memories - 记忆对象数组
   * @returns {string} 记忆摘要
   */
  generateMemorySummary(memories) {
    if (!memories || memories.length === 0) {
      return '无记忆';
    }
    
    // 按重要性排序
    memories.sort((a, b) => b.importance - a.importance);
    
    // 生成摘要
    return memories.map(memory => {
      const importanceLabel = this._getImportanceLabel(memory.importance);
      return `[${memory.type.toUpperCase()}] [${importanceLabel}] ${memory.content}`;
    }).join('\n');
  }

  /**
   * 将记忆与角色关联
   * @private
   * @param {string} memoryId - 记忆ID
   * @param {string} agentId - 角色ID
   */
  _associateMemoryWithAgent(memoryId, agentId) {
    let agentMemoryIds = this.agentMemories.get(agentId);
    
    if (!agentMemoryIds) {
      agentMemoryIds = new Set();
      this.agentMemories.set(agentId, agentMemoryIds);
    }
    
    agentMemoryIds.add(memoryId);
    
    // 更新角色对象
    const agent = agentRegistry.getAgent(agentId);
    
    if (agent) {
      const memoryIds = Array.from(agentMemoryIds);
      agentRegistry.updateAgent(agentId, { memoryIds });
    }
  }

  /**
   * 解除记忆与角色的关联
   * @private
   * @param {string} memoryId - 记忆ID
   * @param {string} agentId - 角色ID
   */
  _dissociateMemoryFromAgent(memoryId, agentId) {
    const agentMemoryIds = this.agentMemories.get(agentId);
    
    if (agentMemoryIds) {
      agentMemoryIds.delete(memoryId);
      
      // 更新角色对象
      const agent = agentRegistry.getAgent(agentId);
      
      if (agent) {
        const memoryIds = Array.from(agentMemoryIds);
        agentRegistry.updateAgent(agentId, { memoryIds });
      }
    }
  }

  /**
   * 更新游戏状态中的记忆
   * @private
   */
  _updateGameStateMemories() {
    const memories = Array.from(this.memories.values());
    gameState.updateState({ memories });
  }

  /**
   * 移除最旧的记忆
   * @private
   */
  _removeOldestMemory() {
    let oldestId = null;
    let oldestTime = Date.now();
    
    // 找到最旧的非关键记忆
    this.memories.forEach((memory, id) => {
      if (memory.importance < MemoryImportance.CRITICAL) {
        const createdTime = new Date(memory.createdAt).getTime();
        
        if (createdTime < oldestTime) {
          oldestTime = createdTime;
          oldestId = id;
        }
      }
    });
    
    // 如果找到了，删除它
    if (oldestId) {
      this.deleteMemory(oldestId);
    }
  }

  /**
   * 计算记忆的相关性得分
   * @private
   * @param {Object} memory - 记忆对象
   * @param {string} query - 搜索查询
   * @returns {number} 相关性得分
   */
  _calculateRelevanceScore(memory, query) {
    // 基础分数
    let score = 0;
    
    // 内容匹配得分
    const contentMatch = memory.content.toLowerCase().includes(query.toLowerCase());
    if (contentMatch) {
      score += 10;
    }
    
    // 重要性得分
    score += memory.importance * 2;
    
    // 最近访问得分
    const lastAccessedTime = new Date(memory.lastAccessed).getTime();
    const now = Date.now();
    const daysSinceLastAccess = (now - lastAccessedTime) / (1000 * 60 * 60 * 24);
    
    // 最近访问的记忆得分更高，但随时间衰减
    score += Math.max(0, 5 - daysSinceLastAccess * this.decayRate);
    
    // 访问次数得分
    score += Math.min(5, memory.accessCount * 0.5);
    
    return score;
  }

  /**
   * 计算记忆与上下文的相关性
   * @private
   * @param {Object} memory - 记忆对象
   * @param {Object} context - 上下文对象
   * @returns {number} 相关性得分
   */
  _calculateContextRelevance(memory, context) {
    // 基础分数
    let score = 0;
    
    // 重要性得分
    score += memory.importance * 2;
    
    // 角色相关性
    if (context.agentId && memory.agentId === context.agentId) {
      score += 5;
    }
    
    // 内容相关性
    if (context.query) {
      const contentMatch = memory.content.toLowerCase().includes(context.query.toLowerCase());
      if (contentMatch) {
        score += 10;
      }
    }
    
    // 类型相关性
    if (context.type && memory.type === context.type) {
      score += 3;
    }
    
    // 时间相关性
    const memoryTime = new Date(memory.createdAt).getTime();
    const now = Date.now();
    const daysSinceCreation = (now - memoryTime) / (1000 * 60 * 60 * 24);
    
    // 较新的记忆得分更高，但随时间衰减
    score += Math.max(0, 5 - daysSinceCreation * this.decayRate);
    
    // 访问频率
    score += Math.min(5, memory.accessCount * 0.5);
    
    return score;
  }

  /**
   * 格式化历史记录内容
   * @private
   * @param {Object} historyEntry - 历史记录条目
   * @returns {string} 格式化的内容
   */
  _formatHistoryContent(historyEntry) {
    switch (historyEntry.type) {
      case 'action':
        return `${historyEntry.actorId || '未知'} 执行了行为: ${historyEntry.content}`;
      
      case 'npc_response':
        return `${historyEntry.npcId || '未知'} 说: ${historyEntry.content}`;
      
      case 'environment':
        return `环境描述: ${historyEntry.description}`;
      
      case 'system':
        return `系统事件: ${historyEntry.message}`;
      
      case 'state_change':
        return `状态变化: ${JSON.stringify(historyEntry.changes)}`;
      
      default:
        return JSON.stringify(historyEntry);
    }
  }

  /**
   * 获取重要性标签
   * @private
   * @param {number} importance - 重要性值
   * @returns {string} 重要性标签
   */
  _getImportanceLabel(importance) {
    switch (importance) {
      case MemoryImportance.LOW:
        return '低';
      case MemoryImportance.MEDIUM:
        return '中';
      case MemoryImportance.HIGH:
        return '高';
      case MemoryImportance.CRITICAL:
        return '关键';
      default:
        return '未知';
    }
  }

  /**
   * 生成唯一的记忆ID
   * @private
   * @returns {string} 记忆ID
   */
  _generateMemoryId() {
    return `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 导出所有记忆为JSON字符串
   * @returns {string} JSON字符串
   */
  exportMemories() {
    return JSON.stringify(Array.from(this.memories.values()), null, 2);
  }

  /**
   * 从JSON字符串导入记忆
   * @param {string} jsonString - JSON字符串
   * @returns {boolean} 是否成功导入
   */
  importMemories(jsonString) {
    try {
      const importedMemories = JSON.parse(jsonString);
      
      if (!Array.isArray(importedMemories)) {
        throw new Error('导入的记忆不是数组');
      }
      
      // 清除现有记忆
      this.memories.clear();
      this.agentMemories.clear();
      
      // 导入新记忆
      importedMemories.forEach(memory => {
        this.memories.set(memory.id, memory);
        
        // 如果有关联角色，添加到角色记忆映射
        if (memory.agentId) {
          let agentMemoryIds = this.agentMemories.get(memory.agentId);
          
          if (!agentMemoryIds) {
            agentMemoryIds = new Set();
            this.agentMemories.set(memory.agentId, agentMemoryIds);
          }
          
          agentMemoryIds.add(memory.id);
        }
      });
      
      // 更新所有角色的记忆ID
      this.agentMemories.forEach((memoryIds, agentId) => {
        const agent = agentRegistry.getAgent(agentId);
        
        if (agent) {
          agentRegistry.updateAgent(agentId, { 
            memoryIds: Array.from(memoryIds) 
          });
        }
      });
      
      // 更新游戏状态
      this._updateGameStateMemories();
      
      return true;
    } catch (error) {
      console.error('导入记忆失败:', error);
      return false;
    }
  }
}

// 创建单例实例
const memoryManager = new MemoryManager();

export default memoryManager;
