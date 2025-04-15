/**
 * agent_registry.js
 * 定义角色卡结构和管理功能
 */

import gameState from './game_state';

/**
 * 角色类型枚举
 * @readonly
 * @enum {string}
 */
export const AgentType = {
  /** 玩家角色 */
  PLAYER: 'player',
  /** 非玩家角色 */
  NPC: 'npc',
  /** 游戏主持人 */
  GM: 'gm',
  /** 环境角色 */
  ENVIRONMENT: 'environment'
};

/**
 * 角色性格特质枚举（大五人格）
 * @readonly
 * @enum {string}
 */
export const PersonalityTrait = {
  /** 开放性 - 好奇、创新 vs 传统、保守 */
  OPENNESS: 'openness',
  /** 尽责性 - 组织、自律 vs 随意、冲动 */
  CONSCIENTIOUSNESS: 'conscientiousness',
  /** 外向性 - 社交、活跃 vs 内向、安静 */
  EXTRAVERSION: 'extraversion',
  /** 亲和性 - 合作、同情 vs 挑战、怀疑 */
  AGREEABLENESS: 'agreeableness',
  /** 神经质 - 敏感、焦虑 vs 稳定、冷静 */
  NEUROTICISM: 'neuroticism'
};

/**
 * 情绪状态枚举
 * @readonly
 * @enum {string}
 */
export const EmotionalState = {
  HAPPY: 'happy',
  SAD: 'sad',
  ANGRY: 'angry',
  FEARFUL: 'fearful',
  DISGUSTED: 'disgusted',
  SURPRISED: 'surprised',
  NEUTRAL: 'neutral'
};

/**
 * 默认角色模板
 * @type {Object}
 */
const DEFAULT_AGENT_TEMPLATE = {
  id: '',
  name: '',
  type: AgentType.NPC,
  description: '',
  background: '',
  appearance: '',
  personality: {
    [PersonalityTrait.OPENNESS]: 50,
    [PersonalityTrait.CONSCIENTIOUSNESS]: 50,
    [PersonalityTrait.EXTRAVERSION]: 50,
    [PersonalityTrait.AGREEABLENESS]: 50,
    [PersonalityTrait.NEUROTICISM]: 50
  },
  goals: [],
  motivations: [],
  fears: [],
  relationships: {},
  skills: {},
  inventory: [],
  status: [],
  currentEmotion: EmotionalState.NEUTRAL,
  emotionIntensity: 50,
  location: 'default',
  dialogueStyle: '',
  responsePreferences: {},
  memoryIds: [],
  createdAt: '',
  updatedAt: ''
};

/**
 * 角色注册表类
 * 管理游戏中的所有角色
 */
class AgentRegistry {
  constructor() {
    this.agents = new Map();
    this.templates = new Map();
  }

  /**
   * 初始化角色注册表
   */
  initialize() {
    // 从游戏状态加载角色
    const state = gameState.getState();
    
    // 加载玩家角色
    if (state.player) {
      this.registerAgent({
        ...DEFAULT_AGENT_TEMPLATE,
        ...state.player,
        type: AgentType.PLAYER,
        id: 'player'
      });
    }
    
    // 加载NPC角色
    if (state.agents && Array.isArray(state.agents)) {
      state.agents.forEach(agent => {
        this.registerAgent({
          ...DEFAULT_AGENT_TEMPLATE,
          ...agent
        });
      });
    }
    
    // 添加游戏主持人角色
    this.registerAgent({
      ...DEFAULT_AGENT_TEMPLATE,
      id: 'gm',
      name: '游戏主持人',
      type: AgentType.GM,
      description: '游戏主持人，负责讲述故事和管理游戏进程',
      personality: {
        [PersonalityTrait.OPENNESS]: 80,
        [PersonalityTrait.CONSCIENTIOUSNESS]: 90,
        [PersonalityTrait.EXTRAVERSION]: 70,
        [PersonalityTrait.AGREEABLENESS]: 85,
        [PersonalityTrait.NEUROTICISM]: 20
      }
    });
  }

  /**
   * 注册角色
   * @param {Object} agent - 角色对象
   * @returns {Object} 注册的角色对象
   */
  registerAgent(agent) {
    // 确保角色有ID
    if (!agent.id) {
      agent.id = this._generateAgentId();
    }
    
    // 确保角色有创建和更新时间
    if (!agent.createdAt) {
      agent.createdAt = new Date().toISOString();
    }
    
    agent.updatedAt = new Date().toISOString();
    
    // 添加到注册表
    this.agents.set(agent.id, agent);
    
    return agent;
  }

  /**
   * 注册角色模板
   * @param {string} templateId - 模板ID
   * @param {Object} template - 角色模板对象
   * @returns {Object} 注册的模板对象
   */
  registerTemplate(templateId, template) {
    this.templates.set(templateId, {
      ...DEFAULT_AGENT_TEMPLATE,
      ...template
    });
    
    return this.templates.get(templateId);
  }

  /**
   * 从模板创建角色
   * @param {string} templateId - 模板ID
   * @param {Object} [overrides] - 覆盖模板的属性
   * @returns {Object} 创建的角色对象
   */
  createAgentFromTemplate(templateId, overrides = {}) {
    const template = this.templates.get(templateId);
    
    if (!template) {
      throw new Error(`模板不存在: ${templateId}`);
    }
    
    const agent = {
      ...template,
      ...overrides,
      id: overrides.id || this._generateAgentId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return this.registerAgent(agent);
  }

  /**
   * 获取所有角色
   * @returns {Array} 角色数组
   */
  getAllAgents() {
    return Array.from(this.agents.values());
  }

  /**
   * 获取特定类型的角色
   * @param {string} type - 角色类型
   * @returns {Array} 角色数组
   */
  getAgentsByType(type) {
    return this.getAllAgents().filter(agent => agent.type === type);
  }

  /**
   * 获取特定角色
   * @param {string} agentId - 角色ID
   * @returns {Object|null} 角色对象，如果不存在则返回null
   */
  getAgent(agentId) {
    return this.agents.get(agentId) || null;
  }

  /**
   * 更新角色
   * @param {string} agentId - 角色ID
   * @param {Object} updates - 更新的属性
   * @returns {Object|null} 更新后的角色对象，如果不存在则返回null
   */
  updateAgent(agentId, updates) {
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      return null;
    }
    
    const updatedAgent = {
      ...agent,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.agents.set(agentId, updatedAgent);
    
    // 如果是玩家角色，更新游戏状态
    if (agentId === 'player') {
      gameState.updatePlayer(updatedAgent);
    } else if (agent.type === AgentType.NPC) {
      // 如果是NPC，更新游戏状态中的agents数组
      const state = gameState.getState();
      const agents = state.agents || [];
      const agentIndex = agents.findIndex(a => a.id === agentId);
      
      if (agentIndex >= 0) {
        agents[agentIndex] = updatedAgent;
      } else {
        agents.push(updatedAgent);
      }
      
      gameState.updateState({ agents });
    }
    
    return updatedAgent;
  }

  /**
   * 移除角色
   * @param {string} agentId - 角色ID
   * @returns {boolean} 是否成功移除
   */
  removeAgent(agentId) {
    // 不允许移除玩家和GM
    if (agentId === 'player' || agentId === 'gm') {
      return false;
    }
    
    const removed = this.agents.delete(agentId);
    
    if (removed) {
      // 从游戏状态中移除
      const state = gameState.getState();
      const agents = state.agents || [];
      const updatedAgents = agents.filter(agent => agent.id !== agentId);
      gameState.updateState({ agents: updatedAgents });
    }
    
    return removed;
  }

  /**
   * 更新角色情绪
   * @param {string} agentId - 角色ID
   * @param {string} emotion - 情绪状态
   * @param {number} [intensity=50] - 情绪强度(0-100)
   * @returns {Object|null} 更新后的角色对象，如果不存在则返回null
   */
  updateAgentEmotion(agentId, emotion, intensity = 50) {
    return this.updateAgent(agentId, {
      currentEmotion: emotion,
      emotionIntensity: intensity
    });
  }

  /**
   * 更新角色位置
   * @param {string} agentId - 角色ID
   * @param {string} locationId - 位置ID
   * @returns {Object|null} 更新后的角色对象，如果不存在则返回null
   */
  updateAgentLocation(agentId, locationId) {
    return this.updateAgent(agentId, { location: locationId });
  }

  /**
   * 添加物品到角色背包
   * @param {string} agentId - 角色ID
   * @param {Object} item - 物品对象
   * @returns {Object|null} 更新后的角色对象，如果不存在则返回null
   */
  addItemToInventory(agentId, item) {
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      return null;
    }
    
    const inventory = [...(agent.inventory || [])];
    inventory.push(item);
    
    return this.updateAgent(agentId, { inventory });
  }

  /**
   * 从角色背包移除物品
   * @param {string} agentId - 角色ID
   * @param {string} itemId - 物品ID
   * @returns {Object|null} 更新后的角色对象，如果不存在则返回null
   */
  removeItemFromInventory(agentId, itemId) {
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      return null;
    }
    
    const inventory = (agent.inventory || []).filter(item => item.id !== itemId);
    
    return this.updateAgent(agentId, { inventory });
  }

  /**
   * 添加状态效果到角色
   * @param {string} agentId - 角色ID
   * @param {Object} status - 状态效果对象
   * @returns {Object|null} 更新后的角色对象，如果不存在则返回null
   */
  addStatusEffect(agentId, status) {
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      return null;
    }
    
    const statusEffects = [...(agent.status || [])];
    statusEffects.push(status);
    
    return this.updateAgent(agentId, { status: statusEffects });
  }

  /**
   * 移除角色状态效果
   * @param {string} agentId - 角色ID
   * @param {string} statusId - 状态效果ID
   * @returns {Object|null} 更新后的角色对象，如果不存在则返回null
   */
  removeStatusEffect(agentId, statusId) {
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      return null;
    }
    
    const statusEffects = (agent.status || []).filter(status => status.id !== statusId);
    
    return this.updateAgent(agentId, { status: statusEffects });
  }

  /**
   * 保存所有角色到游戏状态
   */
  saveAgentsToGameState() {
    const player = this.getAgent('player');
    const npcs = this.getAgentsByType(AgentType.NPC);
    
    gameState.updateState({
      player,
      agents: npcs
    });
  }

  /**
   * 导出所有角色为JSON字符串
   * @returns {string} JSON字符串
   */
  exportAgents() {
    return JSON.stringify(Array.from(this.agents.values()), null, 2);
  }

  /**
   * 从JSON字符串导入角色
   * @param {string} jsonString - JSON字符串
   * @returns {boolean} 是否成功导入
   */
  importAgents(jsonString) {
    try {
      const importedAgents = JSON.parse(jsonString);
      
      if (!Array.isArray(importedAgents)) {
        throw new Error('导入的角色不是数组');
      }
      
      // 清除现有角色（除了玩家和GM）
      this.agents.forEach((agent, id) => {
        if (id !== 'player' && id !== 'gm') {
          this.agents.delete(id);
        }
      });
      
      // 导入新角色
      importedAgents.forEach(agent => {
        if (agent.id === 'player' || agent.id === 'gm') {
          // 更新现有玩家和GM
          const existingAgent = this.agents.get(agent.id);
          this.agents.set(agent.id, {
            ...existingAgent,
            ...agent,
            updatedAt: new Date().toISOString()
          });
        } else {
          // 添加新角色
          this.registerAgent(agent);
        }
      });
      
      // 保存到游戏状态
      this.saveAgentsToGameState();
      
      return true;
    } catch (error) {
      console.error('导入角色失败:', error);
      return false;
    }
  }

  /**
   * 生成唯一的角色ID
   * @private
   * @returns {string} 角色ID
   */
  _generateAgentId() {
    return `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 创建角色卡片数据
   * @param {string} agentId - 角色ID
   * @returns {Object} 角色卡片数据
   */
  createAgentCard(agentId) {
    const agent = this.getAgent(agentId);
    
    if (!agent) {
      throw new Error(`角色不存在: ${agentId}`);
    }
    
    return {
      id: agent.id,
      name: agent.name,
      type: agent.type,
      description: agent.description,
      background: agent.background,
      appearance: agent.appearance,
      personality: agent.personality,
      goals: agent.goals,
      dialogueStyle: agent.dialogueStyle
    };
  }
}

// 创建单例实例
const agentRegistry = new AgentRegistry();

export default agentRegistry;
