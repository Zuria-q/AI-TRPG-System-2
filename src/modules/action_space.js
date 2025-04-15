/**
 * action_space.js
 * 定义三类行为（对话/行动/物品）及其字段结构
 */

/**
 * 行为类型枚举
 * @readonly
 * @enum {string}
 */
export const ActionType = {
  /** 对话行为 - 角色说话 */
  DIALOGUE: 'dialogue',
  /** 动作行为 - 角色执行动作 */
  ACTION: 'action',
  /** 物品行为 - 角色使用物品 */
  ITEM: 'item'
};

/**
 * 行为目标类型枚举
 * @readonly
 * @enum {string}
 */
export const TargetType = {
  /** 无特定目标 */
  NONE: 'none',
  /** 目标为角色 */
  CHARACTER: 'character',
  /** 目标为环境/场景 */
  ENVIRONMENT: 'environment',
  /** 目标为物品 */
  ITEM: 'item'
};

/**
 * 基础行为结构
 * 所有行为类型的共同属性
 * @typedef {Object} BaseAction
 * @property {string} id - 行为唯一标识符
 * @property {ActionType} type - 行为类型
 * @property {string} actorId - 执行行为的角色ID
 * @property {string} content - 行为内容
 * @property {TargetType} targetType - 目标类型
 * @property {string} [targetId] - 目标ID（如果有）
 * @property {number} timestamp - 行为发生的时间戳
 * @property {Object} [metadata] - 额外元数据
 */

/**
 * 对话行为结构
 * @typedef {BaseAction} DialogueAction
 * @property {ActionType} type - 固定为 DIALOGUE
 * @property {string} content - 对话内容
 * @property {string} [tone] - 语气/语调
 * @property {string} [emotion] - 情绪状态
 */

/**
 * 动作行为结构
 * @typedef {BaseAction} PhysicalAction
 * @property {ActionType} type - 固定为 ACTION
 * @property {string} content - 动作描述
 * @property {number} [intensity] - 动作强度 (0-100)
 * @property {string} [bodyPart] - 涉及的身体部位
 * @property {boolean} [isStealthy] - 是否隐蔽行动
 */

/**
 * 物品行为结构
 * @typedef {BaseAction} ItemAction
 * @property {ActionType} type - 固定为 ITEM
 * @property {string} itemId - 物品ID
 * @property {string} content - 使用方式描述
 * @property {string} [effect] - 预期效果
 */

/**
 * 创建基础行为对象
 * @param {ActionType} type - 行为类型
 * @param {string} actorId - 执行者ID
 * @param {string} content - 行为内容
 * @param {TargetType} targetType - 目标类型
 * @param {string} [targetId] - 目标ID
 * @returns {BaseAction} 基础行为对象
 */
export function createBaseAction(type, actorId, content, targetType = TargetType.NONE, targetId = null) {
  return {
    id: generateActionId(),
    type,
    actorId,
    content,
    targetType,
    targetId,
    timestamp: Date.now(),
    metadata: {}
  };
}

/**
 * 创建对话行为
 * @param {string} actorId - 说话角色ID
 * @param {string} content - 对话内容
 * @param {string} [targetId] - 对话目标角色ID
 * @param {Object} [options] - 额外选项
 * @param {string} [options.tone] - 语气/语调
 * @param {string} [options.emotion] - 情绪状态
 * @returns {DialogueAction} 对话行为对象
 */
export function createDialogueAction(actorId, content, targetId = null, options = {}) {
  const action = createBaseAction(
    ActionType.DIALOGUE,
    actorId,
    content,
    targetId ? TargetType.CHARACTER : TargetType.NONE,
    targetId
  );
  
  return {
    ...action,
    tone: options.tone || null,
    emotion: options.emotion || null
  };
}

/**
 * 创建动作行为
 * @param {string} actorId - 执行动作角色ID
 * @param {string} content - 动作描述
 * @param {TargetType} targetType - 目标类型
 * @param {string} [targetId] - 目标ID
 * @param {Object} [options] - 额外选项
 * @param {number} [options.intensity] - 动作强度 (0-100)
 * @param {string} [options.bodyPart] - 涉及的身体部位
 * @param {boolean} [options.isStealthy] - 是否隐蔽行动
 * @returns {PhysicalAction} 动作行为对象
 */
export function createPhysicalAction(actorId, content, targetType = TargetType.NONE, targetId = null, options = {}) {
  const action = createBaseAction(
    ActionType.ACTION,
    actorId,
    content,
    targetType,
    targetId
  );
  
  return {
    ...action,
    intensity: options.intensity || 50,
    bodyPart: options.bodyPart || null,
    isStealthy: options.isStealthy || false
  };
}

/**
 * 创建物品行为
 * @param {string} actorId - 使用物品角色ID
 * @param {string} itemId - 物品ID
 * @param {string} content - 使用方式描述
 * @param {TargetType} targetType - 目标类型
 * @param {string} [targetId] - 目标ID
 * @param {Object} [options] - 额外选项
 * @param {string} [options.effect] - 预期效果
 * @returns {ItemAction} 物品行为对象
 */
export function createItemAction(actorId, itemId, content, targetType = TargetType.NONE, targetId = null, options = {}) {
  const action = createBaseAction(
    ActionType.ITEM,
    actorId,
    content,
    targetType,
    targetId
  );
  
  return {
    ...action,
    itemId,
    effect: options.effect || null
  };
}

/**
 * 生成唯一的行为ID
 * @returns {string} 唯一ID
 */
function generateActionId() {
  return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 解析文本输入，识别行为类型和内容
 * @param {string} input - 用户输入文本
 * @returns {Object} 解析结果，包含类型和内容
 */
export function parseActionInput(input) {
  // 默认为对话
  let type = ActionType.DIALOGUE;
  let content = input;
  
  // 检测动作标记 [动作] 或 【动作】
  const actionRegex = /^\s*[\[【](.+?)[\]】]\s*$/;
  const actionMatch = input.match(actionRegex);
  
  if (actionMatch) {
    type = ActionType.ACTION;
    content = actionMatch[1];
    return { type, content };
  }
  
  // 检测物品使用标记 {物品} 或 「物品」
  const itemRegex = /^\s*[{「](.+?)[}」]\s*$/;
  const itemMatch = input.match(itemRegex);
  
  if (itemMatch) {
    type = ActionType.ITEM;
    content = itemMatch[1];
    return { type, content };
  }
  
  // 检测对话标记 "对话" 或 "对话"
  const dialogueRegex = /^\s*[""](.+?)[""]?\s*$/;
  const dialogueMatch = input.match(dialogueRegex);
  
  if (dialogueMatch) {
    content = dialogueMatch[1];
  }
  
  return { type, content };
}

export default {
  ActionType,
  TargetType,
  createDialogueAction,
  createPhysicalAction,
  createItemAction,
  parseActionInput
};
