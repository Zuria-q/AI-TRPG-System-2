/**
 * trust_map.js
 * 管理角色之间的信任关系和情感连接
 */

import agentRegistry from './agent_registry';
import gameState from './game_state';
import { ActionType, TargetType } from './action_space';

/**
 * 关系类型枚举
 * @readonly
 * @enum {string}
 */
export const RelationshipType = {
  /** 朋友关系 */
  FRIEND: 'friend',
  /** 敌人关系 */
  ENEMY: 'enemy',
  /** 家人关系 */
  FAMILY: 'family',
  /** 恋人关系 */
  LOVER: 'lover',
  /** 盟友关系 */
  ALLY: 'ally',
  /** 竞争关系 */
  RIVAL: 'rival',
  /** 陌生人关系 */
  STRANGER: 'stranger',
  /** 导师关系 */
  MENTOR: 'mentor',
  /** 学生关系 */
  STUDENT: 'student',
  /** 雇主关系 */
  EMPLOYER: 'employer',
  /** 雇员关系 */
  EMPLOYEE: 'employee'
};

/**
 * 关系影响因素枚举
 * @readonly
 * @enum {string}
 */
export const RelationshipFactor = {
  /** 信任度 */
  TRUST: 'trust',
  /** 亲密度 */
  INTIMACY: 'intimacy',
  /** 尊重度 */
  RESPECT: 'respect',
  /** 忠诚度 */
  LOYALTY: 'loyalty',
  /** 依赖度 */
  DEPENDENCY: 'dependency'
};

/**
 * 默认关系模板
 * @type {Object}
 */
const DEFAULT_RELATIONSHIP = {
  type: RelationshipType.STRANGER,
  factors: {
    [RelationshipFactor.TRUST]: 50,
    [RelationshipFactor.INTIMACY]: 0,
    [RelationshipFactor.RESPECT]: 50,
    [RelationshipFactor.LOYALTY]: 0,
    [RelationshipFactor.DEPENDENCY]: 0
  },
  history: [],
  notes: '',
  createdAt: '',
  updatedAt: ''
};

/**
 * 信任地图类
 * 管理角色之间的信任关系
 */
class TrustMap {
  constructor() {
    this.relationships = new Map();
  }

  /**
   * 初始化信任地图
   */
  initialize() {
    // 从游戏状态加载关系
    const state = gameState.getState();
    const agents = agentRegistry.getAllAgents();
    
    // 初始化所有角色之间的关系
    agents.forEach(agent1 => {
      agents.forEach(agent2 => {
        if (agent1.id !== agent2.id) {
          // 检查角色是否已有关系定义
          const existingRelationship = agent1.relationships && agent1.relationships[agent2.id];
          
          if (existingRelationship) {
            this.setRelationship(agent1.id, agent2.id, existingRelationship);
          } else {
            // 创建默认关系
            this.setRelationship(agent1.id, agent2.id, {
              ...DEFAULT_RELATIONSHIP,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        }
      });
    });
  }

  /**
   * 获取关系的唯一键
   * @private
   * @param {string} agentId1 - 第一个角色ID
   * @param {string} agentId2 - 第二个角色ID
   * @returns {string} 关系键
   */
  _getRelationshipKey(agentId1, agentId2) {
    // 确保键的一致性，始终按字母顺序排序
    return [agentId1, agentId2].sort().join('_');
  }

  /**
   * 设置角色之间的关系
   * @param {string} agentId1 - 第一个角色ID
   * @param {string} agentId2 - 第二个角色ID
   * @param {Object} relationship - 关系对象
   * @returns {Object} 设置的关系对象
   */
  setRelationship(agentId1, agentId2, relationship) {
    if (agentId1 === agentId2) {
      throw new Error('不能设置角色与自身的关系');
    }
    
    const key = this._getRelationshipKey(agentId1, agentId2);
    const now = new Date().toISOString();
    
    const completeRelationship = {
      ...DEFAULT_RELATIONSHIP,
      ...relationship,
      updatedAt: now
    };
    
    if (!completeRelationship.createdAt) {
      completeRelationship.createdAt = now;
    }
    
    this.relationships.set(key, completeRelationship);
    
    // 更新角色对象中的关系
    this._updateAgentRelationships(agentId1, agentId2, completeRelationship);
    
    return completeRelationship;
  }

  /**
   * 获取角色之间的关系
   * @param {string} agentId1 - 第一个角色ID
   * @param {string} agentId2 - 第二个角色ID
   * @returns {Object|null} 关系对象，如果不存在则返回null
   */
  getRelationship(agentId1, agentId2) {
    if (agentId1 === agentId2) {
      return null;
    }
    
    const key = this._getRelationshipKey(agentId1, agentId2);
    return this.relationships.get(key) || null;
  }

  /**
   * 获取角色的所有关系
   * @param {string} agentId - 角色ID
   * @returns {Object} 关系对象映射，键为其他角色ID
   */
  getAgentRelationships(agentId) {
    const relationships = {};
    const agents = agentRegistry.getAllAgents();
    
    agents.forEach(agent => {
      if (agent.id !== agentId) {
        const relationship = this.getRelationship(agentId, agent.id);
        if (relationship) {
          relationships[agent.id] = relationship;
        }
      }
    });
    
    return relationships;
  }

  /**
   * 更新关系因素
   * @param {string} agentId1 - 第一个角色ID
   * @param {string} agentId2 - 第二个角色ID
   * @param {string} factor - 关系因素
   * @param {number} value - 新值(0-100)
   * @returns {Object|null} 更新后的关系对象，如果不存在则返回null
   */
  updateRelationshipFactor(agentId1, agentId2, factor, value) {
    const relationship = this.getRelationship(agentId1, agentId2);
    
    if (!relationship) {
      return null;
    }
    
    // 确保值在0-100范围内
    const clampedValue = Math.max(0, Math.min(100, value));
    
    const updatedRelationship = {
      ...relationship,
      factors: {
        ...relationship.factors,
        [factor]: clampedValue
      },
      updatedAt: new Date().toISOString()
    };
    
    return this.setRelationship(agentId1, agentId2, updatedRelationship);
  }

  /**
   * 调整关系因素
   * @param {string} agentId1 - 第一个角色ID
   * @param {string} agentId2 - 第二个角色ID
   * @param {string} factor - 关系因素
   * @param {number} delta - 变化量
   * @returns {Object|null} 更新后的关系对象，如果不存在则返回null
   */
  adjustRelationshipFactor(agentId1, agentId2, factor, delta) {
    const relationship = this.getRelationship(agentId1, agentId2);
    
    if (!relationship) {
      return null;
    }
    
    const currentValue = relationship.factors[factor] || 0;
    const newValue = Math.max(0, Math.min(100, currentValue + delta));
    
    return this.updateRelationshipFactor(agentId1, agentId2, factor, newValue);
  }

  /**
   * 更新关系类型
   * @param {string} agentId1 - 第一个角色ID
   * @param {string} agentId2 - 第二个角色ID
   * @param {string} type - 关系类型
   * @returns {Object|null} 更新后的关系对象，如果不存在则返回null
   */
  updateRelationshipType(agentId1, agentId2, type) {
    const relationship = this.getRelationship(agentId1, agentId2);
    
    if (!relationship) {
      return null;
    }
    
    const updatedRelationship = {
      ...relationship,
      type,
      updatedAt: new Date().toISOString()
    };
    
    return this.setRelationship(agentId1, agentId2, updatedRelationship);
  }

  /**
   * 添加关系历史记录
   * @param {string} agentId1 - 第一个角色ID
   * @param {string} agentId2 - 第二个角色ID
   * @param {Object} historyEntry - 历史记录条目
   * @returns {Object|null} 更新后的关系对象，如果不存在则返回null
   */
  addRelationshipHistory(agentId1, agentId2, historyEntry) {
    const relationship = this.getRelationship(agentId1, agentId2);
    
    if (!relationship) {
      return null;
    }
    
    const history = [...(relationship.history || [])];
    
    const completeEntry = {
      ...historyEntry,
      timestamp: historyEntry.timestamp || new Date().toISOString()
    };
    
    history.push(completeEntry);
    
    const updatedRelationship = {
      ...relationship,
      history,
      updatedAt: new Date().toISOString()
    };
    
    return this.setRelationship(agentId1, agentId2, updatedRelationship);
  }

  /**
   * 处理行为对关系的影响
   * @param {Object} action - 行为对象
   * @returns {Object|null} 更新后的关系对象，如果没有影响则返回null
   */
  processActionEffect(action) {
    // 只处理有角色目标的行为
    if (action.targetType !== TargetType.CHARACTER || !action.targetId) {
      return null;
    }
    
    const actorId = action.actorId;
    const targetId = action.targetId;
    
    // 不处理角色对自身的行为
    if (actorId === targetId) {
      return null;
    }
    
    // 获取当前关系
    const relationship = this.getRelationship(actorId, targetId);
    
    if (!relationship) {
      return null;
    }
    
    // 根据行为类型和内容分析影响
    let trustDelta = 0;
    let intimacyDelta = 0;
    let respectDelta = 0;
    
    switch (action.type) {
      case ActionType.DIALOGUE:
        // 分析对话内容，这里简化处理
        // 实际应用中可能需要更复杂的情感分析
        if (action.content.includes('感谢') || action.content.includes('谢谢')) {
          trustDelta = 2;
          respectDelta = 1;
        } else if (action.content.includes('抱歉') || action.content.includes('对不起')) {
          trustDelta = 1;
          respectDelta = 2;
        } else if (action.content.includes('喜欢') || action.content.includes('爱')) {
          intimacyDelta = 3;
          trustDelta = 1;
        } else if (action.content.includes('讨厌') || action.content.includes('恨')) {
          intimacyDelta = -3;
          trustDelta = -1;
        }
        break;
      
      case ActionType.ACTION:
        // 分析行为内容
        if (action.content.includes('帮助') || action.content.includes('援助')) {
          trustDelta = 3;
          respectDelta = 2;
        } else if (action.content.includes('攻击') || action.content.includes('伤害')) {
          trustDelta = -5;
          respectDelta = -3;
        } else if (action.content.includes('拥抱') || action.content.includes('亲吻')) {
          intimacyDelta = 4;
        }
        break;
      
      case ActionType.ITEM:
        // 分析物品使用
        if (action.content.includes('赠送') || action.content.includes('给予')) {
          trustDelta = 2;
          intimacyDelta = 1;
        } else if (action.content.includes('偷窃') || action.content.includes('抢夺')) {
          trustDelta = -4;
          respectDelta = -2;
        }
        break;
    }
    
    // 应用变化
    if (trustDelta !== 0) {
      this.adjustRelationshipFactor(actorId, targetId, RelationshipFactor.TRUST, trustDelta);
    }
    
    if (intimacyDelta !== 0) {
      this.adjustRelationshipFactor(actorId, targetId, RelationshipFactor.INTIMACY, intimacyDelta);
    }
    
    if (respectDelta !== 0) {
      this.adjustRelationshipFactor(actorId, targetId, RelationshipFactor.RESPECT, respectDelta);
    }
    
    // 添加历史记录
    this.addRelationshipHistory(actorId, targetId, {
      actionType: action.type,
      content: action.content,
      effect: {
        trust: trustDelta,
        intimacy: intimacyDelta,
        respect: respectDelta
      }
    });
    
    // 返回更新后的关系
    return this.getRelationship(actorId, targetId);
  }

  /**
   * 更新角色对象中的关系
   * @private
   * @param {string} agentId1 - 第一个角色ID
   * @param {string} agentId2 - 第二个角色ID
   * @param {Object} relationship - 关系对象
   */
  _updateAgentRelationships(agentId1, agentId2, relationship) {
    const agent1 = agentRegistry.getAgent(agentId1);
    const agent2 = agentRegistry.getAgent(agentId2);
    
    if (agent1) {
      const relationships = { ...(agent1.relationships || {}) };
      relationships[agentId2] = relationship;
      agentRegistry.updateAgent(agentId1, { relationships });
    }
    
    if (agent2) {
      const relationships = { ...(agent2.relationships || {}) };
      relationships[agentId1] = relationship;
      agentRegistry.updateAgent(agentId2, { relationships });
    }
  }

  /**
   * 分析角色之间的关系状态
   * @param {string} agentId1 - 第一个角色ID
   * @param {string} agentId2 - 第二个角色ID
   * @returns {Object} 关系状态分析
   */
  analyzeRelationship(agentId1, agentId2) {
    const relationship = this.getRelationship(agentId1, agentId2);
    
    if (!relationship) {
      return {
        status: '未知',
        description: '没有关系数据'
      };
    }
    
    const { trust, intimacy, respect } = relationship.factors;
    
    // 根据关系因素分析状态
    let status = '';
    let description = '';
    
    if (trust >= 80 && intimacy >= 80) {
      status = '亲密';
      description = '关系非常亲密，互相信任';
    } else if (trust >= 70) {
      status = '信任';
      description = '彼此信任，关系良好';
    } else if (trust <= 20 && respect <= 30) {
      status = '敌对';
      description = '关系恶劣，互不信任';
    } else if (trust <= 40) {
      status = '警惕';
      description = '保持距离，缺乏信任';
    } else if (intimacy >= 70 && respect >= 60) {
      status = '友好';
      description = '关系友好，互相尊重';
    } else {
      status = '一般';
      description = '关系一般，没有特别亲近或疏远';
    }
    
    return {
      status,
      description,
      type: relationship.type,
      factors: relationship.factors
    };
  }

  /**
   * 获取角色的社交网络
   * @param {string} agentId - 角色ID
   * @returns {Array} 社交关系数组
   */
  getSocialNetwork(agentId) {
    const agent = agentRegistry.getAgent(agentId);
    
    if (!agent) {
      return [];
    }
    
    const network = [];
    const agents = agentRegistry.getAllAgents();
    
    agents.forEach(otherAgent => {
      if (otherAgent.id !== agentId) {
        const relationship = this.getRelationship(agentId, otherAgent.id);
        
        if (relationship) {
          network.push({
            agentId: otherAgent.id,
            name: otherAgent.name,
            type: otherAgent.type,
            relationship: this.analyzeRelationship(agentId, otherAgent.id)
          });
        }
      }
    });
    
    return network;
  }

  /**
   * 导出所有关系为JSON字符串
   * @returns {string} JSON字符串
   */
  exportRelationships() {
    return JSON.stringify(Array.from(this.relationships.entries()), null, 2);
  }

  /**
   * 从JSON字符串导入关系
   * @param {string} jsonString - JSON字符串
   * @returns {boolean} 是否成功导入
   */
  importRelationships(jsonString) {
    try {
      const importedRelationships = JSON.parse(jsonString);
      
      if (!Array.isArray(importedRelationships)) {
        throw new Error('导入的关系不是数组');
      }
      
      this.relationships.clear();
      
      importedRelationships.forEach(([key, relationship]) => {
        this.relationships.set(key, relationship);
      });
      
      // 更新所有角色的关系
      const agents = agentRegistry.getAllAgents();
      
      agents.forEach(agent1 => {
        const relationships = {};
        
        agents.forEach(agent2 => {
          if (agent1.id !== agent2.id) {
            const relationship = this.getRelationship(agent1.id, agent2.id);
            
            if (relationship) {
              relationships[agent2.id] = relationship;
            }
          }
        });
        
        agentRegistry.updateAgent(agent1.id, { relationships });
      });
      
      return true;
    } catch (error) {
      console.error('导入关系失败:', error);
      return false;
    }
  }
}

// 创建单例实例
const trustMap = new TrustMap();

export default trustMap;
