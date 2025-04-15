import React, { useState, useEffect } from 'react';
import agentRegistry, { AgentType, PersonalityTrait } from '../modules/agent_registry';
import trustMap from '../modules/trust_map';

/**
 * 角色管理面板组件
 * 用于查看和编辑游戏中的角色
 */
const CharacterPanel = () => {
  // 状态
  const [characters, setCharacters] = useState([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState('info'); // info, relationships, inventory, status

  // 加载角色数据
  useEffect(() => {
    loadCharacters();
  }, []);

  // 加载角色列表
  const loadCharacters = () => {
    const allCharacters = agentRegistry.getAllAgents();
    setCharacters(allCharacters);
    
    // 如果没有选中角色且有角色，选择第一个
    if (!selectedCharacterId && allCharacters.length > 0) {
      setSelectedCharacterId(allCharacters[0].id);
    }
  };

  // 获取选中的角色
  const selectedCharacter = selectedCharacterId 
    ? characters.find(char => char.id === selectedCharacterId) 
    : null;

  // 处理角色选择
  const handleSelectCharacter = (characterId) => {
    setSelectedCharacterId(characterId);
    setIsEditing(false);
    setIsCreating(false);
    setActiveTab('info');
  };

  // 处理创建角色
  const handleCreateCharacter = () => {
    setIsCreating(true);
    setIsEditing(false);
    setSelectedCharacterId(null);
    setFormData({
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
      dialogueStyle: '',
      location: 'default'
    });
  };

  // 处理编辑角色
  const handleEditCharacter = () => {
    if (!selectedCharacter) return;
    
    setIsEditing(true);
    setIsCreating(false);
    setFormData({...selectedCharacter});
  };

  // 处理删除角色
  const handleDeleteCharacter = () => {
    if (!selectedCharacter) return;
    
    if (window.confirm(`确定要删除角色 "${selectedCharacter.name}" 吗？`)) {
      agentRegistry.removeAgent(selectedCharacterId);
      loadCharacters();
      setSelectedCharacterId(null);
    }
  };

  // 处理表单变更
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('personality.')) {
      const trait = name.split('.')[1];
      setFormData({
        ...formData,
        personality: {
          ...formData.personality,
          [trait]: parseInt(value, 10)
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // 处理表单提交
  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    try {
      if (isCreating) {
        // 创建新角色
        agentRegistry.registerAgent(formData);
      } else if (isEditing) {
        // 更新现有角色
        agentRegistry.updateAgent(selectedCharacterId, formData);
      }
      
      // 重新加载角色列表
      loadCharacters();
      
      // 重置状态
      setIsCreating(false);
      setIsEditing(false);
    } catch (error) {
      console.error('保存角色失败:', error);
      alert(`保存角色失败: ${error.message}`);
    }
  };

  // 渲染角色列表
  const renderCharacterList = () => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">角色列表</h3>
          <button
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={handleCreateCharacter}
          >
            创建角色
          </button>
        </div>
        
        {characters.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-center py-4">
            没有角色。点击"创建角色"按钮添加一个。
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {characters.map(character => (
              <li key={character.id} className="py-2">
                <button
                  className={`w-full text-left px-3 py-2 rounded ${
                    selectedCharacterId === character.id 
                      ? 'bg-indigo-100 dark:bg-indigo-900' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => handleSelectCharacter(character.id)}
                >
                  <div className="font-medium">{character.name || character.id}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {character.type} {character.location && `· ${character.location}`}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  // 渲染角色详情
  const renderCharacterDetail = () => {
    if (!selectedCharacter) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-gray-500 dark:text-gray-400 text-center py-8">
            请选择一个角色查看详情
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* 角色详情头部 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">{selectedCharacter.name || selectedCharacter.id}</h2>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {selectedCharacter.type} · {selectedCharacter.location || '无位置'}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={handleEditCharacter}
              >
                编辑
              </button>
              
              {selectedCharacter.id !== 'player' && selectedCharacter.id !== 'gm' && (
                <button
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  onClick={handleDeleteCharacter}
                >
                  删除
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* 标签页导航 */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex">
            <button
              className={`px-4 py-2 ${
                activeTab === 'info' 
                  ? 'border-b-2 border-indigo-500 text-indigo-500' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('info')}
            >
              基本信息
            </button>
            <button
              className={`px-4 py-2 ${
                activeTab === 'relationships' 
                  ? 'border-b-2 border-indigo-500 text-indigo-500' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('relationships')}
            >
              关系
            </button>
            <button
              className={`px-4 py-2 ${
                activeTab === 'inventory' 
                  ? 'border-b-2 border-indigo-500 text-indigo-500' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('inventory')}
            >
              物品栏
            </button>
            <button
              className={`px-4 py-2 ${
                activeTab === 'status' 
                  ? 'border-b-2 border-indigo-500 text-indigo-500' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('status')}
            >
              状态
            </button>
          </nav>
        </div>
        
        {/* 标签页内容 */}
        <div className="p-4">
          {activeTab === 'info' && renderInfoTab()}
          {activeTab === 'relationships' && renderRelationshipsTab()}
          {activeTab === 'inventory' && renderInventoryTab()}
          {activeTab === 'status' && renderStatusTab()}
        </div>
      </div>
    );
  };

  // 渲染基本信息标签页
  const renderInfoTab = () => {
    return (
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">描述</h3>
          <p className="text-gray-700 dark:text-gray-300">
            {selectedCharacter.description || '无描述'}
          </p>
        </div>
        
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">背景</h3>
          <p className="text-gray-700 dark:text-gray-300">
            {selectedCharacter.background || '无背景信息'}
          </p>
        </div>
        
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">外貌</h3>
          <p className="text-gray-700 dark:text-gray-300">
            {selectedCharacter.appearance || '无外貌描述'}
          </p>
        </div>
        
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">性格特质</h3>
          {selectedCharacter.personality ? (
            <div className="space-y-2">
              {Object.entries(selectedCharacter.personality).map(([trait, value]) => (
                <div key={trait} className="flex items-center">
                  <div className="w-32 font-medium">{formatTraitName(trait)}:</div>
                  <div className="flex-grow">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div 
                        className="bg-indigo-500 h-2.5 rounded-full" 
                        style={{ width: `${value}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-8 text-right">{value}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">无性格特质数据</p>
          )}
        </div>
        
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">目标</h3>
          {selectedCharacter.goals && selectedCharacter.goals.length > 0 ? (
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
              {selectedCharacter.goals.map((goal, index) => (
                <li key={index}>{goal}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">无目标</p>
          )}
        </div>
        
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">动机</h3>
          {selectedCharacter.motivations && selectedCharacter.motivations.length > 0 ? (
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
              {selectedCharacter.motivations.map((motivation, index) => (
                <li key={index}>{motivation}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">无动机</p>
          )}
        </div>
        
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">恐惧</h3>
          {selectedCharacter.fears && selectedCharacter.fears.length > 0 ? (
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
              {selectedCharacter.fears.map((fear, index) => (
                <li key={index}>{fear}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">无恐惧</p>
          )}
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">对话风格</h3>
          <p className="text-gray-700 dark:text-gray-300">
            {selectedCharacter.dialogueStyle || '无特定对话风格'}
          </p>
        </div>
      </div>
    );
  };

  // 渲染关系标签页
  const renderRelationshipsTab = () => {
    const relationships = trustMap.getAgentRelationships(selectedCharacterId);
    
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4">角色关系</h3>
        
        {Object.keys(relationships).length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">没有与其他角色的关系</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(relationships).map(([targetId, relationship]) => {
              const targetCharacter = characters.find(char => char.id === targetId);
              if (!targetCharacter) return null;
              
              return (
                <div key={targetId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{targetCharacter.name || targetId}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        关系类型: {relationship.type || '未定义'}
                      </div>
                    </div>
                    <button
                      className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                      onClick={() => {
                        // 这里可以添加编辑关系的功能
                        alert('编辑关系功能尚未实现');
                      }}
                    >
                      编辑
                    </button>
                  </div>
                  
                  {relationship.factors && (
                    <div className="mt-3 space-y-2">
                      {Object.entries(relationship.factors).map(([factor, value]) => (
                        <div key={factor} className="flex items-center">
                          <div className="w-20 font-medium">{formatFactorName(factor)}:</div>
                          <div className="flex-grow">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                              <div 
                                className="bg-indigo-500 h-2.5 rounded-full" 
                                style={{ width: `${value}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="w-8 text-right">{value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // 渲染物品栏标签页
  const renderInventoryTab = () => {
    const inventory = selectedCharacter.inventory || [];
    
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">物品栏</h3>
          <button
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={() => {
              // 这里可以添加添加物品的功能
              alert('添加物品功能尚未实现');
            }}
          >
            添加物品
          </button>
        </div>
        
        {inventory.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">物品栏为空</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {inventory.map((item, index) => (
              <li key={index} className="py-3 flex justify-between items-center">
                <div>
                  <div className="font-medium">{item.name || item.id}</div>
                  {item.description && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {item.description}
                    </div>
                  )}
                </div>
                <button
                  className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                  onClick={() => {
                    // 这里可以添加移除物品的功能
                    alert('移除物品功能尚未实现');
                  }}
                >
                  移除
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  // 渲染状态标签页
  const renderStatusTab = () => {
    const status = selectedCharacter.status || [];
    
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">状态效果</h3>
          <button
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={() => {
              // 这里可以添加添加状态的功能
              alert('添加状态功能尚未实现');
            }}
          >
            添加状态
          </button>
        </div>
        
        {status.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">没有状态效果</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {status.map((statusEffect, index) => (
              <li key={index} className="py-3 flex justify-between items-center">
                <div>
                  <div className="font-medium">{statusEffect.name || statusEffect.id}</div>
                  {statusEffect.description && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {statusEffect.description}
                    </div>
                  )}
                  {statusEffect.duration && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      持续时间: {statusEffect.duration}
                    </div>
                  )}
                </div>
                <button
                  className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                  onClick={() => {
                    // 这里可以添加移除状态的功能
                    alert('移除状态功能尚未实现');
                  }}
                >
                  移除
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  // 渲染角色表单
  const renderCharacterForm = () => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-xl font-bold mb-4">
          {isCreating ? '创建角色' : '编辑角色'}
        </h2>
        
        <form onSubmit={handleFormSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              名称
            </label>
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              类型
            </label>
            <select
              name="type"
              value={formData.type || AgentType.NPC}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
            >
              <option value={AgentType.NPC}>NPC</option>
              <option value={AgentType.PLAYER}>玩家</option>
              <option value={AgentType.GM}>游戏主持人</option>
              <option value={AgentType.ENVIRONMENT}>环境</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              描述
            </label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
              rows="3"
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              背景
            </label>
            <textarea
              name="background"
              value={formData.background || ''}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
              rows="3"
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              外貌
            </label>
            <textarea
              name="appearance"
              value={formData.appearance || ''}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
              rows="3"
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              对话风格
            </label>
            <textarea
              name="dialogueStyle"
              value={formData.dialogueStyle || ''}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
              rows="3"
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              位置
            </label>
            <input
              type="text"
              name="location"
              value={formData.location || ''}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              性格特质
            </label>
            {formData.personality && (
              <div className="space-y-4">
                {Object.entries(formData.personality).map(([trait, value]) => (
                  <div key={trait}>
                    <div className="flex justify-between mb-1">
                      <label className="text-gray-700 dark:text-gray-300">
                        {formatTraitName(trait)}
                      </label>
                      <span>{value}</span>
                    </div>
                    <input
                      type="range"
                      name={`personality.${trait}`}
                      value={value}
                      onChange={handleFormChange}
                      min="0"
                      max="100"
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
              onClick={() => {
                setIsCreating(false);
                setIsEditing(false);
              }}
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    );
  };

  // 格式化特质名称
  const formatTraitName = (trait) => {
    switch (trait) {
      case PersonalityTrait.OPENNESS:
        return '开放性';
      case PersonalityTrait.CONSCIENTIOUSNESS:
        return '尽责性';
      case PersonalityTrait.EXTRAVERSION:
        return '外向性';
      case PersonalityTrait.AGREEABLENESS:
        return '亲和性';
      case PersonalityTrait.NEUROTICISM:
        return '神经质';
      default:
        return trait;
    }
  };

  // 格式化因素名称
  const formatFactorName = (factor) => {
    switch (factor) {
      case 'trust':
        return '信任度';
      case 'intimacy':
        return '亲密度';
      case 'respect':
        return '尊重度';
      case 'loyalty':
        return '忠诚度';
      case 'dependency':
        return '依赖度';
      default:
        return factor;
    }
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-6">角色管理</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 角色列表 */}
        <div className="md:col-span-1">
          {renderCharacterList()}
        </div>
        
        {/* 角色详情或表单 */}
        <div className="md:col-span-2">
          {isCreating || isEditing ? renderCharacterForm() : renderCharacterDetail()}
        </div>
      </div>
    </div>
  );
};

export default CharacterPanel;
