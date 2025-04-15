import React, { useState, useEffect } from 'react';
import gameState from '../modules/game_state';
import promptBuilder from '../modules/prompt_builder';
import llmAdapter from '../modules/llm_adapter';

/**
 * 世界书编辑器组件
 * 用于管理游戏世界设定和条目
 */
const WorldBookPanel = () => {
  // 状态
  const [worldBook, setWorldBook] = useState({
    mainSetting: '',
    entries: []
  });
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [generationTheme, setGenerationTheme] = useState('');

  // 加载世界书数据
  useEffect(() => {
    loadWorldBook();
  }, []);

  // 加载世界书
  const loadWorldBook = () => {
    const state = gameState.getState();
    const worldBookData = state.worldBook || { mainSetting: '', entries: [] };
    setWorldBook(worldBookData);
    
    // 提取所有类别
    const allCategories = [...new Set(worldBookData.entries.map(entry => entry.category))].filter(Boolean);
    setCategories(allCategories);
    
    // 如果没有选中条目且有条目，选择第一个
    if (!selectedEntryId && worldBookData.entries.length > 0) {
      setSelectedEntryId(worldBookData.entries[0].id);
    }
  };

  // 保存世界书
  const saveWorldBook = (newWorldBook) => {
    gameState.updateState({ worldBook: newWorldBook });
    setWorldBook(newWorldBook);
  };

  // 获取选中的条目
  const selectedEntry = selectedEntryId 
    ? worldBook.entries.find(entry => entry.id === selectedEntryId) 
    : null;

  // 过滤条目
  const filteredEntries = worldBook.entries.filter(entry => {
    // 类别过滤
    if (selectedCategory !== 'all' && entry.category !== selectedCategory) {
      return false;
    }
    
    // 搜索过滤
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (entry.name && entry.name.toLowerCase().includes(searchLower)) ||
        (entry.content && entry.content.toLowerCase().includes(searchLower)) ||
        (entry.category && entry.category.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  // 处理条目选择
  const handleSelectEntry = (entryId) => {
    setSelectedEntryId(entryId);
    setIsEditing(false);
    setIsCreating(false);
  };

  // 处理创建条目
  const handleCreateEntry = () => {
    setIsCreating(true);
    setIsEditing(false);
    setSelectedEntryId(null);
    setFormData({
      name: '',
      content: '',
      category: '',
      tags: [],
      isActive: true
    });
  };

  // 处理编辑条目
  const handleEditEntry = () => {
    if (!selectedEntry) return;
    
    setIsEditing(true);
    setIsCreating(false);
    setFormData({...selectedEntry});
  };

  // 处理删除条目
  const handleDeleteEntry = () => {
    if (!selectedEntry) return;
    
    if (window.confirm(`确定要删除条目 "${selectedEntry.name}" 吗？`)) {
      const newEntries = worldBook.entries.filter(entry => entry.id !== selectedEntryId);
      saveWorldBook({
        ...worldBook,
        entries: newEntries
      });
      setSelectedEntryId(null);
    }
  };

  // 处理编辑主要设定
  const handleEditMainSetting = () => {
    setIsEditing(true);
    setIsCreating(false);
    setSelectedEntryId(null);
    setFormData({
      mainSetting: worldBook.mainSetting || ''
    });
  };

  // 处理表单变更
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // 处理标签变更
  const handleTagsChange = (e) => {
    const tagsString = e.target.value;
    const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(Boolean);
    setFormData({
      ...formData,
      tags: tagsArray
    });
  };

  // 处理表单提交
  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    try {
      if (formData.mainSetting !== undefined) {
        // 更新主要设定
        saveWorldBook({
          ...worldBook,
          mainSetting: formData.mainSetting
        });
      } else if (isCreating) {
        // 创建新条目
        const newEntry = {
          ...formData,
          id: `entry_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        saveWorldBook({
          ...worldBook,
          entries: [...worldBook.entries, newEntry]
        });
        
        // 如果是新类别，添加到类别列表
        if (formData.category && !categories.includes(formData.category)) {
          setCategories([...categories, formData.category]);
        }
      } else if (isEditing && selectedEntryId) {
        // 更新现有条目
        const updatedEntries = worldBook.entries.map(entry => 
          entry.id === selectedEntryId ? 
            { ...entry, ...formData, updatedAt: new Date().toISOString() } : 
            entry
        );
        
        saveWorldBook({
          ...worldBook,
          entries: updatedEntries
        });
        
        // 如果是新类别，添加到类别列表
        if (formData.category && !categories.includes(formData.category)) {
          setCategories([...categories, formData.category]);
        }
      }
      
      // 重置状态
      setIsCreating(false);
      setIsEditing(false);
    } catch (error) {
      console.error('保存条目失败:', error);
      alert(`保存失败: ${error.message}`);
    }
  };

  // 处理AI生成世界设定
  const handleGenerateWorldSetting = async () => {
    try {
      setIsGenerating(true);
      
      // 构建提示
      const prompt = promptBuilder.buildPrompt('world_building', {
        theme: generationTheme,
        elements: generationPrompt,
        tone: 'immersive',
        detail: 'high'
      });
      
      // 发送请求
      const response = await llmAdapter.sendRequest(prompt.text, {
        temperature: 0.7,
        maxTokens: 1000
      });
      
      // 更新主要设定
      saveWorldBook({
        ...worldBook,
        mainSetting: response.text
      });
      
      // 重置状态
      setGenerationPrompt('');
      setGenerationTheme('');
      setIsGenerating(false);
    } catch (error) {
      console.error('生成世界设定失败:', error);
      alert(`生成失败: ${error.message}`);
      setIsGenerating(false);
    }
  };

  // 渲染条目列表
  const renderEntryList = () => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">世界书条目</h3>
          <button
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={handleCreateEntry}
          >
            创建条目
          </button>
        </div>
        
        {/* 搜索和过滤 */}
        <div className="mb-4 space-y-2">
          <input
            type="text"
            placeholder="搜索条目..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
          />
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
          >
            <option value="all">所有类别</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        {filteredEntries.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-center py-4">
            {worldBook.entries.length === 0 ? 
              '没有条目。点击"创建条目"按钮添加一个。' : 
              '没有匹配的条目。'}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredEntries.map(entry => (
              <li key={entry.id} className="py-2">
                <button
                  className={`w-full text-left px-3 py-2 rounded ${
                    selectedEntryId === entry.id 
                      ? 'bg-indigo-100 dark:bg-indigo-900' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => handleSelectEntry(entry.id)}
                >
                  <div className="font-medium">{entry.name || '未命名条目'}</div>
                  {entry.category && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {entry.category}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  // 渲染条目详情
  const renderEntryDetail = () => {
    if (!selectedEntry) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-gray-500 dark:text-gray-400 text-center py-8">
            请选择一个条目查看详情
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* 条目详情头部 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">{selectedEntry.name || '未命名条目'}</h2>
              {selectedEntry.category && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  类别: {selectedEntry.category}
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={handleEditEntry}
              >
                编辑
              </button>
              <button
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={handleDeleteEntry}
              >
                删除
              </button>
            </div>
          </div>
        </div>
        
        {/* 条目内容 */}
        <div className="p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">内容</h3>
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700">
              {selectedEntry.content || '无内容'}
            </div>
          </div>
          
          {selectedEntry.tags && selectedEntry.tags.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">标签</h3>
              <div className="flex flex-wrap gap-2">
                {selectedEntry.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            创建时间: {new Date(selectedEntry.createdAt).toLocaleString()}
            <br />
            更新时间: {new Date(selectedEntry.updatedAt).toLocaleString()}
          </div>
        </div>
      </div>
    );
  };

  // 渲染主要设定
  const renderMainSetting = () => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">世界主要设定</h3>
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleEditMainSetting}
          >
            编辑
          </button>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700">
          {worldBook.mainSetting ? (
            <div className="whitespace-pre-line">{worldBook.mainSetting}</div>
          ) : (
            <div className="text-gray-500 dark:text-gray-400 text-center py-4">
              没有主要设定。点击"编辑"按钮添加。
            </div>
          )}
        </div>
      </div>
    );
  };

  // 渲染AI生成工具
  const renderGenerationTool = () => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
        <h3 className="text-lg font-semibold mb-4">AI生成世界设定</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              主题
            </label>
            <input
              type="text"
              value={generationTheme}
              onChange={(e) => setGenerationTheme(e.target.value)}
              placeholder="例如：中世纪奇幻、赛博朋克、太空歌剧..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              元素和要求
            </label>
            <textarea
              value={generationPrompt}
              onChange={(e) => setGenerationPrompt(e.target.value)}
              placeholder="描述你想要包含的元素、特点或要求..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
              rows="4"
            ></textarea>
          </div>
          
          <button
            className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={handleGenerateWorldSetting}
            disabled={isGenerating || (!generationTheme && !generationPrompt)}
          >
            {isGenerating ? '生成中...' : '生成世界设定'}
          </button>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            注意：生成的内容将替换当前的主要设定。请确保在生成前备份重要内容。
          </div>
        </div>
      </div>
    );
  };

  // 渲染条目表单
  const renderEntryForm = () => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-xl font-bold mb-4">
          {formData.mainSetting !== undefined ? '编辑主要设定' : 
            (isCreating ? '创建条目' : '编辑条目')}
        </h2>
        
        <form onSubmit={handleFormSubmit}>
          {formData.mainSetting !== undefined ? (
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                主要设定
              </label>
              <textarea
                name="mainSetting"
                value={formData.mainSetting}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                rows="10"
              ></textarea>
            </div>
          ) : (
            <>
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
                  内容
                </label>
                <textarea
                  name="content"
                  value={formData.content || ''}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                  rows="6"
                ></textarea>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  类别
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category || ''}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                  list="categories"
                />
                <datalist id="categories">
                  {categories.map(category => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  标签（用逗号分隔）
                </label>
                <input
                  type="text"
                  value={formData.tags ? formData.tags.join(', ') : ''}
                  onChange={handleTagsChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                />
              </div>
              
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive !== false}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-gray-700 dark:text-gray-300">启用此条目</span>
                </label>
              </div>
            </>
          )}
          
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

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-6">世界书</h1>
      
      {isCreating || isEditing ? (
        // 表单视图
        renderEntryForm()
      ) : (
        // 正常视图
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 左侧：主要设定和生成工具 */}
          <div className="md:col-span-1">
            {renderMainSetting()}
            {renderGenerationTool()}
          </div>
          
          {/* 中间：条目列表 */}
          <div className="md:col-span-1">
            {renderEntryList()}
          </div>
          
          {/* 右侧：条目详情 */}
          <div className="md:col-span-1">
            {renderEntryDetail()}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorldBookPanel;
