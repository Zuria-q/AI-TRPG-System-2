/**
 * prompt_builder.js
 * 构建提示模板，用于生成LLM请求
 */

import gameState from './game_state';
import historyManager from './history';
import agentRegistry, { AgentType } from './agent_registry';
import trustMap from './trust_map';

/**
 * 提示类型枚举
 * @readonly
 * @enum {string}
 */
export const PromptType = {
  /** 角色响应提示 */
  AGENT_RESPONSE: 'agent_response',
  /** 环境描述提示 */
  ENVIRONMENT_DESCRIPTION: 'environment_description',
  /** 故事进展提示 */
  STORY_PROGRESSION: 'story_progression',
  /** 对话生成提示 */
  DIALOGUE_GENERATION: 'dialogue_generation',
  /** 行为结果提示 */
  ACTION_RESULT: 'action_result',
  /** 世界构建提示 */
  WORLD_BUILDING: 'world_building',
  /** 角色创建提示 */
  CHARACTER_CREATION: 'character_creation'
};

/**
 * 提示模板类
 * 负责构建各种提示模板
 */
class PromptBuilder {
  constructor() {
    // 基础模板
    this.templates = {
      [PromptType.AGENT_RESPONSE]: this._agentResponseTemplate,
      [PromptType.ENVIRONMENT_DESCRIPTION]: this._environmentDescriptionTemplate,
      [PromptType.STORY_PROGRESSION]: this._storyProgressionTemplate,
      [PromptType.DIALOGUE_GENERATION]: this._dialogueGenerationTemplate,
      [PromptType.ACTION_RESULT]: this._actionResultTemplate,
      [PromptType.WORLD_BUILDING]: this._worldBuildingTemplate,
      [PromptType.CHARACTER_CREATION]: this._characterCreationTemplate
    };
  }

  /**
   * 构建提示
   * @param {string} promptType - 提示类型
   * @param {Object} context - 上下文对象
   * @returns {Object} 提示对象，包含提示文本和元数据
   */
  buildPrompt(promptType, context) {
    const templateFn = this.templates[promptType];
    
    if (!templateFn) {
      throw new Error(`未知的提示类型: ${promptType}`);
    }
    
    // 获取游戏状态
    const state = gameState.getState();
    
    // 构建基础上下文
    const baseContext = {
      ...context,
      gameState: state,
      currentTurn: state.turn,
      currentPhase: state.phase
    };
    
    // 调用模板函数生成提示
    const prompt = templateFn.call(this, baseContext);
    
    // 添加元数据
    return {
      text: prompt,
      type: promptType,
      timestamp: new Date().toISOString(),
      context: baseContext
    };
  }

  /**
   * 角色响应提示模板
   * @private
   * @param {Object} context - 上下文对象
   * @returns {string} 提示文本
   */
  _agentResponseTemplate(context) {
    const { agent, action, history } = context;
    
    if (!agent) {
      throw new Error('缺少角色信息');
    }
    
    // 获取角色信息
    const agentInfo = typeof agent === 'string' ? 
      agentRegistry.getAgent(agent) : agent;
    
    if (!agentInfo) {
      throw new Error(`角色不存在: ${agent}`);
    }
    
    // 获取与行为执行者的关系
    let relationship = null;
    if (action && action.actorId && action.actorId !== agentInfo.id) {
      relationship = trustMap.getRelationship(agentInfo.id, action.actorId);
    }
    
    // 构建历史上下文
    const historyContext = history || historyManager.getRecentHistory(10);
    const formattedHistory = this._formatHistoryForPrompt(historyContext);
    
    // 构建角色卡信息
    const characterCard = this._buildCharacterCardPrompt(agentInfo);
    
    // 构建当前场景信息
    const sceneInfo = this._buildSceneInfoPrompt(context);
    
    // 构建提示文本
    return `你是一个角色扮演AI，现在你将扮演以下角色：

${characterCard}

当前场景：
${sceneInfo}

历史记录：
${formattedHistory}

${action ? `最近的行为：
类型：${action.type}
执行者：${action.actorName || action.actorId || '未知'}
内容：${action.content}
${action.targetId === agentInfo.id ? '这个行为直接针对你。' : ''}` : ''}

${relationship ? `与行为执行者的关系：
类型：${relationship.type}
信任度：${relationship.factors?.trust || 50}/100
亲密度：${relationship.factors?.intimacy || 0}/100
尊重度：${relationship.factors?.respect || 50}/100` : ''}

请根据你的角色设定、当前情绪状态、与其他角色的关系以及场景上下文，生成一个合适的响应。
响应应该反映你的性格特点、当前情绪和对事件的态度。

请用第一人称回应，不要在回应中包含旁白或动作描述。`;
  }

  /**
   * 环境描述提示模板
   * @private
   * @param {Object} context - 上下文对象
   * @returns {string} 提示文本
   */
  _environmentDescriptionTemplate(context) {
    const { locationId, details } = context;
    const state = gameState.getState();
    
    // 获取位置信息
    const location = locationId ? 
      state.environment?.locations?.[locationId] : 
      state.environment?.locations?.[state.environment?.currentLocation];
    
    if (!location) {
      throw new Error(`位置不存在: ${locationId || state.environment?.currentLocation}`);
    }
    
    // 获取位置中的角色
    const charactersInLocation = agentRegistry.getAllAgents()
      .filter(agent => agent.location === (locationId || state.environment?.currentLocation))
      .map(agent => ({
        id: agent.id,
        name: agent.name,
        type: agent.type,
        description: agent.description
      }));
    
    // 构建提示文本
    return `请为以下游戏场景生成一段详细的环境描述：

位置名称：${location.name}
基本描述：${location.description || '无描述'}
时间：${state.environment?.currentTime || '未知'}
天气：${state.environment?.currentWeather || '未知'}

${details ? `额外细节：${details}` : ''}

该位置的角色：
${charactersInLocation.length > 0 ? 
  charactersInLocation.map(char => `- ${char.name}：${char.description || '无描述'}`).join('\n') : 
  '没有角色在此位置'}

请生成一段生动、详细的环境描述，包括视觉、听觉、嗅觉等感官细节，以及环境的氛围和情绪。
描述应该有助于玩家想象自己身处其中的感觉。
不要包含角色的对话或行动，只描述环境本身。`;
  }

  /**
   * 故事进展提示模板
   * @private
   * @param {Object} context - 上下文对象
   * @returns {string} 提示文本
   */
  _storyProgressionTemplate(context) {
    const { currentPlot, direction, intensity } = context;
    const state = gameState.getState();
    
    // 获取最近的历史记录
    const recentHistory = historyManager.getRecentHistory(15);
    const formattedHistory = this._formatHistoryForPrompt(recentHistory);
    
    // 构建提示文本
    return `作为游戏主持人，请根据当前故事情况，生成下一步的故事发展：

当前故事概要：
${currentPlot || state.storyInfo?.currentPlot || '无具体情节'}

世界背景：
${state.worldBook?.mainSetting || '无具体背景'}

最近的事件：
${formattedHistory}

${direction ? `期望的发展方向：${direction}` : ''}
${intensity ? `事件强度（1-10）：${intensity}` : ''}

请生成接下来的故事发展，包括：
1. 新的事件或转折
2. 可能出现的冲突或挑战
3. NPC的可能反应
4. 环境或场景的变化

故事发展应该符合当前的情境和角色设定，并为玩家提供有趣的互动机会。
请避免直接解决所有问题或创造无法克服的障碍。`;
  }

  /**
   * 对话生成提示模板
   * @private
   * @param {Object} context - 上下文对象
   * @returns {string} 提示文本
   */
  _dialogueGenerationTemplate(context) {
    const { characters, topic, tone, length } = context;
    
    // 获取角色信息
    const characterInfos = [];
    if (Array.isArray(characters)) {
      for (const charId of characters) {
        const agent = agentRegistry.getAgent(charId);
        if (agent) {
          characterInfos.push({
            id: agent.id,
            name: agent.name,
            description: agent.description,
            personality: agent.personality,
            dialogueStyle: agent.dialogueStyle
          });
        }
      }
    }
    
    // 构建角色关系信息
    const relationships = [];
    for (let i = 0; i < characterInfos.length; i++) {
      for (let j = i + 1; j < characterInfos.length; j++) {
        const char1 = characterInfos[i];
        const char2 = characterInfos[j];
        const relationship = trustMap.getRelationship(char1.id, char2.id);
        
        if (relationship) {
          relationships.push({
            character1: char1.name,
            character2: char2.name,
            type: relationship.type,
            trust: relationship.factors?.trust || 50
          });
        }
      }
    }
    
    // 构建提示文本
    return `请为以下角色生成一段对话：

参与角色：
${characterInfos.map(char => 
  `- ${char.name}：${char.description || '无描述'}
   对话风格：${char.dialogueStyle || '无特定风格'}`
).join('\n')}

${relationships.length > 0 ? `角色关系：
${relationships.map(rel => 
  `- ${rel.character1} 和 ${rel.character2}：${rel.type}关系，信任度 ${rel.trust}/100`
).join('\n')}` : ''}

对话主题：${topic || '自由发挥'}
对话语气：${tone || '根据角色性格决定'}
对话长度：${length || '适中'}

请根据角色的性格特点和彼此的关系，生成一段自然、符合人物设定的对话。
对话应该展现角色的个性和他们之间的关系动态。
请使用以下格式：

角色名：对话内容`;
  }

  /**
   * 行为结果提示模板
   * @private
   * @param {Object} context - 上下文对象
   * @returns {string} 提示文本
   */
  _actionResultTemplate(context) {
    const { action, actor, difficulty, randomFactor } = context;
    
    if (!action) {
      throw new Error('缺少行为信息');
    }
    
    // 获取角色信息
    const actorInfo = actor ? 
      (typeof actor === 'string' ? agentRegistry.getAgent(actor) : actor) : 
      null;
    
    // 构建提示文本
    return `请为以下游戏行为生成一个结果描述：

行为类型：${action.type}
行为内容：${action.content}
执行者：${actorInfo ? actorInfo.name : action.actorName || action.actorId || '未知'}
${action.targetId ? `目标：${action.targetName || action.targetId}` : ''}

${actorInfo ? `执行者信息：
- 描述：${actorInfo.description || '无描述'}
- 相关技能：${JSON.stringify(actorInfo.skills || {})}` : ''}

${difficulty ? `难度等级（1-10）：${difficulty}` : ''}
${randomFactor ? `随机因素（1-10）：${randomFactor}` : ''}

请生成这个行为的结果描述，包括：
1. 行为的直接效果
2. 可能的副作用或意外情况
3. 对周围环境或角色的影响

结果应该符合逻辑，并考虑角色的能力和行为的难度。
如果有随机因素，请适当引入一些不确定性。
描述应该生动具体，避免模糊或过于概括的表述。`;
  }

  /**
   * 世界构建提示模板
   * @private
   * @param {Object} context - 上下文对象
   * @returns {string} 提示文本
   */
  _worldBuildingTemplate(context) {
    const { theme, elements, tone, detail } = context;
    const state = gameState.getState();
    
    // 获取现有世界设定
    const existingWorld = state.worldBook || {};
    
    // 构建提示文本
    return `请为一个TRPG游戏创建或扩展以下世界设定：

${existingWorld.mainSetting ? `现有世界背景：
${existingWorld.mainSetting}` : ''}

主题：${theme || '未指定'}
${elements ? `需要包含的元素：${elements}` : ''}
语调：${tone || '适中'}
细节程度：${detail || '中等'}

请创建以下内容：

1. 世界概述
   - 基本设定和背景
   - 世界历史的关键事件
   - 当前世界状态

2. 地理环境
   - 主要地区或位置描述
   - 特殊地标或重要场所
   - 环境特征和气候

3. 社会结构
   - 主要种族或群体
   - 政治体系和权力结构
   - 经济系统和贸易

4. 文化与信仰
   - 主要宗教或信仰系统
   - 文化习俗和传统
   - 艺术、音乐和文学

5. 魔法或科技系统
   - 基本原理和限制
   - 常见应用和影响
   - 特殊能力或装置

请确保设定具有内部一致性，并为玩家提供足够的探索和互动空间。
避免过于复杂或难以理解的设定，保持可玩性和趣味性。`;
  }

  /**
   * 角色创建提示模板
   * @private
   * @param {Object} context - 上下文对象
   * @returns {string} 提示文本
   */
  _characterCreationTemplate(context) {
    const { type, role, traits, background } = context;
    const state = gameState.getState();
    
    // 获取世界设定
    const worldSetting = state.worldBook?.mainSetting || '无特定世界设定';
    
    // 构建提示文本
    return `请为TRPG游戏创建一个详细的角色设定：

角色类型：${type || AgentType.NPC}
角色角色：${role || '未指定'}
${traits ? `性格特点：${traits}` : ''}
${background ? `背景要素：${background}` : ''}

世界设定：
${worldSetting}

请创建以下内容：

1. 基本信息
   - 姓名
   - 年龄
   - 性别
   - 外貌描述

2. 背景故事
   - 成长经历
   - 关键事件
   - 动机和目标

3. 性格特质
   - 主要性格特点
   - 优点和缺点
   - 恐惧和喜好

4. 关系网络
   - 家人和朋友
   - 盟友和敌人
   - 社会地位

5. 能力和技能
   - 专长领域
   - 特殊能力
   - 弱点和限制

6. 对话风格
   - 说话方式
   - 常用语和口头禅
   - 表达习惯

请确保角色设定符合世界背景，并具有深度和复杂性。
角色应该有明确的动机和目标，以及足够的冲突点和发展空间。
避免创建完美无缺或单一维度的角色，应该有明显的优点和缺点。`;
  }

  /**
   * 格式化历史记录用于提示
   * @private
   * @param {Array} history - 历史记录
   * @returns {string} 格式化的历史记录
   */
  _formatHistoryForPrompt(history) {
    if (!history || history.length === 0) {
      return '无历史记录';
    }
    
    return history.map(entry => {
      const timestamp = entry.timestamp ? 
        new Date(entry.timestamp).toLocaleTimeString() : '';
      
      switch (entry.type) {
        case 'action':
          return `[${timestamp}] ${entry.actorName || entry.actorId}: ${entry.content}`;
        
        case 'npc_response':
          return `[${timestamp}] ${entry.npcId}: ${entry.content}`;
        
        case 'environment':
          return `[${timestamp}] 环境: ${entry.description}`;
        
        case 'system':
          return `[${timestamp}] 系统: ${entry.message}`;
        
        default:
          return `[${timestamp}] ${JSON.stringify(entry)}`;
      }
    }).join('\n');
  }

  /**
   * 构建角色卡提示
   * @private
   * @param {Object} agent - 角色对象
   * @returns {string} 角色卡提示
   */
  _buildCharacterCardPrompt(agent) {
    if (!agent) {
      return '无角色信息';
    }
    
    return `角色名称：${agent.name}
角色类型：${agent.type}
描述：${agent.description || '无描述'}
背景：${agent.background || '无背景'}
外貌：${agent.appearance || '无外貌描述'}

性格特质：
- 开放性：${agent.personality?.openness || 50}/100
- 尽责性：${agent.personality?.conscientiousness || 50}/100
- 外向性：${agent.personality?.extraversion || 50}/100
- 亲和性：${agent.personality?.agreeableness || 50}/100
- 神经质：${agent.personality?.neuroticism || 50}/100

目标：${Array.isArray(agent.goals) ? agent.goals.join(', ') : agent.goals || '无特定目标'}
动机：${Array.isArray(agent.motivations) ? agent.motivations.join(', ') : agent.motivations || '无特定动机'}
恐惧：${Array.isArray(agent.fears) ? agent.fears.join(', ') : agent.fears || '无特定恐惧'}

当前情绪：${agent.currentEmotion || '中性'}（强度：${agent.emotionIntensity || 50}/100）
对话风格：${agent.dialogueStyle || '无特定风格'}`;
  }

  /**
   * 构建场景信息提示
   * @private
   * @param {Object} context - 上下文对象
   * @returns {string} 场景信息提示
   */
  _buildSceneInfoPrompt(context) {
    const state = gameState.getState();
    
    // 获取当前位置
    const currentLocation = state.environment?.currentLocation || 'unknown';
    const location = state.environment?.locations?.[currentLocation] || { 
      name: '未知位置', 
      description: '无描述' 
    };
    
    // 获取当前位置的其他角色
    const charactersInLocation = agentRegistry.getAllAgents()
      .filter(agent => agent.location === currentLocation && agent.id !== context.agent?.id)
      .map(agent => agent.name)
      .join(', ');
    
    return `位置：${location.name}
描述：${location.description}
时间：${state.environment?.currentTime || '未知'}
天气：${state.environment?.currentWeather || '未知'}
其他在场角色：${charactersInLocation || '无'}`;
  }

  /**
   * 自定义提示模板
   * @param {string} templateName - 模板名称
   * @param {Function} templateFunction - 模板函数
   */
  registerCustomTemplate(templateName, templateFunction) {
    if (typeof templateFunction !== 'function') {
      throw new Error('模板必须是一个函数');
    }
    
    this.templates[templateName] = templateFunction;
  }

  /**
   * 获取所有可用的提示类型
   * @returns {Array} 提示类型数组
   */
  getAvailablePromptTypes() {
    return Object.keys(this.templates);
  }
}

// 创建单例实例
const promptBuilder = new PromptBuilder();

export default promptBuilder;
