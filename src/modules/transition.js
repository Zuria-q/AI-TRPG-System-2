/**
 * transition.js
 * 实现状态转移函数，处理行为对游戏状态的影响
 */

import gameState from './game_state';
import { ActionType, TargetType } from './action_space';

/**
 * 状态转移类
 * 负责处理行为对游戏状态的影响，实现状态转移
 */
class StateTransition {
  /**
   * 处理行为并更新游戏状态
   * @param {Object} action - 行为对象
   * @param {Object} currentState - 当前游戏状态
   * @returns {Object} 更新后的游戏状态
   */
  processAction(action, currentState = null) {
    // 如果没有提供当前状态，使用gameState中的状态
    const state = currentState || gameState.getState();
    
    // 根据行为类型调用不同的处理函数
    switch (action.type) {
      case ActionType.DIALOGUE:
        return this._processDialogue(action, state);
      case ActionType.ACTION:
        return this._processPhysicalAction(action, state);
      case ActionType.ITEM:
        return this._processItemAction(action, state);
      default:
        console.warn(`未知的行为类型: ${action.type}`);
        return state;
    }
  }

  /**
   * 处理对话行为
   * @private
   * @param {Object} action - 对话行为对象
   * @param {Object} state - 当前游戏状态
   * @returns {Object} 更新后的游戏状态
   */
  _processDialogue(action, state) {
    // 创建状态副本，避免直接修改原状态
    const newState = { ...state };
    
    // 更新最后交互时间
    newState.updatedAt = new Date().toISOString();
    
    // 如果有目标角色，可能影响与该角色的关系
    if (action.targetType === TargetType.CHARACTER && action.targetId) {
      // 这里可以添加关系变化的逻辑
      // 例如根据对话内容分析情感，调整信任度等
    }
    
    // 返回更新后的状态
    return newState;
  }

  /**
   * 处理物理行为
   * @private
   * @param {Object} action - 物理行为对象
   * @param {Object} state - 当前游戏状态
   * @returns {Object} 更新后的游戏状态
   */
  _processPhysicalAction(action, state) {
    // 创建状态副本
    const newState = { ...state };
    
    // 更新最后交互时间
    newState.updatedAt = new Date().toISOString();
    
    // 根据目标类型处理不同的影响
    switch (action.targetType) {
      case TargetType.CHARACTER:
        // 处理针对角色的行为
        return this._processCharacterTargetedAction(action, newState);
      
      case TargetType.ENVIRONMENT:
        // 处理针对环境的行为
        return this._processEnvironmentTargetedAction(action, newState);
      
      case TargetType.ITEM:
        // 处理针对物品的行为
        return this._processItemTargetedAction(action, newState);
      
      default:
        // 无特定目标的行为
        return newState;
    }
  }

  /**
   * 处理物品行为
   * @private
   * @param {Object} action - 物品行为对象
   * @param {Object} state - 当前游戏状态
   * @returns {Object} 更新后的游戏状态
   */
  _processItemAction(action, state) {
    // 创建状态副本
    const newState = { ...state };
    
    // 更新最后交互时间
    newState.updatedAt = new Date().toISOString();
    
    // 检查物品是否存在于玩家背包或环境中
    const itemId = action.itemId;
    let itemFound = false;
    
    // 检查玩家背包
    if (newState.player && newState.player.inventory) {
      itemFound = newState.player.inventory.some(item => item.id === itemId);
    }
    
    // 如果玩家背包中没有，检查当前位置
    if (!itemFound && newState.environment && newState.environment.locations) {
      const currentLocation = newState.environment.currentLocation;
      const location = newState.environment.locations[currentLocation];
      
      if (location && location.objects) {
        itemFound = location.objects.some(obj => obj.id === itemId);
      }
    }
    
    // 如果物品不存在，不进行状态更新
    if (!itemFound) {
      console.warn(`物品不存在: ${itemId}`);
      return newState;
    }
    
    // 根据目标类型处理不同的影响
    switch (action.targetType) {
      case TargetType.CHARACTER:
        // 处理针对角色使用物品
        return this._processItemOnCharacter(action, newState);
      
      case TargetType.ENVIRONMENT:
        // 处理针对环境使用物品
        return this._processItemOnEnvironment(action, newState);
      
      case TargetType.ITEM:
        // 处理物品与物品的交互
        return this._processItemOnItem(action, newState);
      
      default:
        // 无特定目标的物品使用
        return this._processItemGeneral(action, newState);
    }
  }

  /**
   * 处理针对角色的行为
   * @private
   * @param {Object} action - 行为对象
   * @param {Object} state - 当前游戏状态
   * @returns {Object} 更新后的游戏状态
   */
  _processCharacterTargetedAction(action, state) {
    // 获取目标角色
    const targetId = action.targetId;
    let targetCharacter = null;
    
    // 检查目标是否为玩家
    if (targetId === 'player') {
      targetCharacter = state.player;
    } else {
      // 检查目标是否为NPC
      targetCharacter = state.agents.find(agent => agent.id === targetId);
    }
    
    // 如果目标不存在，不进行状态更新
    if (!targetCharacter) {
      console.warn(`目标角色不存在: ${targetId}`);
      return state;
    }
    
    // 根据行为内容和强度，可能会影响角色状态
    // 这里可以添加更复杂的逻辑，如伤害计算、状态效果等
    
    return state;
  }

  /**
   * 处理针对环境的行为
   * @private
   * @param {Object} action - 行为对象
   * @param {Object} state - 当前游戏状态
   * @returns {Object} 更新后的游戏状态
   */
  _processEnvironmentTargetedAction(action, state) {
    // 获取当前位置
    const currentLocation = state.environment.currentLocation;
    const location = state.environment.locations[currentLocation];
    
    // 如果当前位置不存在，不进行状态更新
    if (!location) {
      console.warn(`当前位置不存在: ${currentLocation}`);
      return state;
    }
    
    // 根据行为内容，可能会影响环境状态
    // 例如，移动物体、改变环境描述等
    
    return state;
  }

  /**
   * 处理针对物品的行为
   * @private
   * @param {Object} action - 行为对象
   * @param {Object} state - 当前游戏状态
   * @returns {Object} 更新后的游戏状态
   */
  _processItemTargetedAction(action, state) {
    // 获取目标物品
    const targetId = action.targetId;
    let targetItem = null;
    let targetLocation = null;
    
    // 检查玩家背包中是否有目标物品
    if (state.player && state.player.inventory) {
      targetItem = state.player.inventory.find(item => item.id === targetId);
      if (targetItem) {
        targetLocation = 'inventory';
      }
    }
    
    // 如果玩家背包中没有，检查当前位置
    if (!targetItem && state.environment && state.environment.locations) {
      const currentLocation = state.environment.currentLocation;
      const location = state.environment.locations[currentLocation];
      
      if (location && location.objects) {
        targetItem = location.objects.find(obj => obj.id === targetId);
        if (targetItem) {
          targetLocation = currentLocation;
        }
      }
    }
    
    // 如果目标物品不存在，不进行状态更新
    if (!targetItem) {
      console.warn(`目标物品不存在: ${targetId}`);
      return state;
    }
    
    // 根据行为内容，可能会影响物品状态
    // 例如，拾取物品、丢弃物品、使用物品等
    
    return state;
  }

  /**
   * 处理针对角色使用物品
   * @private
   * @param {Object} action - 行为对象
   * @param {Object} state - 当前游戏状态
   * @returns {Object} 更新后的游戏状态
   */
  _processItemOnCharacter(action, state) {
    // 类似于_processCharacterTargetedAction，但考虑物品效果
    return state;
  }

  /**
   * 处理针对环境使用物品
   * @private
   * @param {Object} action - 行为对象
   * @param {Object} state - 当前游戏状态
   * @returns {Object} 更新后的游戏状态
   */
  _processItemOnEnvironment(action, state) {
    // 类似于_processEnvironmentTargetedAction，但考虑物品效果
    return state;
  }

  /**
   * 处理物品与物品的交互
   * @private
   * @param {Object} action - 行为对象
   * @param {Object} state - 当前游戏状态
   * @returns {Object} 更新后的游戏状态
   */
  _processItemOnItem(action, state) {
    // 处理物品组合、物品改造等
    return state;
  }

  /**
   * 处理无特定目标的物品使用
   * @private
   * @param {Object} action - 行为对象
   * @param {Object} state - 当前游戏状态
   * @returns {Object} 更新后的游戏状态
   */
  _processItemGeneral(action, state) {
    // 处理自用物品、消耗品等
    return state;
  }

  /**
   * 应用状态转移
   * @param {Object} action - 行为对象
   * @returns {Object} 更新后的游戏状态
   */
  applyTransition(action) {
    // 获取当前状态
    const currentState = gameState.getState();
    
    // 处理行为并获取新状态
    const newState = this.processAction(action, currentState);
    
    // 更新游戏状态
    gameState.updateState(newState);
    
    // 返回更新后的状态
    return newState;
  }

  /**
   * 批量应用状态转移
   * @param {Array} actions - 行为对象数组
   * @returns {Object} 最终更新后的游戏状态
   */
  applyTransitions(actions) {
    // 获取当前状态
    let currentState = gameState.getState();
    
    // 依次处理每个行为
    for (const action of actions) {
      currentState = this.processAction(action, currentState);
    }
    
    // 更新游戏状态
    gameState.updateState(currentState);
    
    // 返回最终更新后的状态
    return currentState;
  }
}

// 创建单例实例
const transition = new StateTransition();

export default transition;
