import React, { useState, useEffect, useRef } from 'react';
import { ActionType, TargetType, parseActionInput } from '../modules/action_space';

/**
 * 行为输入面板组件
 * 用于玩家输入行为、选择目标和发送行为
 * 
 * @param {Object} props - 组件属性
 * @param {function} props.onSubmitAction - 提交行为的回调函数
 * @param {Array} props.availableTargets - 可选目标列表
 * @param {string} props.currentActorId - 当前角色ID
 */
const TRPGActionPanel = ({ onSubmitAction, availableTargets = [], currentActorId = 'player' }) => {
  // 状态管理
  const [inputText, setInputText] = useState('');
  const [actionType, setActionType] = useState(ActionType.DIALOGUE);
  const [targetType, setTargetType] = useState(TargetType.NONE);
  const [targetId, setTargetId] = useState('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [actionOptions, setActionOptions] = useState({
    tone: '',
    emotion: '',
    intensity: 50,
    bodyPart: '',
    isStealthy: false,
    effect: ''
  });
  
  // 引用
  const textareaRef = useRef(null);
  
  // 监听输入变化，自动检测行为类型
  useEffect(() => {
    if (inputText) {
      const { type, content } = parseActionInput(inputText);
      if (type !== actionType) {
        setActionType(type);
      }
    }
  }, [inputText]);
  
  // 根据行为类型重置目标类型
  useEffect(() => {
    if (actionType === ActionType.DIALOGUE) {
      setTargetType(targetId ? TargetType.CHARACTER : TargetType.NONE);
    }
  }, [actionType, targetId]);
  
  // 处理输入变化
  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };
  
  // 处理行为类型变化
  const handleActionTypeChange = (e) => {
    setActionType(e.target.value);
  };
  
  // 处理目标类型变化
  const handleTargetTypeChange = (e) => {
    setTargetType(e.target.value);
    if (e.target.value === TargetType.NONE) {
      setTargetId('');
    }
  };
  
  // 处理目标ID变化
  const handleTargetIdChange = (e) => {
    setTargetId(e.target.value);
  };
  
  // 处理选项变化
  const handleOptionChange = (option, value) => {
    setActionOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };
  
  // 提交行为
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!inputText.trim()) return;
    
    // 构建行为对象
    const action = {
      type: actionType,
      actorId: currentActorId,
      content: inputText,
      targetType,
      targetId: targetId || null,
      timestamp: Date.now(),
      ...getRelevantOptions()
    };
    
    // 调用回调函数
    onSubmitAction(action);
    
    // 重置表单
    setInputText('');
    setTargetId('');
    setActionOptions({
      tone: '',
      emotion: '',
      intensity: 50,
      bodyPart: '',
      isStealthy: false,
      effect: ''
    });
    
    // 聚焦输入框
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  // 根据行为类型获取相关选项
  const getRelevantOptions = () => {
    switch (actionType) {
      case ActionType.DIALOGUE:
        return {
          tone: actionOptions.tone || null,
          emotion: actionOptions.emotion || null
        };
      case ActionType.ACTION:
        return {
          intensity: actionOptions.intensity || 50,
          bodyPart: actionOptions.bodyPart || null,
          isStealthy: actionOptions.isStealthy || false
        };
      case ActionType.ITEM:
        return {
          effect: actionOptions.effect || null
        };
      default:
        return {};
    }
  };
  
  // 渲染行为类型选择器
  const renderActionTypeSelector = () => (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">行为类型</label>
      <div className="flex space-x-2">
        <label className={`flex-1 p-2 border rounded-md cursor-pointer text-center ${actionType === ActionType.DIALOGUE ? 'bg-primary-100 border-primary-500 dark:bg-primary-900 dark:border-primary-400' : 'border-gray-300 dark:border-gray-700'}`}>
          <input
            type="radio"
            name="actionType"
            value={ActionType.DIALOGUE}
            checked={actionType === ActionType.DIALOGUE}
            onChange={handleActionTypeChange}
            className="sr-only"
          />
          <span>💬 对话</span>
        </label>
        <label className={`flex-1 p-2 border rounded-md cursor-pointer text-center ${actionType === ActionType.ACTION ? 'bg-primary-100 border-primary-500 dark:bg-primary-900 dark:border-primary-400' : 'border-gray-300 dark:border-gray-700'}`}>
          <input
            type="radio"
            name="actionType"
            value={ActionType.ACTION}
            checked={actionType === ActionType.ACTION}
            onChange={handleActionTypeChange}
            className="sr-only"
          />
          <span>🏃 动作</span>
        </label>
        <label className={`flex-1 p-2 border rounded-md cursor-pointer text-center ${actionType === ActionType.ITEM ? 'bg-primary-100 border-primary-500 dark:bg-primary-900 dark:border-primary-400' : 'border-gray-300 dark:border-gray-700'}`}>
          <input
            type="radio"
            name="actionType"
            value={ActionType.ITEM}
            checked={actionType === ActionType.ITEM}
            onChange={handleActionTypeChange}
            className="sr-only"
          />
          <span>🧰 物品</span>
        </label>
      </div>
    </div>
  );
  
  // 渲染目标选择器
  const renderTargetSelector = () => (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">目标</label>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <select
            value={targetType}
            onChange={handleTargetTypeChange}
            className="select"
          >
            <option value={TargetType.NONE}>无特定目标</option>
            <option value={TargetType.CHARACTER}>角色</option>
            <option value={TargetType.ENVIRONMENT}>环境/场景</option>
            <option value={TargetType.ITEM}>物品</option>
          </select>
        </div>
        {targetType !== TargetType.NONE && (
          <div>
            <select
              value={targetId}
              onChange={handleTargetIdChange}
              className="select"
              disabled={targetType === TargetType.NONE}
            >
              <option value="">选择具体目标...</option>
              {availableTargets
                .filter(target => target.type === targetType)
                .map(target => (
                  <option key={target.id} value={target.id}>
                    {target.name}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
  
  // 渲染高级选项
  const renderAdvancedOptions = () => {
    if (!showAdvancedOptions) return null;
    
    switch (actionType) {
      case ActionType.DIALOGUE:
        return (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">语气/语调</label>
              <input
                type="text"
                value={actionOptions.tone}
                onChange={(e) => handleOptionChange('tone', e.target.value)}
                placeholder="例如：愤怒、温柔、疑惑"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">情绪状态</label>
              <input
                type="text"
                value={actionOptions.emotion}
                onChange={(e) => handleOptionChange('emotion', e.target.value)}
                placeholder="例如：高兴、悲伤、紧张"
                className="input"
              />
            </div>
          </div>
        );
      case ActionType.ACTION:
        return (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">动作强度 ({actionOptions.intensity})</label>
              <input
                type="range"
                min="0"
                max="100"
                value={actionOptions.intensity}
                onChange={(e) => handleOptionChange('intensity', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">身体部位</label>
              <input
                type="text"
                value={actionOptions.bodyPart}
                onChange={(e) => handleOptionChange('bodyPart', e.target.value)}
                placeholder="例如：手、腿、头"
                className="input"
              />
            </div>
            <div className="col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={actionOptions.isStealthy}
                  onChange={(e) => handleOptionChange('isStealthy', e.target.checked)}
                  className="mr-2"
                />
                <span>隐蔽行动（其他角色可能不会注意到）</span>
              </label>
            </div>
          </div>
        );
      case ActionType.ITEM:
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">预期效果</label>
            <input
              type="text"
              value={actionOptions.effect}
              onChange={(e) => handleOptionChange('effect', e.target.value)}
              placeholder="例如：治疗、伤害、增益"
              className="input"
            />
          </div>
        );
      default:
        return null;
    }
  };
  
  // 渲染输入提示
  const renderInputPlaceholder = () => {
    switch (actionType) {
      case ActionType.DIALOGUE:
        return '输入对话内容，可以使用引号："你好，我是玩家"';
      case ActionType.ACTION:
        return '输入动作描述，可以使用方括号：【向前走了几步】';
      case ActionType.ITEM:
        return '输入物品使用方式，可以使用花括号：「使用治疗药水」';
      default:
        return '输入行为内容...';
    }
  };
  
  return (
    <div className="card">
      <h3 className="mb-4">行为输入</h3>
      <form onSubmit={handleSubmit}>
        {renderActionTypeSelector()}
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">内容</label>
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={handleInputChange}
            placeholder={renderInputPlaceholder()}
            className="textarea"
            rows="3"
            required
          />
        </div>
        
        {renderTargetSelector()}
        
        <div className="mb-4">
          <button
            type="button"
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          >
            {showAdvancedOptions ? '隐藏高级选项 ▲' : '显示高级选项 ▼'}
          </button>
        </div>
        
        {renderAdvancedOptions()}
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!inputText.trim()}
          >
            发送
          </button>
        </div>
      </form>
    </div>
  );
};

export default TRPGActionPanel;
