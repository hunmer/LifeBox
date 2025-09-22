/**
 * LifeBox 聊天插件
 *
 * 基于 BasePlugin 实现的标准外部插件
 * 提供完整的多频道聊天功能
 */

// 假设 BasePlugin 通过全局变量或模块系统可用
// 在实际环境中，这个会通过插件系统的加载机制提供
class ChatPlugin extends BasePlugin {
  constructor(api, manifest) {
    super(api, manifest);

    // 聊天相关状态
    this.websocket = null;
    this.channels = new Map();
    this.messages = new Map();
    this.currentChannel = null;
    this.user = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = null;

    // UI 元素引用
    this.chatContainer = null;
    this.channelList = null;
    this.messageArea = null;
    this.inputArea = null;
    this.userList = null;
  }

  /**
   * 插件加载时调用
   */
  async onLoad() {
    try {
      this.info('聊天插件开始加载');

      // 创建插件容器
      this.chatContainer = this.createContainer('chat-main');

      // 加载配置
      await this.loadConfig();

      // 初始化UI
      this.initializeUI();

      // 连接到聊天服务器
      await this.connectToServer();

      // 注册事件监听器
      this.registerEventHandlers();

      this.info('聊天插件加载完成');
      this.showNotification('聊天插件已启动', 'success');

    } catch (error) {
      this.error('聊天插件加载失败:', error);
      this.showNotification('聊天插件启动失败: ' + error.message, 'error');
      throw error;
    }
  }

  /**
   * 插件卸载时调用
   */
  async onUnload() {
    try {
      this.info('聊天插件开始卸载');

      // 断开WebSocket连接
      this.disconnect();

      // 清理定时器
      if (this.reconnectInterval) {
        clearInterval(this.reconnectInterval);
        this.reconnectInterval = null;
      }

      // 移除事件监听器
      this.removeEventHandlers();

      // 清理UI
      this.cleanupUI();

      // 移除容器
      this.removeContainer();

      this.info('聊天插件卸载完成');

    } catch (error) {
      this.error('聊天插件卸载失败:', error);
    }
  }

  /**
   * 插件激活时调用
   */
  async onActivate() {
    this.info('聊天插件已激活');

    // 显示聊天界面
    if (this.chatContainer) {
      this.chatContainer.style.display = 'block';
    }

    // 如果未连接，尝试重新连接
    if (!this.isConnected) {
      await this.connectToServer();
    }
  }

  /**
   * 插件停用时调用
   */
  async onDeactivate() {
    this.info('聊天插件已停用');

    // 隐藏聊天界面
    if (this.chatContainer) {
      this.chatContainer.style.display = 'none';
    }
  }

  /**
   * 加载插件配置
   */
  async loadConfig() {
    const config = this.getAllConfig();

    // 设置默认配置
    const defaults = {
      serverUrl: 'ws://localhost:3001',
      maxMessages: 1000,
      enableNotifications: true,
      enableSound: true,
      theme: 'auto',
      autoJoinChannels: ['general']
    };

    // 合并配置
    for (const [key, value] of Object.entries(defaults)) {
      if (config[key] === undefined) {
        await this.setConfig(key, value);
      }
    }

    this.debug('配置加载完成:', this.getAllConfig());
  }

  /**
   * 初始化UI界面
   */
  initializeUI() {
    if (!this.chatContainer) return;

    this.chatContainer.innerHTML = `
      <div class="chat-plugin-container">
        <div class="chat-header">
          <h2>LifeBox 聊天</h2>
          <div class="connection-status" id="connection-status">
            <span class="status-indicator"></span>
            <span class="status-text">连接中...</span>
          </div>
        </div>

        <div class="chat-body">
          <div class="sidebar">
            <div class="channel-section">
              <h3>频道列表</h3>
              <ul class="channel-list" id="channel-list"></ul>
              <button class="btn-create-channel" id="btn-create-channel">创建频道</button>
            </div>

            <div class="user-section">
              <h3>在线用户</h3>
              <ul class="user-list" id="user-list"></ul>
            </div>
          </div>

          <div class="main-chat">
            <div class="channel-header" id="channel-header">
              <span class="channel-name">请选择一个频道</span>
              <div class="channel-actions">
                <button class="btn-channel-info" id="btn-channel-info">信息</button>
                <button class="btn-leave-channel" id="btn-leave-channel">离开</button>
              </div>
            </div>

            <div class="message-area" id="message-area">
              <div class="no-channel-selected">
                <p>请从左侧选择一个频道开始聊天</p>
              </div>
            </div>

            <div class="input-area" id="input-area">
              <div class="typing-indicator" id="typing-indicator"></div>
              <div class="message-input-container">
                <input type="text"
                       class="message-input"
                       id="message-input"
                       placeholder="输入消息..."
                       disabled>
                <button class="btn-send" id="btn-send" disabled>发送</button>
                <button class="btn-attach" id="btn-attach" disabled>📎</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // 缓存UI元素引用
    this.channelList = this.chatContainer.querySelector('#channel-list');
    this.messageArea = this.chatContainer.querySelector('#message-area');
    this.inputArea = this.chatContainer.querySelector('#input-area');
    this.userList = this.chatContainer.querySelector('#user-list');

    // 绑定事件监听器
    this.bindUIEvents();

    // 应用主题
    this.applyTheme();
  }

  /**
   * 绑定UI事件监听器
   */
  bindUIEvents() {
    const messageInput = this.chatContainer.querySelector('#message-input');
    const sendButton = this.chatContainer.querySelector('#btn-send');
    const createChannelButton = this.chatContainer.querySelector('#btn-create-channel');
    const channelInfoButton = this.chatContainer.querySelector('#btn-channel-info');
    const leaveChannelButton = this.chatContainer.querySelector('#btn-leave-channel');
    const attachButton = this.chatContainer.querySelector('#btn-attach');

    // 消息发送
    if (messageInput && sendButton) {
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      messageInput.addEventListener('input', () => {
        this.handleTyping();
      });

      sendButton.addEventListener('click', () => {
        this.sendMessage();
      });
    }

    // 创建频道
    if (createChannelButton) {
      createChannelButton.addEventListener('click', () => {
        this.showCreateChannelDialog();
      });
    }

    // 频道信息
    if (channelInfoButton) {
      channelInfoButton.addEventListener('click', () => {
        this.showChannelInfo();
      });
    }

    // 离开频道
    if (leaveChannelButton) {
      leaveChannelButton.addEventListener('click', () => {
        this.leaveCurrentChannel();
      });
    }

    // 文件附件
    if (attachButton) {
      attachButton.addEventListener('click', () => {
        this.showFileUploadDialog();
      });
    }
  }

  /**
   * 连接到聊天服务器
   */
  async connectToServer() {
    const serverUrl = this.getConfig('serverUrl');

    if (this.websocket) {
      this.websocket.close();
    }

    try {
      this.debug('连接到聊天服务器:', serverUrl);
      this.updateConnectionStatus('connecting', '连接中...');

      this.websocket = new WebSocket(serverUrl);

      this.websocket.onopen = () => {
        this.debug('WebSocket连接已建立');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.updateConnectionStatus('connected', '已连接');

        // 启用输入控件
        this.enableChatControls();

        // 发送认证信息
        this.authenticate();

        // 自动加入频道
        this.autoJoinChannels();
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleServerMessage(data);
        } catch (error) {
          this.error('解析服务器消息失败:', error);
        }
      };

      this.websocket.onclose = (event) => {
        this.debug('WebSocket连接关闭:', event.code, event.reason);
        this.isConnected = false;
        this.updateConnectionStatus('disconnected', '连接断开');

        // 禁用输入控件
        this.disableChatControls();

        // 如果不是主动关闭，尝试重连
        if (event.code !== 1000) {
          this.attemptReconnect();
        }
      };

      this.websocket.onerror = (error) => {
        this.error('WebSocket连接错误:', error);
        this.updateConnectionStatus('error', '连接错误');
      };

    } catch (error) {
      this.error('连接服务器失败:', error);
      this.updateConnectionStatus('error', '连接失败');
      throw error;
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.websocket) {
      this.websocket.close(1000, '插件关闭');
      this.websocket = null;
    }

    this.isConnected = false;
    this.updateConnectionStatus('disconnected', '已断开');
  }

  /**
   * 尝试重连
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.error('达到最大重连次数，停止重连');
      this.updateConnectionStatus('error', '连接失败');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);

    this.debug(`${delay}ms后尝试第${this.reconnectAttempts}次重连`);
    this.updateConnectionStatus('reconnecting', `重连中(${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connectToServer().catch(error => {
        this.error('重连失败:', error);
      });
    }, delay);
  }

  /**
   * 处理服务器消息
   */
  handleServerMessage(data) {
    this.debug('收到服务器消息:', data);

    switch (data.type) {
      case 'auth_success':
        this.handleAuthSuccess(data);
        break;
      case 'channel_list':
        this.handleChannelList(data.channels);
        break;
      case 'channel_joined':
        this.handleChannelJoined(data.channel);
        break;
      case 'message':
        this.handleNewMessage(data.message);
        break;
      case 'user_joined':
        this.handleUserJoined(data);
        break;
      case 'user_left':
        this.handleUserLeft(data);
        break;
      case 'typing_start':
        this.handleTypingStart(data);
        break;
      case 'typing_stop':
        this.handleTypingStop(data);
        break;
      case 'error':
        this.handleServerError(data);
        break;
      default:
        this.warn('未知的服务器消息类型:', data.type);
    }
  }

  /**
   * 发送消息
   */
  sendMessage() {
    const messageInput = this.chatContainer.querySelector('#message-input');
    if (!messageInput || !this.currentChannel || !this.isConnected) {
      return;
    }

    const content = messageInput.value.trim();
    if (!content) {
      return;
    }

    const message = {
      type: 'send_message',
      channelId: this.currentChannel.id,
      content: content,
      messageType: 'text'
    };

    this.sendToServer(message);
    messageInput.value = '';
  }

  /**
   * 发送数据到服务器
   */
  sendToServer(data) {
    if (this.websocket && this.isConnected) {
      this.websocket.send(JSON.stringify(data));
    } else {
      this.error('无法发送消息：未连接到服务器');
      this.showNotification('发送失败：未连接到服务器', 'error');
    }
  }

  /**
   * 更新连接状态显示
   */
  updateConnectionStatus(status, text) {
    const statusElement = this.chatContainer?.querySelector('#connection-status');
    if (!statusElement) return;

    const indicator = statusElement.querySelector('.status-indicator');
    const textElement = statusElement.querySelector('.status-text');

    if (indicator && textElement) {
      indicator.className = `status-indicator status-${status}`;
      textElement.textContent = text;
    }
  }

  /**
   * 启用聊天控件
   */
  enableChatControls() {
    const messageInput = this.chatContainer?.querySelector('#message-input');
    const sendButton = this.chatContainer?.querySelector('#btn-send');
    const attachButton = this.chatContainer?.querySelector('#btn-attach');

    if (messageInput) messageInput.disabled = false;
    if (sendButton) sendButton.disabled = false;
    if (attachButton) attachButton.disabled = false;
  }

  /**
   * 禁用聊天控件
   */
  disableChatControls() {
    const messageInput = this.chatContainer?.querySelector('#message-input');
    const sendButton = this.chatContainer?.querySelector('#btn-send');
    const attachButton = this.chatContainer?.querySelector('#btn-attach');

    if (messageInput) messageInput.disabled = true;
    if (sendButton) sendButton.disabled = true;
    if (attachButton) attachButton.disabled = true;
  }

  /**
   * 应用主题
   */
  applyTheme() {
    const theme = this.getConfig('theme');
    if (this.chatContainer) {
      this.chatContainer.setAttribute('data-theme', theme);
    }
  }

  /**
   * 注册事件处理器
   */
  registerEventHandlers() {
    // 监听系统事件
    this.on('system:theme-changed', (data) => {
      this.applyTheme();
    });

    // 监听窗口关闭事件
    this.on('system:before-quit', () => {
      this.disconnect();
    });
  }

  /**
   * 移除事件处理器
   */
  removeEventHandlers() {
    // 移除所有事件监听器
    this.off('system:theme-changed', this.applyTheme);
    this.off('system:before-quit', this.disconnect);
  }

  /**
   * 清理UI
   */
  cleanupUI() {
    // 清理定时器和事件监听器
    this.channels.clear();
    this.messages.clear();
    this.currentChannel = null;
    this.user = null;
  }

  /**
   * 认证
   */
  authenticate() {
    // 发送认证信息
    this.sendToServer({
      type: 'authenticate',
      token: 'user_token' // 实际应该从存储中获取
    });
  }

  /**
   * 自动加入频道
   */
  autoJoinChannels() {
    const autoJoinChannels = this.getConfig('autoJoinChannels');
    if (Array.isArray(autoJoinChannels)) {
      autoJoinChannels.forEach(channelId => {
        this.sendToServer({
          type: 'join_channel',
          channelId: channelId
        });
      });
    }
  }

  /**
   * 处理认证成功
   */
  handleAuthSuccess(data) {
    this.user = data.user;
    this.info('用户认证成功:', this.user.username);

    // 请求频道列表
    this.sendToServer({ type: 'get_channels' });
  }

  /**
   * 处理频道列表
   */
  handleChannelList(channels) {
    this.debug('收到频道列表:', channels);

    // 更新频道映射
    channels.forEach(channel => {
      this.channels.set(channel.id, channel);
    });

    // 更新UI
    this.updateChannelList();
  }

  /**
   * 更新频道列表UI
   */
  updateChannelList() {
    if (!this.channelList) return;

    this.channelList.innerHTML = '';

    this.channels.forEach(channel => {
      const li = document.createElement('li');
      li.className = 'channel-item';
      li.setAttribute('data-channel-id', channel.id);

      li.innerHTML = `
        <span class="channel-icon">#</span>
        <span class="channel-name">${channel.name}</span>
        <span class="member-count">${channel.memberCount || 0}</span>
      `;

      li.addEventListener('click', () => {
        this.joinChannel(channel.id);
      });

      this.channelList.appendChild(li);
    });
  }

  /**
   * 加入频道
   */
  joinChannel(channelId) {
    if (!this.isConnected) {
      this.showNotification('无法加入频道：未连接到服务器', 'error');
      return;
    }

    this.sendToServer({
      type: 'join_channel',
      channelId: channelId
    });
  }

  /**
   * 处理频道加入成功
   */
  handleChannelJoined(channel) {
    this.currentChannel = channel;
    this.info('已加入频道:', channel.name);

    // 更新UI
    this.updateChannelHeader(channel);
    this.updateMessageArea(channel.id);

    // 请求频道消息
    this.requestChannelMessages(channel.id);

    // 高亮当前频道
    this.highlightCurrentChannel(channel.id);
  }

  /**
   * 更新频道头部
   */
  updateChannelHeader(channel) {
    const channelHeader = this.chatContainer?.querySelector('#channel-header');
    if (!channelHeader) return;

    const channelName = channelHeader.querySelector('.channel-name');
    if (channelName) {
      channelName.textContent = `# ${channel.name}`;
    }
  }

  /**
   * 更新消息区域
   */
  updateMessageArea(channelId) {
    if (!this.messageArea) return;

    this.messageArea.innerHTML = '<div class="loading">加载消息中...</div>';
  }

  /**
   * 请求频道消息
   */
  requestChannelMessages(channelId) {
    this.sendToServer({
      type: 'get_messages',
      channelId: channelId,
      limit: 50
    });
  }

  /**
   * 高亮当前频道
   */
  highlightCurrentChannel(channelId) {
    // 移除其他频道的高亮
    this.channelList?.querySelectorAll('.channel-item').forEach(item => {
      item.classList.remove('active');
    });

    // 高亮当前频道
    const currentChannelItem = this.channelList?.querySelector(`[data-channel-id="${channelId}"]`);
    if (currentChannelItem) {
      currentChannelItem.classList.add('active');
    }
  }

  /**
   * 处理新消息
   */
  handleNewMessage(message) {
    this.debug('收到新消息:', message);

    // 如果启用通知且不是当前用户发送的消息
    if (this.getConfig('enableNotifications') &&
        message.authorId !== this.user?.id) {
      this.showNotification(
        `${message.author.displayName}: ${message.content}`,
        'info'
      );
    }

    // 如果启用声音提醒
    if (this.getConfig('enableSound') &&
        message.authorId !== this.user?.id) {
      this.playNotificationSound();
    }

    // 更新消息显示
    this.displayMessage(message);
  }

  /**
   * 显示消息
   */
  displayMessage(message) {
    if (!this.messageArea || message.channelId !== this.currentChannel?.id) {
      return;
    }

    // 如果是第一条消息，清空加载提示
    const loading = this.messageArea.querySelector('.loading');
    if (loading) {
      loading.remove();
    }

    const messageElement = document.createElement('div');
    messageElement.className = 'message-item';
    messageElement.setAttribute('data-message-id', message.id);

    const timestamp = new Date(message.timestamp).toLocaleTimeString();

    messageElement.innerHTML = `
      <div class="message-header">
        <img class="user-avatar" src="${message.author.avatar || '/default-avatar.png'}" alt="${message.author.displayName}">
        <span class="username">${message.author.displayName}</span>
        <span class="timestamp">${timestamp}</span>
      </div>
      <div class="message-content">${this.formatMessageContent(message.content)}</div>
    `;

    this.messageArea.appendChild(messageElement);

    // 滚动到底部
    this.scrollToBottom();
  }

  /**
   * 格式化消息内容
   */
  formatMessageContent(content) {
    // 简单的HTML转义和链接识别
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
  }

  /**
   * 滚动到底部
   */
  scrollToBottom() {
    if (this.messageArea) {
      this.messageArea.scrollTop = this.messageArea.scrollHeight;
    }
  }

  /**
   * 播放通知声音
   */
  playNotificationSound() {
    try {
      const audio = new Audio('/assets/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(error => {
        this.debug('播放通知声音失败:', error);
      });
    } catch (error) {
      this.debug('创建音频对象失败:', error);
    }
  }

  /**
   * 处理打字状态
   */
  handleTyping() {
    if (!this.currentChannel || !this.isConnected) return;

    // 发送开始打字事件
    this.sendToServer({
      type: 'typing_start',
      channelId: this.currentChannel.id
    });

    // 设置停止打字的定时器
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = setTimeout(() => {
      this.sendToServer({
        type: 'typing_stop',
        channelId: this.currentChannel.id
      });
    }, 3000);
  }

  /**
   * 显示创建频道对话框
   */
  async showCreateChannelDialog() {
    const result = await this.showDialog({
      title: '创建新频道',
      content: `
        <div class="create-channel-form">
          <div class="form-group">
            <label for="channel-name">频道名称：</label>
            <input type="text" id="channel-name" placeholder="输入频道名称">
          </div>
          <div class="form-group">
            <label for="channel-description">频道描述：</label>
            <textarea id="channel-description" placeholder="输入频道描述（可选）"></textarea>
          </div>
        </div>
      `,
      buttons: [
        {
          text: '创建',
          type: 'primary',
          onClick: () => {
            const name = document.getElementById('channel-name')?.value.trim();
            const description = document.getElementById('channel-description')?.value.trim();

            if (!name) {
              this.showNotification('请输入频道名称', 'warning');
              return false;
            }

            this.createChannel(name, description);
            return true;
          }
        },
        {
          text: '取消',
          type: 'secondary'
        }
      ]
    });
  }

  /**
   * 创建频道
   */
  createChannel(name, description) {
    this.sendToServer({
      type: 'create_channel',
      name: name,
      description: description || '',
      type: 'public'
    });
  }

  /**
   * 显示频道信息
   */
  showChannelInfo() {
    if (!this.currentChannel) return;

    this.showDialog({
      title: '频道信息',
      content: `
        <div class="channel-info">
          <h3>${this.currentChannel.name}</h3>
          <p><strong>描述:</strong> ${this.currentChannel.description || '无描述'}</p>
          <p><strong>成员数量:</strong> ${this.currentChannel.memberCount || 0}</p>
          <p><strong>创建时间:</strong> ${new Date(this.currentChannel.createdAt).toLocaleString()}</p>
        </div>
      `,
      buttons: [
        { text: '关闭', type: 'primary' }
      ]
    });
  }

  /**
   * 离开当前频道
   */
  async leaveCurrentChannel() {
    if (!this.currentChannel) return;

    const confirmed = await this.showDialog({
      title: '离开频道',
      content: `确定要离开频道 "${this.currentChannel.name}" 吗？`,
      buttons: [
        {
          text: '离开',
          type: 'danger',
          onClick: () => true
        },
        {
          text: '取消',
          type: 'secondary',
          onClick: () => false
        }
      ]
    });

    if (confirmed) {
      this.sendToServer({
        type: 'leave_channel',
        channelId: this.currentChannel.id
      });
    }
  }

  /**
   * 显示文件上传对话框
   */
  showFileUploadDialog() {
    // 创建文件输入元素
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,video/*,.pdf,.doc,.docx,.txt';

    fileInput.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        this.uploadFile(file);
      }
    };

    fileInput.click();
  }

  /**
   * 上传文件
   */
  async uploadFile(file) {
    try {
      this.showNotification('正在上传文件...', 'info');

      // 这里应该调用文件上传API
      // const attachment = await this.api.http.post('/api/upload', formData);

      // 模拟上传成功
      const mockAttachment = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file)
      };

      // 发送文件消息
      this.sendToServer({
        type: 'send_message',
        channelId: this.currentChannel.id,
        content: `[文件] ${file.name}`,
        messageType: 'file',
        attachment: mockAttachment
      });

      this.showNotification('文件上传成功', 'success');

    } catch (error) {
      this.error('文件上传失败:', error);
      this.showNotification('文件上传失败: ' + error.message, 'error');
    }
  }

  /**
   * 处理服务器错误
   */
  handleServerError(data) {
    this.error('服务器错误:', data.message);
    this.showNotification('服务器错误: ' + data.message, 'error');
  }

  /**
   * 处理用户加入
   */
  handleUserJoined(data) {
    this.info(`用户 ${data.user.displayName} 加入了频道 ${data.channelId}`);
    this.updateUserList(data.channelId);
  }

  /**
   * 处理用户离开
   */
  handleUserLeft(data) {
    this.info(`用户 ${data.userId} 离开了频道 ${data.channelId}`);
    this.updateUserList(data.channelId);
  }

  /**
   * 更新用户列表
   */
  updateUserList(channelId) {
    if (channelId === this.currentChannel?.id) {
      // 请求当前频道的用户列表
      this.sendToServer({
        type: 'get_channel_members',
        channelId: channelId
      });
    }
  }

  /**
   * 处理开始打字
   */
  handleTypingStart(data) {
    const indicator = this.chatContainer?.querySelector('#typing-indicator');
    if (indicator && data.channelId === this.currentChannel?.id) {
      indicator.textContent = `${data.username} 正在输入...`;
      indicator.style.display = 'block';
    }
  }

  /**
   * 处理停止打字
   */
  handleTypingStop(data) {
    const indicator = this.chatContainer?.querySelector('#typing-indicator');
    if (indicator && data.channelId === this.currentChannel?.id) {
      indicator.style.display = 'none';
    }
  }
}

// 插件注册函数
// 这个函数会被插件系统调用来创建插件实例
function createPlugin(api, manifest) {
  return new ChatPlugin(api, manifest);
}

// 如果在浏览器环境中，将注册函数暴露给全局
if (typeof window !== 'undefined') {
  window.createChatPlugin = createPlugin;
}