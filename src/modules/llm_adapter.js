/**
 * llm_adapter.js
 * 适配不同的LLM API，提供统一的接口
 */

import gameState from './game_state';

/**
 * LLM提供商枚举
 * @readonly
 * @enum {string}
 */
export const LLMProvider = {
  /** OpenAI API */
  OPENAI: 'openai',
  /** 本地模型 */
  LOCAL: 'local',
  /** 模拟模式（用于测试） */
  MOCK: 'mock'
};

/**
 * LLM模型类型枚举
 * @readonly
 * @enum {string}
 */
export const ModelType = {
  /** 聊天模型 */
  CHAT: 'chat',
  /** 文本补全模型 */
  COMPLETION: 'completion',
  /** 嵌入模型 */
  EMBEDDING: 'embedding'
};

/**
 * 默认配置
 * @type {Object}
 */
const DEFAULT_CONFIG = {
  provider: LLMProvider.OPENAI,
  model: 'gpt-3.5-turbo',
  modelType: ModelType.CHAT,
  temperature: 0.7,
  maxTokens: 1000,
  apiKey: '',
  apiEndpoint: '',
  useProxy: false,
  proxyUrl: '',
  timeout: 30000,
  retries: 3,
  mockResponses: {}
};

/**
 * LLM适配器类
 * 提供与不同LLM API交互的统一接口
 */
class LLMAdapter {
  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.mockResponses = {};
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.rateLimitDelay = 1000; // 请求间隔（毫秒）
    this.lastRequestTime = 0;
  }

  /**
   * 初始化适配器
   * @param {Object} [config={}] - 配置对象
   */
  initialize(config = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
    
    // 从游戏状态加载配置
    const state = gameState.getState();
    
    if (state.llmConfig) {
      this.config = {
        ...this.config,
        ...state.llmConfig
      };
    }
    
    // 初始化模拟响应
    if (config.mockResponses) {
      this.mockResponses = config.mockResponses;
    }
    
    console.log('LLM适配器已初始化，提供商:', this.config.provider);
  }

  /**
   * 更新配置
   * @param {Object} config - 配置对象
   */
  updateConfig(config) {
    this.config = {
      ...this.config,
      ...config
    };
    
    // 更新游戏状态
    gameState.updateState({
      llmConfig: this.config
    });
    
    console.log('LLM适配器配置已更新');
  }

  /**
   * 发送请求到LLM
   * @param {string|Array} prompt - 提示文本或消息数组
   * @param {Object} [options={}] - 请求选项
   * @returns {Promise<Object>} 响应对象
   */
  async sendRequest(prompt, options = {}) {
    try {
      // 合并选项
      const requestOptions = {
        ...this.config,
        ...options
      };
      
      // 根据提供商选择不同的处理方法
      switch (requestOptions.provider) {
        case LLMProvider.OPENAI:
          return await this._sendOpenAIRequest(prompt, requestOptions);
        
        case LLMProvider.LOCAL:
          return await this._sendLocalRequest(prompt, requestOptions);
        
        case LLMProvider.MOCK:
          return await this._sendMockRequest(prompt, requestOptions);
        
        default:
          throw new Error(`不支持的LLM提供商: ${requestOptions.provider}`);
      }
    } catch (error) {
      console.error('LLM请求失败:', error);
      
      // 重试逻辑
      if (options.retries > 0) {
        console.log(`重试请求，剩余重试次数: ${options.retries - 1}`);
        
        return this.sendRequest(prompt, {
          ...options,
          retries: options.retries - 1
        });
      }
      
      throw error;
    }
  }

  /**
   * 将请求添加到队列
   * @param {string|Array} prompt - 提示文本或消息数组
   * @param {Object} [options={}] - 请求选项
   * @returns {Promise<Object>} 响应对象
   */
  async queueRequest(prompt, options = {}) {
    return new Promise((resolve, reject) => {
      // 添加到队列
      this.requestQueue.push({
        prompt,
        options,
        resolve,
        reject
      });
      
      // 开始处理队列
      this._processQueue();
    });
  }

  /**
   * 处理请求队列
   * @private
   */
  async _processQueue() {
    // 如果已经在处理队列，不重复处理
    if (this.isProcessingQueue) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    try {
      while (this.requestQueue.length > 0) {
        // 获取下一个请求
        const { prompt, options, resolve, reject } = this.requestQueue.shift();
        
        // 计算需要等待的时间
        const now = Date.now();
        const timeToWait = Math.max(0, this.lastRequestTime + this.rateLimitDelay - now);
        
        if (timeToWait > 0) {
          await new Promise(r => setTimeout(r, timeToWait));
        }
        
        // 发送请求
        try {
          const response = await this.sendRequest(prompt, options);
          resolve(response);
        } catch (error) {
          reject(error);
        }
        
        // 更新最后请求时间
        this.lastRequestTime = Date.now();
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * 发送请求到OpenAI API
   * @private
   * @param {string|Array} prompt - 提示文本或消息数组
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 响应对象
   */
  async _sendOpenAIRequest(prompt, options) {
    // 检查API密钥
    if (!options.apiKey) {
      throw new Error('缺少OpenAI API密钥');
    }
    
    // 确定API端点
    const apiEndpoint = options.apiEndpoint || 'https://api.openai.com/v1';
    const endpoint = options.modelType === ModelType.CHAT ? 
      `${apiEndpoint}/chat/completions` : 
      `${apiEndpoint}/completions`;
    
    // 准备请求体
    let requestBody;
    
    if (options.modelType === ModelType.CHAT) {
      // 处理聊天模型请求
      const messages = Array.isArray(prompt) ? prompt : [
        { role: 'system', content: '你是一个TRPG游戏中的AI助手。' },
        { role: 'user', content: prompt }
      ];
      
      requestBody = {
        model: options.model,
        messages,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        top_p: options.topP || 1,
        frequency_penalty: options.frequencyPenalty || 0,
        presence_penalty: options.presencePenalty || 0
      };
    } else {
      // 处理文本补全模型请求
      requestBody = {
        model: options.model,
        prompt: Array.isArray(prompt) ? prompt.map(m => m.content).join('\n') : prompt,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        top_p: options.topP || 1,
        frequency_penalty: options.frequencyPenalty || 0,
        presence_penalty: options.presencePenalty || 0
      };
    }
    
    // 发送请求
    try {
      // 使用代理或直接请求
      const fetchUrl = options.useProxy ? 
        `${options.proxyUrl}${endpoint}` : endpoint;
      
      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${options.apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: options.timeout ? AbortSignal.timeout(options.timeout) : undefined
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API请求失败: ${response.status} ${response.statusText}, ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      
      // 处理响应
      let result;
      
      if (options.modelType === ModelType.CHAT) {
        result = {
          text: data.choices[0]?.message?.content || '',
          role: data.choices[0]?.message?.role || 'assistant',
          usage: data.usage,
          model: data.model,
          id: data.id,
          provider: LLMProvider.OPENAI
        };
      } else {
        result = {
          text: data.choices[0]?.text || '',
          usage: data.usage,
          model: data.model,
          id: data.id,
          provider: LLMProvider.OPENAI
        };
      }
      
      return result;
    } catch (error) {
      console.error('OpenAI API请求错误:', error);
      throw error;
    }
  }

  /**
   * 发送请求到本地模型
   * @private
   * @param {string|Array} prompt - 提示文本或消息数组
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 响应对象
   */
  async _sendLocalRequest(prompt, options) {
    // 这里应该实现与本地模型的通信
    // 由于本地模型的实现可能有很多种，这里只提供一个简单的示例
    
    console.log('发送请求到本地模型，这需要根据实际情况实现');
    
    // 模拟本地模型响应
    return {
      text: '这是本地模型的响应。实际实现需要根据你使用的本地模型来定制。',
      model: options.model,
      provider: LLMProvider.LOCAL
    };
  }

  /**
   * 发送模拟请求（用于测试）
   * @private
   * @param {string|Array} prompt - 提示文本或消息数组
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 响应对象
   */
  async _sendMockRequest(prompt, options) {
    console.log('发送模拟请求，用于测试');
    
    // 将提示转换为字符串
    const promptString = Array.isArray(prompt) ? 
      prompt.map(m => m.content).join('\n') : prompt;
    
    // 查找匹配的模拟响应
    let responseText = '这是一个模拟响应。';
    
    // 尝试根据提示内容匹配模拟响应
    for (const [key, value] of Object.entries(this.mockResponses)) {
      if (promptString.includes(key)) {
        responseText = value;
        break;
      }
    }
    
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      text: responseText,
      model: 'mock-model',
      provider: LLMProvider.MOCK
    };
  }

  /**
   * 添加模拟响应
   * @param {string} key - 关键词
   * @param {string} response - 响应文本
   */
  addMockResponse(key, response) {
    this.mockResponses[key] = response;
  }

  /**
   * 生成聊天完成
   * @param {Array} messages - 消息数组
   * @param {Object} [options={}] - 请求选项
   * @returns {Promise<Object>} 响应对象
   */
  async chatCompletion(messages, options = {}) {
    return this.sendRequest(messages, {
      ...options,
      modelType: ModelType.CHAT
    });
  }

  /**
   * 生成文本完成
   * @param {string} prompt - 提示文本
   * @param {Object} [options={}] - 请求选项
   * @returns {Promise<Object>} 响应对象
   */
  async textCompletion(prompt, options = {}) {
    return this.sendRequest(prompt, {
      ...options,
      modelType: ModelType.COMPLETION
    });
  }

  /**
   * 获取当前配置
   * @returns {Object} 配置对象
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * 检查API连接
   * @returns {Promise<boolean>} 是否连接成功
   */
  async checkConnection() {
    try {
      // 发送一个简单的请求来检查连接
      const response = await this.sendRequest('测试连接', {
        maxTokens: 5,
        temperature: 0.1
      });
      
      return !!response;
    } catch (error) {
      console.error('API连接检查失败:', error);
      return false;
    }
  }

  /**
   * 估计令牌数量
   * @param {string} text - 文本
   * @returns {number} 估计的令牌数量
   */
  estimateTokens(text) {
    // 这是一个非常粗略的估计，实际令牌数量取决于模型的分词器
    // 对于英文，大约每4个字符为1个令牌
    // 对于中文，大约每1-2个字符为1个令牌
    
    // 检测文本是否主要是中文
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
    const chineseRatio = chineseChars.length / text.length;
    
    if (chineseRatio > 0.5) {
      // 主要是中文，按1.5个字符1个令牌估计
      return Math.ceil(text.length / 1.5);
    } else {
      // 主要是英文，按4个字符1个令牌估计
      return Math.ceil(text.length / 4);
    }
  }
}

// 创建单例实例
const llmAdapter = new LLMAdapter();

export default llmAdapter;
