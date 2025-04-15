/**
 * agent_policy.js
 * 实现角色响应生成和决策逻辑
 */

import agentRegistry, { AgentType, PersonalityTrait, EmotionalState } from './agent_registry';
import trustMap, { RelationshipFactor } from './trust_map';
import historyManager, { HistoryEntryType } from './history.js';
import gameState from './game_state';

/**
 * 响应类型枚举
 * @readonly
 * @enum {string}
 */
export const ResponseType = {
  /** 对话响应 */
  DIALOGUE: 'dialogue',
  /** 行为响应 */
  ACTION: 'action',
  /** 情绪响应 */
  EMOTION: 'emotion',
  /** 决策响应 */
  DECISION: 'decision',
  /** 拒绝响应 */
  REJECTION: 'rejection'
};

/**
 * 决策类型枚举
 * @readonly
 * @enum {string}
 */
export const DecisionType = {
  /** 合作决策 */
  COOPERATE: 'cooperate',
  /** 竞争决策 */
  COMPETE: 'compete',
  /** 逃避决策 */
  AVOID: 'avoid',
  /** 帮助决策 */
  HELP: 'help',
  /** 攻击决策 */
  ATTACK: 'attack',
  /** 中立决策 */
  NEUTRAL: 'neutral'
};

/**
 * 角色策略类
 * 负责生成角色响应和决策
 */
class AgentPolicy {
  constructor() {
    // 响应模板
    this.responseTemplates = {
      [EmotionalState.HAPPY]: [
        "{{name}}笑着说，\"{{content}}\"",
        "{{name}}愉快地回应，\"{{content}}\"",
        "{{name}}面带微笑，\"{{content}}\""
      ],
      [EmotionalState.SAD]: [
        "{{name}}叹了口气，\"{{content}}\"",
        "{{name}}低落地说，\"{{content}}\"",
        "{{name}}声音中带着悲伤，\"{{content}}\""
      ],
      [EmotionalState.ANGRY]: [
        "{{name}}怒气冲冲地说，\"{{content}}\"",
        "{{name}}提高了声音，\"{{content}}\"",
        "{{name}}愤怒地回应，\"{{content}}\""
      ],
      [EmotionalState.FEARFUL]: [
        "{{name}}紧张地说，\"{{content}}\"",
        "{{name}}声音颤抖着，\"{{content}}\"",
        "{{name}}畏缩着回应，\"{{content}}\""
      ],
      [EmotionalState.DISGUSTED]: [
        "{{name}}厌恶地说，\"{{content}}\"",
        "{{name}}皱着眉头，\"{{content}}\"",
        "{{name}}不悦地回应，\"{{content}}\""
      ],
      [EmotionalState.SURPRISED]: [
        "{{name}}惊讶地说，\"{{content}}\"",
        "{{name}}睁大了眼睛，\"{{content}}\"",
        "{{name}}震惊地回应，\"{{content}}\""
      ],
      [EmotionalState.NEUTRAL]: [
        "{{name}}说，\"{{content}}\"",
        "{{name}}回应道，\"{{content}}\"",
        "{{name}}平静地说，\"{{content}}\""
      ]
    };
  }

  /**
   * 生成角色响应
   * @param {string} agentId - 角色ID
   * @param {Object} action - 触发响应的行为
   * @param {Object} [options={}] - 响应选项
   * @returns {Promise<Object>} 响应对象
   */
  async generateResponse(agentId, action, options = {}) {
    try {
      const agent = agentRegistry.getAgent(agentId);
      
      if (!agent) {
        throw new Error(`角色不存在: ${agentId}`);
      }
      
      // 获取角色信息
      const agentCard = agentRegistry.createAgentCard(agentId);
      
      // 获取与行为执行者的关系
      const relationship = action.actorId ? 
        trustMap.getRelationship(agentId, action.actorId) : null;
      
      // 获取相关历史记录
      const relevantHistory = historyManager.getRecentHistory(10);
      
      // 准备提示上下文
      const context = this._prepareResponseContext(agent, action, relationship, relevantHistory, options);
      
      // 根据角色类型选择不同的响应生成方法
      let response;
      
      switch (agent.type) {
        case AgentType.NPC:
          response = await this._generateNPCResponse(agent, context, options);
          break;
        
        case AgentType.GM:
          response = await this._generateGMResponse(agent, context, options);
          break;
        
        case AgentType.ENVIRONMENT:
          response = await this._generateEnvironmentResponse(agent, context, options);
          break;
        
        default:
          throw new Error(`不支持的角色类型: ${agent.type}`);
      }
      
      // 记录响应到历史
      if (response.type === ResponseType.DIALOGUE) {
        historyManager.addNPCResponseEntry(agentId, response.content, {
          emotion: agent.currentEmotion,
          intensity: agent.emotionIntensity
        });
      }
      
      // 更新角色情绪状态（如果响应包含情绪变化）
      if (response.emotion && response.emotion !== agent.currentEmotion) {
        agentRegistry.updateAgentEmotion(
          agentId, 
          response.emotion, 
          response.emotionIntensity || agent.emotionIntensity
        );
      }
      
      return response;
    } catch (error) {
      console.error('生成角色响应失败:', error);
      // 返回一个错误响应
      return {
        type: ResponseType.REJECTION,
        content: '无法生成响应',
        error: error.message
      };
    }
  }

  /**
   * 准备响应上下文
   * @private
   * @param {Object} agent - 角色对象
   * @param {Object} action - 触发响应的行为
   * @param {Object|null} relationship - 与行为执行者的关系
   * @param {Array} history - 相关历史记录
   * @param {Object} options - 响应选项
   * @returns {Object} 响应上下文
   */
  _prepareResponseContext(agent, action, relationship, history, options) {
    // 获取游戏状态
    const state = gameState.getState();
    
    // 获取当前位置
    const currentLocation = state.environment?.currentLocation || 'unknown';
    const location = state.environment?.locations?.[currentLocation] || { name: '未知位置', description: '' };
    
    // 获取社交网络
    const socialNetwork = trustMap.getSocialNetwork(agent.id);
    
    // 构建上下文对象
    return {
      agent: {
        id: agent.id,
        name: agent.name,
        type: agent.type,
        personality: agent.personality,
        currentEmotion: agent.currentEmotion,
        emotionIntensity: agent.emotionIntensity,
        goals: agent.goals,
        fears: agent.fears,
        dialogueStyle: agent.dialogueStyle
      },
      action: {
        type: action.type,
        content: action.content,
        actorId: action.actorId,
        actorName: this._getAgentName(action.actorId),
        targetId: action.targetId,
        targetName: this._getAgentName(action.targetId)
      },
      relationship: relationship ? {
        type: relationship.type,
        trust: relationship.factors[RelationshipFactor.TRUST],
        intimacy: relationship.factors[RelationshipFactor.INTIMACY],
        respect: relationship.factors[RelationshipFactor.RESPECT]
      } : null,
      environment: {
        locationId: currentLocation,
        locationName: location.name,
        locationDescription: location.description
      },
      socialNetwork: socialNetwork.map(relation => ({
        id: relation.agentId,
        name: relation.name,
        relationshipStatus: relation.relationship.status
      })),
      history: this._formatHistoryForContext(history),
      options
    };
  }

  /**
   * 获取角色名称
   * @private
   * @param {string} agentId - 角色ID
   * @returns {string} 角色名称
   */
  _getAgentName(agentId) {
    if (!agentId) return '';
    
    const agent = agentRegistry.getAgent(agentId);
    return agent ? agent.name : agentId;
  }

  /**
   * 格式化历史记录用于上下文
   * @private
   * @param {Array} history - 历史记录
   * @returns {Array} 格式化的历史记录
   */
  _formatHistoryForContext(history) {
    return history.map(entry => {
      switch (entry.type) {
        case HistoryEntryType.ACTION:
          return {
            type: 'action',
            actorName: this._getAgentName(entry.actorId),
            content: entry.content,
            timestamp: entry.timestamp
          };
        
        case HistoryEntryType.NPC_RESPONSE:
          return {
            type: 'response',
            speakerName: this._getAgentName(entry.npcId),
            content: entry.content,
            emotion: entry.metadata?.emotion,
            timestamp: entry.timestamp
          };
        
        case HistoryEntryType.ENVIRONMENT:
          return {
            type: 'environment',
            locationName: entry.locationId,
            description: entry.description,
            timestamp: entry.timestamp
          };
        
        default:
          return null;
      }
    }).filter(item => item !== null);
  }

  /**
   * 生成NPC响应
   * @private
   * @param {Object} agent - 角色对象
   * @param {Object} context - 响应上下文
   * @param {Object} options - 响应选项
   * @returns {Promise<Object>} 响应对象
   */
  async _generateNPCResponse(agent, context, options) {
    // 在实际应用中，这里会调用LLM生成响应
    // 现在使用模拟响应
    
    // 根据上下文决定响应类型
    const responseType = this._determineResponseType(context);
    
    switch (responseType) {
      case ResponseType.DIALOGUE:
        return this._generateDialogueResponse(agent, context);
      
      case ResponseType.ACTION:
        return this._generateActionResponse(agent, context);
      
      case ResponseType.EMOTION:
        return this._generateEmotionResponse(agent, context);
      
      case ResponseType.DECISION:
        return this._generateDecisionResponse(agent, context);
      
      case ResponseType.REJECTION:
        return {
          type: ResponseType.REJECTION,
          content: '我不想回应这个。',
          reason: '不适合的互动'
        };
      
      default:
        return this._generateDialogueResponse(agent, context);
    }
  }

  /**
   * 生成GM响应
   * @private
   * @param {Object} agent - 角色对象
   * @param {Object} context - 响应上下文
   * @param {Object} options - 响应选项
   * @returns {Promise<Object>} 响应对象
   */
  async _generateGMResponse(agent, context, options) {
    // GM响应通常是叙述性的，描述场景或结果
    return {
      type: ResponseType.DIALOGUE,
      content: this._generateNarrativeDescription(context),
      emotion: EmotionalState.NEUTRAL,
      emotionIntensity: 50
    };
  }

  /**
   * 生成环境响应
   * @private
   * @param {Object} agent - 角色对象
   * @param {Object} context - 响应上下文
   * @param {Object} options - 响应选项
   * @returns {Promise<Object>} 响应对象
   */
  async _generateEnvironmentResponse(agent, context, options) {
    // 环境响应通常是描述性的
    return {
      type: ResponseType.DIALOGUE,
      content: this._generateEnvironmentDescription(context),
      emotion: null
    };
  }

  /**
   * 确定响应类型
   * @private
   * @param {Object} context - 响应上下文
   * @returns {string} 响应类型
   */
  _determineResponseType(context) {
    const { agent, action, relationship } = context;
    
    // 如果是直接对话，通常回复对话
    if (action.type === 'dialogue' && action.targetId === agent.id) {
      return ResponseType.DIALOGUE;
    }
    
    // 如果是情绪激烈的情况，可能触发情绪响应
    if (agent.emotionIntensity > 70) {
      return ResponseType.EMOTION;
    }
    
    // 如果是需要决策的情况
    if (action.content.includes('请求') || action.content.includes('帮助')) {
      return ResponseType.DECISION;
    }
    
    // 如果关系非常差，可能拒绝响应
    if (relationship && relationship.trust < 20) {
      return Math.random() > 0.7 ? ResponseType.REJECTION : ResponseType.DIALOGUE;
    }
    
    // 默认为对话响应
    return ResponseType.DIALOGUE;
  }

  /**
   * 生成对话响应
   * @private
   * @param {Object} agent - 角色对象
   * @param {Object} context - 响应上下文
   * @returns {Object} 对话响应对象
   */
  _generateDialogueResponse(agent, context) {
    // 在实际应用中，这里会调用LLM生成对话内容
    // 现在使用模板生成简单响应
    
    const { action, relationship } = context;
    
    // 根据关系和行为内容生成响应
    let content = '';
    let emotion = agent.currentEmotion;
    
    if (action.content.includes('你好') || action.content.includes('嗨')) {
      content = `你好，${action.actorName}。很高兴见到你。`;
      emotion = EmotionalState.HAPPY;
    } else if (action.content.includes('谢谢') || action.content.includes('感谢')) {
      content = '不客气，这是我应该做的。';
      emotion = EmotionalState.HAPPY;
    } else if (action.content.includes('抱歉') || action.content.includes('对不起')) {
      content = relationship && relationship.trust > 60 ? 
        '没关系，我理解。' : '嗯，我接受你的道歉。';
      emotion = relationship && relationship.trust > 60 ? 
        EmotionalState.HAPPY : EmotionalState.NEUTRAL;
    } else if (action.content.includes('再见')) {
      content = '再见，保重。';
      emotion = EmotionalState.NEUTRAL;
    } else {
      // 默认响应
      const responses = [
        '我明白你的意思。',
        '有意思的观点。',
        '让我想想...',
        '我需要考虑一下这个。'
      ];
      content = responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 使用模板格式化响应
    const formattedResponse = this._formatResponse(agent, content, emotion);
    
    return {
      type: ResponseType.DIALOGUE,
      content: formattedResponse,
      rawContent: content,
      emotion,
      emotionIntensity: this._calculateEmotionIntensity(agent, context)
    };
  }

  /**
   * 生成行为响应
   * @private
   * @param {Object} agent - 角色对象
   * @param {Object} context - 响应上下文
   * @returns {Object} 行为响应对象
   */
  _generateActionResponse(agent, context) {
    // 在实际应用中，这里会调用LLM生成行为内容
    // 现在使用简单逻辑生成
    
    const { action } = context;
    
    // 根据触发行为生成响应行为
    let content = '';
    let emotion = agent.currentEmotion;
    
    if (action.content.includes('攻击') || action.content.includes('伤害')) {
      content = `${agent.name}迅速躲避，试图保护自己。`;
      emotion = EmotionalState.FEARFUL;
    } else if (action.content.includes('给予') || action.content.includes('递给')) {
      content = `${agent.name}接过物品，仔细查看。`;
      emotion = EmotionalState.NEUTRAL;
    } else if (action.content.includes('拥抱')) {
      content = `${agent.name}回应了拥抱。`;
      emotion = EmotionalState.HAPPY;
    } else {
      // 默认行为
      content = `${agent.name}观察着情况，等待下一步行动。`;
    }
    
    return {
      type: ResponseType.ACTION,
      content,
      emotion,
      emotionIntensity: this._calculateEmotionIntensity(agent, context)
    };
  }

  /**
   * 生成情绪响应
   * @private
   * @param {Object} agent - 角色对象
   * @param {Object} context - 响应上下文
   * @returns {Object} 情绪响应对象
   */
  _generateEmotionResponse(agent, context) {
    // 根据当前情绪和上下文生成情绪响应
    
    const { action } = context;
    let content = '';
    let newEmotion = agent.currentEmotion;
    
    switch (agent.currentEmotion) {
      case EmotionalState.HAPPY:
        content = `${agent.name}笑容满面，看起来心情很好。`;
        break;
      
      case EmotionalState.SAD:
        content = `${agent.name}低下头，眼中含着泪水。`;
        break;
      
      case EmotionalState.ANGRY:
        content = `${agent.name}握紧拳头，怒视着${action.actorName}。`;
        break;
      
      case EmotionalState.FEARFUL:
        content = `${agent.name}颤抖着后退几步，警惕地看着周围。`;
        break;
      
      case EmotionalState.DISGUSTED:
        content = `${agent.name}皱起眉头，表情厌恶。`;
        break;
      
      case EmotionalState.SURPRISED:
        content = `${agent.name}睁大眼睛，一时说不出话来。`;
        break;
      
      default:
        content = `${agent.name}的表情变得难以捉摸。`;
        break;
    }
    
    return {
      type: ResponseType.EMOTION,
      content,
      emotion: newEmotion,
      emotionIntensity: this._calculateEmotionIntensity(agent, context)
    };
  }

  /**
   * 生成决策响应
   * @private
   * @param {Object} agent - 角色对象
   * @param {Object} context - 响应上下文
   * @returns {Object} 决策响应对象
   */
  _generateDecisionResponse(agent, context) {
    // 根据性格和关系做出决策
    
    const { relationship } = context;
    const personality = agent.personality;
    
    // 计算决策倾向
    let cooperationScore = 0;
    
    // 性格因素
    cooperationScore += (personality[PersonalityTrait.AGREEABLENESS] - 50) * 0.5;
    cooperationScore += (personality[PersonalityTrait.EXTRAVERSION] - 50) * 0.3;
    cooperationScore += (50 - personality[PersonalityTrait.NEUROTICISM]) * 0.2;
    
    // 关系因素
    if (relationship) {
      cooperationScore += (relationship.trust - 50) * 0.6;
      cooperationScore += (relationship.respect - 50) * 0.4;
    }
    
    // 确定决策类型
    let decisionType;
    let content = '';
    let emotion;
    
    if (cooperationScore > 30) {
      decisionType = DecisionType.COOPERATE;
      content = `${agent.name}决定合作，"我会帮助你的。"`;
      emotion = EmotionalState.HAPPY;
    } else if (cooperationScore > 10) {
      decisionType = DecisionType.HELP;
      content = `${agent.name}点点头，"我可以试试看。"`;
      emotion = EmotionalState.NEUTRAL;
    } else if (cooperationScore > -10) {
      decisionType = DecisionType.NEUTRAL;
      content = `${agent.name}犹豫了一下，"我需要考虑一下。"`;
      emotion = EmotionalState.NEUTRAL;
    } else if (cooperationScore > -30) {
      decisionType = DecisionType.AVOID;
      content = `${agent.name}摇摇头，"恐怕我不能参与这个。"`;
      emotion = EmotionalState.FEARFUL;
    } else {
      decisionType = DecisionType.COMPETE;
      content = `${agent.name}冷笑一声，"别指望我会帮你。"`;
      emotion = EmotionalState.ANGRY;
    }
    
    return {
      type: ResponseType.DECISION,
      content,
      decisionType,
      emotion,
      emotionIntensity: this._calculateEmotionIntensity(agent, context)
    };
  }

  /**
   * 生成叙述描述
   * @private
   * @param {Object} context - 响应上下文
   * @returns {string} 叙述描述
   */
  _generateNarrativeDescription(context) {
    // 在实际应用中，这里会调用LLM生成叙述
    // 现在使用简单模板
    
    const { action, environment } = context;
    
    return `在${environment.locationName}，${action.actorName}${action.content}。
周围的环境${environment.locationDescription}。`;
  }

  /**
   * 生成环境描述
   * @private
   * @param {Object} context - 响应上下文
   * @returns {string} 环境描述
   */
  _generateEnvironmentDescription(context) {
    // 在实际应用中，这里会调用LLM生成环境描述
    // 现在使用简单描述
    
    const { environment } = context;
    
    return `${environment.locationName}: ${environment.locationDescription}`;
  }

  /**
   * 格式化响应
   * @private
   * @param {Object} agent - 角色对象
   * @param {string} content - 响应内容
   * @param {string} emotion - 情绪状态
   * @returns {string} 格式化的响应
   */
  _formatResponse(agent, content, emotion) {
    // 获取情绪对应的模板
    const templates = this.responseTemplates[emotion] || this.responseTemplates[EmotionalState.NEUTRAL];
    
    // 随机选择一个模板
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // 替换模板变量
    return template
      .replace('{{name}}', agent.name)
      .replace('{{content}}', content);
  }

  /**
   * 计算情绪强度
   * @private
   * @param {Object} agent - 角色对象
   * @param {Object} context - 响应上下文
   * @returns {number} 情绪强度(0-100)
   */
  _calculateEmotionIntensity(agent, context) {
    // 基础强度
    let intensity = agent.emotionIntensity || 50;
    
    // 根据性格调整
    const neuroticism = agent.personality[PersonalityTrait.NEUROTICISM] || 50;
    intensity = intensity * (1 + (neuroticism - 50) / 100);
    
    // 确保在0-100范围内
    return Math.max(0, Math.min(100, intensity));
  }

  /**
   * 生成多个角色的响应
   * @param {Array} agentIds - 角色ID数组
   * @param {Object} action - 触发响应的行为
   * @param {Object} [options={}] - 响应选项
   * @returns {Promise<Array>} 响应对象数组
   */
  async generateMultipleResponses(agentIds, action, options = {}) {
    const responses = [];
    
    for (const agentId of agentIds) {
      try {
        const response = await this.generateResponse(agentId, action, options);
        responses.push({
          agentId,
          response
        });
      } catch (error) {
        console.error(`生成角色 ${agentId} 的响应失败:`, error);
        responses.push({
          agentId,
          response: {
            type: ResponseType.REJECTION,
            content: '无法生成响应',
            error: error.message
          }
        });
      }
    }
    
    return responses;
  }

  /**
   * 生成场景中所有相关角色的响应
   * @param {Object} action - 触发响应的行为
   * @param {Object} [options={}] - 响应选项
   * @returns {Promise<Array>} 响应对象数组
   */
  async generateSceneResponses(action, options = {}) {
    // 获取当前场景中的所有NPC
    const state = gameState.getState();
    const currentLocation = state.environment?.currentLocation || '';
    
    // 筛选出在当前位置的NPC
    const npcs = agentRegistry.getAgentsByType(AgentType.NPC)
      .filter(agent => agent.location === currentLocation);
    
    // 获取NPC的ID
    const npcIds = npcs.map(npc => npc.id);
    
    // 添加GM
    npcIds.push('gm');
    
    // 生成响应
    return this.generateMultipleResponses(npcIds, action, options);
  }
}

// 创建单例实例
const agentPolicy = new AgentPolicy();

export default agentPolicy;
