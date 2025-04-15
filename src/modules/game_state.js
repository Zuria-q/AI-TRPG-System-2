/**
 * game_state.js
 * 定义游戏状态结构和初始化功能
 */

import { ActionType, TargetType } from './action_space';

/**
 * 游戏阶段枚举
 * @readonly
 * @enum {string}
 */
export const GamePhase = {
  /** 游戏设置阶段 */
  SETUP: 'setup',
  /** 角色规划阶段 */
  PLANNING: 'planning',
  /** 行动执行阶段 */
  ACTION: 'action',
  /** 结局解析阶段 */
  RESOLUTION: 'resolution',
  /** 游戏结束阶段 */
  END: 'end'
};

/**
 * 环境时间周期枚举
 * @readonly
 * @enum {string}
 */
export const TimeCycle = {
  DAWN: 'dawn',
  MORNING: 'morning',
  NOON: 'noon',
  AFTERNOON: 'afternoon',
  EVENING: 'evening',
  NIGHT: 'night',
  MIDNIGHT: 'midnight'
};

/**
 * 环境天气枚举
 * @readonly
 * @enum {string}
 */
export const Weather = {
  CLEAR: 'clear',
  CLOUDY: 'cloudy',
  RAINY: 'rainy',
  STORMY: 'stormy',
  SNOWY: 'snowy',
  FOGGY: 'foggy',
  WINDY: 'windy'
};

/**
 * 游戏状态类
 * 管理整个游戏的状态，包括角色、环境、历史等
 */
class GameState {
  constructor() {
    // 初始化默认状态
    this.reset();
  }

  /**
   * 重置游戏状态为默认值
   */
  reset() {
    this.state = {
      // 游戏元数据
      gameId: this._generateGameId(),
      sessionId: this._generateSessionId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      // 游戏进度
      turn: 0,
      phase: GamePhase.SETUP,
      
      // 角色状态
      player: {
        id: 'player',
        name: '玩家',
        description: '',
        attributes: {},
        inventory: [],
        status: []
      },
      
      // NPC和Agent状态
      agents: [],
      activeAgentId: null,
      
      // 环境状态
      environment: {
        name: '未命名场景',
        description: '这是一个未描述的场景',
        currentLocation: 'default',
        locations: {
          default: {
            id: 'default',
            name: '默认位置',
            description: '一个默认的起始位置',
            connections: [],
            objects: []
          }
        },
        time: {
          day: 1,
          cycle: TimeCycle.MORNING,
          hour: 9,
          minute: 0
        },
        weather: Weather.CLEAR,
        ambience: '',
        flags: {}
      },
      
      // 世界书和设定
      worldbook: [],
      
      // 游戏标志和变量
      flags: {},
      variables: {},
      
      // LLM配置
      llmConfig: {
        temperature: 0.7,
        maxTokens: 500,
        useMemory: true,
        contextWeight: 0.5
      }
    };
  }

  /**
   * 获取完整游戏状态
   * @returns {Object} 当前游戏状态
   */
  getState() {
    return this.state;
  }

  /**
   * 更新游戏状态
   * @param {Object} newState - 要更新的状态部分
   * @returns {Object} 更新后的状态
   */
  updateState(newState) {
    this.state = {
      ...this.state,
      ...newState,
      updatedAt: new Date().toISOString()
    };
    
    return this.state;
  }

  /**
   * 获取当前游戏阶段
   * @returns {string} 当前游戏阶段
   */
  getPhase() {
    return this.state.phase;
  }

  /**
   * 设置游戏阶段
   * @param {string} phase - 新的游戏阶段
   */
  setPhase(phase) {
    if (!Object.values(GamePhase).includes(phase)) {
      throw new Error(`无效的游戏阶段: ${phase}`);
    }
    
    this.state.phase = phase;
    this.state.updatedAt = new Date().toISOString();
  }

  /**
   * 获取当前回合数
   * @returns {number} 当前回合数
   */
  getTurn() {
    return this.state.turn;
  }

  /**
   * 增加回合数
   * @param {number} [amount=1] - 增加的回合数量
   * @returns {number} 新的回合数
   */
  incrementTurn(amount = 1) {
    this.state.turn += amount;
    this.state.updatedAt = new Date().toISOString();
    return this.state.turn;
  }

  /**
   * 获取玩家信息
   * @returns {Object} 玩家信息
   */
  getPlayer() {
    return this.state.player;
  }

  /**
   * 更新玩家信息
   * @param {Object} playerData - 新的玩家数据
   * @returns {Object} 更新后的玩家信息
   */
  updatePlayer(playerData) {
    this.state.player = {
      ...this.state.player,
      ...playerData
    };
    
    this.state.updatedAt = new Date().toISOString();
    return this.state.player;
  }

  /**
   * 获取所有代理（NPC）
   * @returns {Array} 代理列表
   */
  getAgents() {
    return this.state.agents;
  }

  /**
   * 获取特定代理（NPC）
   * @param {string} agentId - 代理ID
   * @returns {Object|null} 代理对象，如果不存在则返回null
   */
  getAgent(agentId) {
    return this.state.agents.find(agent => agent.id === agentId) || null;
  }

  /**
   * 添加代理（NPC）
   * @param {Object} agent - 代理对象
   * @returns {Array} 更新后的代理列表
   */
  addAgent(agent) {
    if (!agent.id) {
      throw new Error('代理必须有ID');
    }
    
    // 检查是否已存在同ID的代理
    const existingIndex = this.state.agents.findIndex(a => a.id === agent.id);
    
    if (existingIndex >= 0) {
      // 更新现有代理
      this.state.agents[existingIndex] = {
        ...this.state.agents[existingIndex],
        ...agent
      };
    } else {
      // 添加新代理
      this.state.agents.push(agent);
    }
    
    this.state.updatedAt = new Date().toISOString();
    return this.state.agents;
  }

  /**
   * 更新代理（NPC）
   * @param {string} agentId - 代理ID
   * @param {Object} agentData - 新的代理数据
   * @returns {Object|null} 更新后的代理，如果不存在则返回null
   */
  updateAgent(agentId, agentData) {
    const agentIndex = this.state.agents.findIndex(agent => agent.id === agentId);
    
    if (agentIndex < 0) {
      return null;
    }
    
    this.state.agents[agentIndex] = {
      ...this.state.agents[agentIndex],
      ...agentData
    };
    
    this.state.updatedAt = new Date().toISOString();
    return this.state.agents[agentIndex];
  }

  /**
   * 移除代理（NPC）
   * @param {string} agentId - 代理ID
   * @returns {boolean} 是否成功移除
   */
  removeAgent(agentId) {
    const initialLength = this.state.agents.length;
    this.state.agents = this.state.agents.filter(agent => agent.id !== agentId);
    
    const removed = initialLength > this.state.agents.length;
    
    if (removed) {
      this.state.updatedAt = new Date().toISOString();
      
      // 如果移除的是当前活跃代理，重置活跃代理
      if (this.state.activeAgentId === agentId) {
        this.state.activeAgentId = null;
      }
    }
    
    return removed;
  }

  /**
   * 设置活跃代理
   * @param {string} agentId - 代理ID
   * @returns {boolean} 是否成功设置
   */
  setActiveAgent(agentId) {
    if (!agentId) {
      this.state.activeAgentId = null;
      this.state.updatedAt = new Date().toISOString();
      return true;
    }
    
    const agentExists = this.state.agents.some(agent => agent.id === agentId);
    
    if (!agentExists) {
      return false;
    }
    
    this.state.activeAgentId = agentId;
    this.state.updatedAt = new Date().toISOString();
    return true;
  }

  /**
   * 获取环境信息
   * @returns {Object} 环境信息
   */
  getEnvironment() {
    return this.state.environment;
  }

  /**
   * 更新环境信息
   * @param {Object} environmentData - 新的环境数据
   * @returns {Object} 更新后的环境信息
   */
  updateEnvironment(environmentData) {
    this.state.environment = {
      ...this.state.environment,
      ...environmentData
    };
    
    this.state.updatedAt = new Date().toISOString();
    return this.state.environment;
  }

  /**
   * 获取位置信息
   * @param {string} locationId - 位置ID
   * @returns {Object|null} 位置信息，如果不存在则返回null
   */
  getLocation(locationId) {
    return this.state.environment.locations[locationId] || null;
  }

  /**
   * 添加或更新位置
   * @param {Object} location - 位置对象
   * @returns {Object} 更新后的位置
   */
  addLocation(location) {
    if (!location.id) {
      throw new Error('位置必须有ID');
    }
    
    this.state.environment.locations[location.id] = {
      ...this.state.environment.locations[location.id] || {},
      ...location
    };
    
    this.state.updatedAt = new Date().toISOString();
    return this.state.environment.locations[location.id];
  }

  /**
   * 移除位置
   * @param {string} locationId - 位置ID
   * @returns {boolean} 是否成功移除
   */
  removeLocation(locationId) {
    if (!this.state.environment.locations[locationId]) {
      return false;
    }
    
    // 如果移除的是当前位置，重置当前位置
    if (this.state.environment.currentLocation === locationId) {
      this.state.environment.currentLocation = 'default';
    }
    
    delete this.state.environment.locations[locationId];
    this.state.updatedAt = new Date().toISOString();
    return true;
  }

  /**
   * 设置当前位置
   * @param {string} locationId - 位置ID
   * @returns {boolean} 是否成功设置
   */
  setCurrentLocation(locationId) {
    if (!this.state.environment.locations[locationId]) {
      return false;
    }
    
    this.state.environment.currentLocation = locationId;
    this.state.updatedAt = new Date().toISOString();
    return true;
  }

  /**
   * 获取世界书条目
   * @returns {Array} 世界书条目列表
   */
  getWorldbook() {
    return this.state.worldbook;
  }

  /**
   * 添加世界书条目
   * @param {Object} entry - 世界书条目
   * @returns {Array} 更新后的世界书列表
   */
  addWorldbookEntry(entry) {
    if (!entry.id) {
      entry.id = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // 检查是否已存在同ID的条目
    const existingIndex = this.state.worldbook.findIndex(e => e.id === entry.id);
    
    if (existingIndex >= 0) {
      // 更新现有条目
      this.state.worldbook[existingIndex] = {
        ...this.state.worldbook[existingIndex],
        ...entry
      };
    } else {
      // 添加新条目
      this.state.worldbook.push(entry);
    }
    
    this.state.updatedAt = new Date().toISOString();
    return this.state.worldbook;
  }

  /**
   * 移除世界书条目
   * @param {string} entryId - 条目ID
   * @returns {boolean} 是否成功移除
   */
  removeWorldbookEntry(entryId) {
    const initialLength = this.state.worldbook.length;
    this.state.worldbook = this.state.worldbook.filter(entry => entry.id !== entryId);
    
    const removed = initialLength > this.state.worldbook.length;
    
    if (removed) {
      this.state.updatedAt = new Date().toISOString();
    }
    
    return removed;
  }

  /**
   * 获取LLM配置
   * @returns {Object} LLM配置
   */
  getLLMConfig() {
    return this.state.llmConfig;
  }

  /**
   * 更新LLM配置
   * @param {Object} config - 新的LLM配置
   * @returns {Object} 更新后的LLM配置
   */
  updateLLMConfig(config) {
    this.state.llmConfig = {
      ...this.state.llmConfig,
      ...config
    };
    
    this.state.updatedAt = new Date().toISOString();
    return this.state.llmConfig;
  }

  /**
   * 保存游戏状态到本地存储
   * @param {string} [key='ai_trpg_game_state'] - 存储键名
   * @returns {boolean} 是否成功保存
   */
  saveToLocalStorage(key = 'ai_trpg_game_state') {
    try {
      const serializedState = JSON.stringify(this.state);
      localStorage.setItem(key, serializedState);
      return true;
    } catch (error) {
      console.error('保存游戏状态失败:', error);
      return false;
    }
  }

  /**
   * 从本地存储加载游戏状态
   * @param {string} [key='ai_trpg_game_state'] - 存储键名
   * @returns {boolean} 是否成功加载
   */
  loadFromLocalStorage(key = 'ai_trpg_game_state') {
    try {
      const serializedState = localStorage.getItem(key);
      
      if (!serializedState) {
        return false;
      }
      
      const loadedState = JSON.parse(serializedState);
      this.state = loadedState;
      return true;
    } catch (error) {
      console.error('加载游戏状态失败:', error);
      return false;
    }
  }

  /**
   * 导出游戏状态为JSON字符串
   * @returns {string} JSON字符串
   */
  exportState() {
    return JSON.stringify(this.state, null, 2);
  }

  /**
   * 从JSON字符串导入游戏状态
   * @param {string} jsonString - JSON字符串
   * @returns {boolean} 是否成功导入
   */
  importState(jsonString) {
    try {
      const importedState = JSON.parse(jsonString);
      this.state = importedState;
      return true;
    } catch (error) {
      console.error('导入游戏状态失败:', error);
      return false;
    }
  }

  /**
   * 生成唯一的游戏ID
   * @private
   * @returns {string} 游戏ID
   */
  _generateGameId() {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成唯一的会话ID
   * @private
   * @returns {string} 会话ID
   */
  _generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 创建单例实例
const gameState = new GameState();

export default gameState;
