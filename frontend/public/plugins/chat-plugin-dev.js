(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.ChatPlugin = {}));
})(this, function(exports2) {
  "use strict";
  class WebSocketService {
    constructor(config) {
      this.config = config;
      this.websocket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
      this.maxReconnectAttempts = 5;
      this.eventHandlers = /* @__PURE__ */ new Map();
    }
    async connect() {
      const { serverUrl } = this.config;
      if (this.websocket) {
        this.websocket.close();
      }
      return new Promise((resolve, reject) => {
        try {
          console.log("连接到聊天服务器:", serverUrl);
          this.websocket = new WebSocket(serverUrl);
          this.websocket.onopen = () => {
            console.log("WebSocket连接已建立");
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.emit("connected");
            resolve();
          };
          this.websocket.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              this.handleMessage(data);
            } catch (error) {
              console.error("解析服务器消息失败:", error);
            }
          };
          this.websocket.onclose = (event) => {
            console.log("WebSocket连接关闭:", event.code, event.reason);
            this.isConnected = false;
            this.emit("disconnected", { code: event.code, reason: event.reason });
            if (event.code !== 1e3) {
              this.attemptReconnect();
            }
          };
          this.websocket.onerror = (error) => {
            console.error("WebSocket连接错误:", error);
            this.emit("error", error);
            reject(error);
          };
        } catch (error) {
          console.error("连接服务器失败:", error);
          reject(error);
        }
      });
    }
    disconnect() {
      if (this.websocket) {
        this.websocket.close(1e3, "插件关闭");
        this.websocket = null;
      }
      this.isConnected = false;
    }
    send(data) {
      if (this.websocket && this.isConnected) {
        this.websocket.send(JSON.stringify(data));
      } else {
        console.error("无法发送消息：未连接到服务器");
        this.emit("sendError", "未连接到服务器");
      }
    }
    isConnectionActive() {
      return this.isConnected;
    }
    on(event, handler) {
      if (!this.eventHandlers.has(event)) {
        this.eventHandlers.set(event, []);
      }
      this.eventHandlers.get(event).push(handler);
    }
    off(event, handler) {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    }
    emit(event, data) {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(data);
          } catch (error) {
            console.error(`事件处理器执行失败 [${event}]:`, error);
          }
        });
      }
    }
    handleMessage(data) {
      console.log("收到服务器消息:", data);
      this.emit("message", data);
      this.emit(`message:${data.type}`, data);
    }
    attemptReconnect() {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("达到最大重连次数，停止重连");
        this.emit("reconnectFailed");
        return;
      }
      this.reconnectAttempts++;
      const delay = Math.min(1e3 * Math.pow(2, this.reconnectAttempts - 1), 3e4);
      console.log(`${delay}ms后尝试第${this.reconnectAttempts}次重连`);
      this.emit("reconnecting", {
        attempt: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts
      });
      setTimeout(() => {
        this.connect().catch((error) => {
          console.error("重连失败:", error);
        });
      }, delay);
    }
  }
  class ChatService {
    constructor(api, config) {
      this.api = api;
      this.config = config;
      this.channels = /* @__PURE__ */ new Map();
      this.messages = /* @__PURE__ */ new Map();
      this.currentChannel = null;
      this.currentUser = null;
      this.eventHandlers = /* @__PURE__ */ new Map();
      this.websocketService = new WebSocketService(config);
      this.setupWebSocketHandlers();
    }
    async initialize() {
      try {
        await this.websocketService.connect();
        this.authenticate();
      } catch (error) {
        this.api.logger.error("聊天服务初始化失败:", error);
        throw error;
      }
    }
    async disconnect() {
      this.websocketService.disconnect();
    }
    // 频道操作
    async joinChannel(channelId) {
      this.websocketService.send({
        type: "join_channel",
        channelId
      });
    }
    async leaveChannel(channelId) {
      this.websocketService.send({
        type: "leave_channel",
        channelId
      });
    }
    async createChannel(name, description) {
      this.websocketService.send({
        type: "create_channel",
        name,
        description: description || "",
        channelType: "public"
      });
    }
    async requestChannelList() {
      this.websocketService.send({ type: "get_channels" });
    }
    async requestChannelMessages(channelId, limit = 50) {
      this.websocketService.send({
        type: "get_messages",
        channelId,
        limit
      });
    }
    // 消息操作
    async sendMessage(content, messageType = "text", attachment) {
      if (!this.currentChannel) {
        throw new Error("没有选择频道");
      }
      const message = {
        type: "send_message",
        channelId: this.currentChannel.id,
        content,
        messageType
      };
      if (attachment) {
        message.attachment = attachment;
      }
      this.websocketService.send(message);
    }
    async sendTypingStart() {
      if (!this.currentChannel) return;
      this.websocketService.send({
        type: "typing_start",
        channelId: this.currentChannel.id
      });
    }
    async sendTypingStop() {
      if (!this.currentChannel) return;
      this.websocketService.send({
        type: "typing_stop",
        channelId: this.currentChannel.id
      });
    }
    // 数据访问
    getChannels() {
      return new Map(this.channels);
    }
    getChannel(channelId) {
      return this.channels.get(channelId);
    }
    getCurrentChannel() {
      return this.currentChannel;
    }
    getMessages(channelId) {
      return this.messages.get(channelId) || [];
    }
    getCurrentUser() {
      return this.currentUser;
    }
    isConnected() {
      return this.websocketService.isConnectionActive();
    }
    // 事件处理
    on(event, handler) {
      if (!this.eventHandlers.has(event)) {
        this.eventHandlers.set(event, []);
      }
      this.eventHandlers.get(event).push(handler);
    }
    off(event, handler) {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    }
    emit(event, data) {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(data);
          } catch (error) {
            this.api.logger.error(`聊天服务事件处理器执行失败 [${event}]:`, error);
          }
        });
      }
    }
    setupWebSocketHandlers() {
      this.websocketService.on("connected", () => {
        this.emit("connected");
      });
      this.websocketService.on("disconnected", (data) => {
        this.emit("disconnected", data);
      });
      this.websocketService.on("error", (error) => {
        this.emit("error", error);
      });
      this.websocketService.on("reconnecting", (data) => {
        this.emit("reconnecting", data);
      });
      this.websocketService.on("message", (message) => {
        this.handleServerMessage(message);
      });
    }
    authenticate() {
      this.websocketService.send({
        type: "authenticate",
        token: "user_token"
        // 实际应该从存储中获取
      });
    }
    handleServerMessage(data) {
      switch (data.type) {
        case "auth_success":
          this.handleAuthSuccess(data);
          break;
        case "channel_list":
          this.handleChannelList(data.channels);
          break;
        case "channel_joined":
          this.handleChannelJoined(data.channel);
          break;
        case "channel_created":
          this.handleChannelCreated(data.channel);
          break;
        case "message":
          this.handleNewMessage(data.message);
          break;
        case "user_joined":
          this.handleUserJoined(data);
          break;
        case "user_left":
          this.handleUserLeft(data);
          break;
        case "typing_start":
          this.emit("typing_start", data);
          break;
        case "typing_stop":
          this.emit("typing_stop", data);
          break;
        case "error":
          this.handleServerError(data);
          break;
        default:
          this.api.logger.warn("未知的服务器消息类型:", data.type);
      }
    }
    handleAuthSuccess(data) {
      var _a;
      this.currentUser = data.user;
      this.api.logger.info("用户认证成功:", (_a = this.currentUser) == null ? void 0 : _a.username);
      this.emit("auth_success", this.currentUser);
      this.requestChannelList();
      this.autoJoinChannels();
    }
    handleChannelList(channels) {
      this.api.logger.debug("收到频道列表:", channels);
      channels.forEach((channel) => {
        this.channels.set(channel.id, channel);
      });
      this.emit("channel_list_updated", channels);
    }
    handleChannelJoined(channel) {
      this.currentChannel = channel;
      this.channels.set(channel.id, channel);
      this.api.logger.info("已加入频道:", channel.name);
      this.emit("channel_joined", channel);
      this.requestChannelMessages(channel.id);
    }
    handleChannelCreated(channel) {
      this.channels.set(channel.id, channel);
      this.emit("channel_created", channel);
    }
    handleNewMessage(message) {
      var _a;
      this.api.logger.debug("收到新消息:", message);
      if (!this.messages.has(message.channelId)) {
        this.messages.set(message.channelId, []);
      }
      this.messages.get(message.channelId).push(message);
      const maxMessages = this.config.maxMessages;
      const channelMessages = this.messages.get(message.channelId);
      if (channelMessages.length > maxMessages) {
        channelMessages.splice(0, channelMessages.length - maxMessages);
      }
      this.emit("new_message", message);
      if (this.config.enableNotifications && message.authorId !== ((_a = this.currentUser) == null ? void 0 : _a.id)) {
        this.api.ui.showNotification(
          `${message.author.displayName}: ${message.content}`,
          "info"
        );
      }
    }
    handleUserJoined(data) {
      this.api.logger.info(`用户 ${data.user.displayName} 加入了频道 ${data.channelId}`);
      this.emit("user_joined", data);
    }
    handleUserLeft(data) {
      this.api.logger.info(`用户 ${data.userId} 离开了频道 ${data.channelId}`);
      this.emit("user_left", data);
    }
    handleServerError(data) {
      this.api.logger.error("服务器错误:", data.message);
      this.emit("server_error", data);
    }
    autoJoinChannels() {
      const autoJoinChannels = this.config.autoJoinChannels;
      if (Array.isArray(autoJoinChannels)) {
        autoJoinChannels.forEach((channelId) => {
          this.joinChannel(channelId);
        });
      }
    }
  }
  class FileUploadService {
    constructor(api) {
      this.api = api;
    }
    async showFileDialog() {
      return new Promise((resolve) => {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/*,video/*,.pdf,.doc,.docx,.txt,.zip,.rar";
        fileInput.style.display = "none";
        fileInput.onchange = (event) => {
          var _a;
          const target = event.target;
          const file = ((_a = target.files) == null ? void 0 : _a[0]) || null;
          resolve(file);
          document.body.removeChild(fileInput);
        };
        fileInput.oncancel = () => {
          resolve(null);
          document.body.removeChild(fileInput);
        };
        document.body.appendChild(fileInput);
        fileInput.click();
      });
    }
    async uploadFile(file) {
      this.validateFile(file);
      try {
        this.api.ui.showNotification("正在上传文件...", "info");
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "chat_attachment");
        const response = await this.api.http.post("/api/upload", formData, {
          headers: {
            // 不设置 Content-Type，让浏览器自动设置 multipart/form-data
          }
        });
        if (!response.ok) {
          throw new Error(`上传失败: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();
        const attachment = {
          id: result.id || Date.now().toString(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: result.url || URL.createObjectURL(file)
          // 如果服务器返回URL使用服务器的，否则使用本地预览
        };
        this.api.ui.showNotification("文件上传成功", "success");
        return attachment;
      } catch (error) {
        this.api.logger.error("文件上传失败:", error);
        if (this.isNetworkError(error)) {
          this.api.ui.showNotification("文件上传失败，使用本地预览", "warning");
          return {
            id: Date.now().toString(),
            name: file.name,
            size: file.size,
            type: file.type,
            url: URL.createObjectURL(file)
          };
        }
        throw error;
      }
    }
    validateFile(file) {
      const maxSize = 50 * 1024 * 1024;
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "video/mp4",
        "video/webm",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "application/zip",
        "application/x-rar-compressed"
      ];
      if (file.size > maxSize) {
        throw new Error(`文件大小不能超过 ${this.formatFileSize(maxSize)}`);
      }
      if (!allowedTypes.includes(file.type)) {
        throw new Error("不支持的文件类型");
      }
    }
    formatFileSize(bytes) {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }
    isNetworkError(error) {
      return error instanceof TypeError || error instanceof Error && error.message.includes("fetch");
    }
    // 创建文件预览
    createFilePreview(file) {
      const preview = document.createElement("div");
      preview.className = "file-preview";
      if (file.type.startsWith("image/")) {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        img.alt = file.name;
        img.style.maxWidth = "200px";
        img.style.maxHeight = "200px";
        preview.appendChild(img);
      } else {
        preview.innerHTML = `
        <div class="file-icon">📄</div>
        <div class="file-info">
          <div class="file-name">${this.escapeHtml(file.name)}</div>
          <div class="file-size">${this.formatFileSize(file.size)}</div>
        </div>
      `;
      }
      return preview;
    }
    escapeHtml(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    }
  }
  class ChannelList {
    constructor(container) {
      this.channels = /* @__PURE__ */ new Map();
      this.currentChannel = null;
      this.onChannelSelect = null;
      this.onCreateChannel = null;
      this.container = container;
      this.render();
    }
    update(props) {
      this.channels = props.channels;
      this.currentChannel = props.currentChannel;
      this.onChannelSelect = props.onChannelSelect;
      this.onCreateChannel = props.onCreateChannel;
      this.renderChannelList();
    }
    render() {
      this.container.innerHTML = `
      <div class="channel-section">
        <h3>频道列表</h3>
        <ul class="channel-list" id="channel-list"></ul>
        <button class="btn-create-channel" id="btn-create-channel">创建频道</button>
      </div>
    `;
      this.bindEvents();
    }
    renderChannelList() {
      const channelList = this.container.querySelector("#channel-list");
      if (!channelList) return;
      channelList.innerHTML = "";
      this.channels.forEach((channel) => {
        const li = document.createElement("li");
        li.className = "channel-item";
        li.setAttribute("data-channel-id", channel.id);
        if (this.currentChannel && channel.id === this.currentChannel.id) {
          li.classList.add("active");
        }
        li.innerHTML = `
        <span class="channel-icon">#</span>
        <span class="channel-name">${this.escapeHtml(channel.name)}</span>
        <span class="member-count">${channel.memberCount || 0}</span>
      `;
        li.addEventListener("click", () => {
          var _a;
          (_a = this.onChannelSelect) == null ? void 0 : _a.call(this, channel.id);
        });
        channelList.appendChild(li);
      });
    }
    bindEvents() {
      const createChannelButton = this.container.querySelector("#btn-create-channel");
      if (createChannelButton) {
        createChannelButton.addEventListener("click", () => {
          var _a;
          (_a = this.onCreateChannel) == null ? void 0 : _a.call(this);
        });
      }
    }
    highlightChannel(channelId) {
      this.container.querySelectorAll(".channel-item").forEach((item) => {
        item.classList.remove("active");
      });
      const currentChannelItem = this.container.querySelector(`[data-channel-id="${channelId}"]`);
      if (currentChannelItem) {
        currentChannelItem.classList.add("active");
      }
    }
    escapeHtml(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    }
  }
  class MessageArea {
    constructor(container) {
      this.messages = [];
      this.currentChannel = null;
      this.isLoading = false;
      this.container = container;
      this.render();
    }
    update(props) {
      this.messages = props.messages;
      this.currentChannel = props.currentChannel;
      this.isLoading = props.isLoading;
      this.renderMessages();
    }
    addMessage(message) {
      var _a;
      if (message.channelId === ((_a = this.currentChannel) == null ? void 0 : _a.id)) {
        this.messages.push(message);
        this.displayMessage(message);
        this.scrollToBottom();
      }
    }
    clear() {
      this.container.innerHTML = "";
    }
    showLoading() {
      this.container.innerHTML = '<div class="loading">加载消息中...</div>';
    }
    showNoChannel() {
      this.container.innerHTML = `
      <div class="no-channel-selected">
        <p>请从左侧选择一个频道开始聊天</p>
      </div>
    `;
    }
    render() {
      this.showNoChannel();
    }
    renderMessages() {
      if (!this.currentChannel) {
        this.showNoChannel();
        return;
      }
      if (this.isLoading) {
        this.showLoading();
        return;
      }
      this.container.innerHTML = "";
      if (this.messages.length === 0) {
        this.container.innerHTML = '<div class="no-messages">暂无消息</div>';
        return;
      }
      this.messages.forEach((message) => {
        this.displayMessage(message);
      });
      this.scrollToBottom();
    }
    displayMessage(message) {
      const messageElement = document.createElement("div");
      messageElement.className = "message-item";
      messageElement.setAttribute("data-message-id", message.id);
      const timestamp = new Date(message.timestamp).toLocaleTimeString();
      messageElement.innerHTML = `
      <div class="message-header">
        <img class="user-avatar"
             src="${message.author.avatar || "/default-avatar.png"}"
             alt="${this.escapeHtml(message.author.displayName)}"
             onerror="this.src='/default-avatar.png'">
        <span class="username">${this.escapeHtml(message.author.displayName)}</span>
        <span class="timestamp">${timestamp}</span>
      </div>
      <div class="message-content">${this.formatMessageContent(message.content)}</div>
      ${this.renderAttachment(message)}
    `;
      this.container.appendChild(messageElement);
    }
    renderAttachment(message) {
      if (!message.attachment) {
        return "";
      }
      const attachment = message.attachment;
      if (attachment.type.startsWith("image/")) {
        return `
        <div class="message-attachment">
          <img src="${attachment.url}"
               alt="${this.escapeHtml(attachment.name)}"
               class="attachment-image"
               loading="lazy">
        </div>
      `;
      }
      return `
      <div class="message-attachment">
        <a href="${attachment.url}"
           target="_blank"
           class="attachment-link">
          <span class="attachment-icon">📎</span>
          <span class="attachment-name">${this.escapeHtml(attachment.name)}</span>
          <span class="attachment-size">(${this.formatFileSize(attachment.size)})</span>
        </a>
      </div>
    `;
    }
    formatMessageContent(content) {
      return this.escapeHtml(content).replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>').replace(/\n/g, "<br>");
    }
    formatFileSize(bytes) {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }
    scrollToBottom() {
      this.container.scrollTop = this.container.scrollHeight;
    }
    escapeHtml(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    }
  }
  class MessageInput {
    constructor(container) {
      this.messageInput = null;
      this.sendButton = null;
      this.attachButton = null;
      this.typingIndicator = null;
      this.onSendMessage = null;
      this.onFileUpload = null;
      this.currentChannel = null;
      this.disabled = false;
      this.typingTimeout = null;
      this.isTyping = false;
      this.container = container;
      this.render();
    }
    update(props) {
      this.onSendMessage = props.onSendMessage;
      this.onFileUpload = props.onFileUpload;
      this.currentChannel = props.currentChannel;
      this.disabled = props.disabled;
      this.updateUI();
    }
    setTypingIndicator(username, isVisible) {
      if (!this.typingIndicator) return;
      if (isVisible) {
        this.typingIndicator.textContent = `${username} 正在输入...`;
        this.typingIndicator.style.display = "block";
      } else {
        this.typingIndicator.style.display = "none";
      }
    }
    render() {
      this.container.innerHTML = `
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
    `;
      this.cacheElements();
      this.bindEvents();
    }
    cacheElements() {
      this.messageInput = this.container.querySelector("#message-input");
      this.sendButton = this.container.querySelector("#btn-send");
      this.attachButton = this.container.querySelector("#btn-attach");
      this.typingIndicator = this.container.querySelector("#typing-indicator");
    }
    bindEvents() {
      if (this.messageInput) {
        this.messageInput.addEventListener("keypress", (e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            this.handleSendMessage();
          }
        });
        this.messageInput.addEventListener("input", () => {
          this.handleTyping();
        });
        this.messageInput.addEventListener("blur", () => {
          this.stopTyping();
        });
      }
      if (this.sendButton) {
        this.sendButton.addEventListener("click", () => {
          this.handleSendMessage();
        });
      }
      if (this.attachButton) {
        this.attachButton.addEventListener("click", () => {
          var _a;
          (_a = this.onFileUpload) == null ? void 0 : _a.call(this);
        });
      }
    }
    updateUI() {
      const shouldEnable = !this.disabled && this.currentChannel !== null;
      if (this.messageInput) {
        this.messageInput.disabled = !shouldEnable;
        this.messageInput.placeholder = this.currentChannel ? "输入消息..." : "请先选择一个频道";
      }
      if (this.sendButton) {
        this.sendButton.disabled = !shouldEnable;
      }
      if (this.attachButton) {
        this.attachButton.disabled = !shouldEnable;
      }
    }
    handleSendMessage() {
      var _a;
      if (!this.messageInput || !this.currentChannel || this.disabled) {
        return;
      }
      const content = this.messageInput.value.trim();
      if (!content) {
        return;
      }
      (_a = this.onSendMessage) == null ? void 0 : _a.call(this, content);
      this.messageInput.value = "";
      this.stopTyping();
    }
    handleTyping() {
      if (!this.currentChannel || this.disabled) return;
      if (!this.isTyping) {
        this.isTyping = true;
        this.emitTypingStart();
      }
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
      }
      this.typingTimeout = setTimeout(() => {
        this.stopTyping();
      }, 3e3);
    }
    stopTyping() {
      if (this.isTyping) {
        this.isTyping = false;
        this.emitTypingStop();
      }
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
        this.typingTimeout = null;
      }
    }
    emitTypingStart() {
      var _a;
      const event = new CustomEvent("typing:start", {
        detail: { channelId: (_a = this.currentChannel) == null ? void 0 : _a.id }
      });
      this.container.dispatchEvent(event);
    }
    emitTypingStop() {
      var _a;
      const event = new CustomEvent("typing:stop", {
        detail: { channelId: (_a = this.currentChannel) == null ? void 0 : _a.id }
      });
      this.container.dispatchEvent(event);
    }
    focus() {
      var _a;
      (_a = this.messageInput) == null ? void 0 : _a.focus();
    }
    clear() {
      if (this.messageInput) {
        this.messageInput.value = "";
      }
      this.stopTyping();
    }
  }
  class ChatPlugin extends BasePlugin {
    constructor(api, manifest) {
      super(api, manifest);
      this.chatContainer = null;
      this.channelList = null;
      this.messageArea = null;
      this.messageInput = null;
      this.config = {
        serverUrl: "ws://localhost:3001",
        maxMessages: 1e3,
        enableNotifications: true,
        enableSound: true,
        theme: "auto",
        autoJoinChannels: ["general"]
      };
      this.chatService = new ChatService(this.api, this.config);
      this.fileUploadService = new FileUploadService(this.api);
    }
    async onLoad() {
      try {
        this.info("聊天插件开始加载 - TypeScript 开发版");
        await this.loadConfig();
        this.chatContainer = this.createContainer("chat-main");
        this.initializeUI();
        await this.chatService.initialize();
        this.registerEventHandlers();
        this.info("聊天插件加载完成");
        this.showNotification("聊天插件已启动", "success");
      } catch (error) {
        this.error("聊天插件加载失败:", error);
        this.showNotification("聊天插件启动失败: " + error.message, "error");
        throw error;
      }
    }
    async onUnload() {
      try {
        this.info("聊天插件开始卸载");
        await this.chatService.disconnect();
        this.removeEventHandlers();
        this.cleanupUI();
        this.removeContainer();
        this.info("聊天插件卸载完成");
      } catch (error) {
        this.error("聊天插件卸载失败:", error);
      }
    }
    async onActivate() {
      this.info("聊天插件已激活");
      if (this.chatContainer) {
        this.chatContainer.style.display = "block";
      }
      if (!this.chatService.isConnected()) {
        try {
          await this.chatService.initialize();
        } catch (error) {
          this.error("重新连接失败:", error);
        }
      }
    }
    async onDeactivate() {
      this.info("聊天插件已停用");
      if (this.chatContainer) {
        this.chatContainer.style.display = "none";
      }
    }
    async loadConfig() {
      const config = this.getAllConfig();
      const defaults = {
        serverUrl: "ws://localhost:3001",
        maxMessages: 1e3,
        enableNotifications: true,
        enableSound: true,
        theme: "auto",
        autoJoinChannels: ["general"]
      };
      for (const [key, value] of Object.entries(defaults)) {
        if (config[key] === void 0) {
          await this.setConfig(key, value);
        }
      }
      this.config = { ...defaults, ...config };
      this.debug("配置加载完成:", this.config);
    }
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
            <div id="channel-list-container"></div>
            <div id="user-list-container"></div>
          </div>

          <div class="main-chat">
            <div class="channel-header" id="channel-header">
              <span class="channel-name">请选择一个频道</span>
              <div class="channel-actions">
                <button class="btn-channel-info" id="btn-channel-info">信息</button>
                <button class="btn-leave-channel" id="btn-leave-channel">离开</button>
              </div>
            </div>

            <div class="message-area" id="message-area"></div>
            <div class="input-area" id="input-area"></div>
          </div>
        </div>
      </div>
    `;
      this.initializeComponents();
      this.bindUIEvents();
      this.applyTheme();
    }
    initializeComponents() {
      if (!this.chatContainer) return;
      const channelListContainer = this.chatContainer.querySelector("#channel-list-container");
      if (channelListContainer) {
        this.channelList = new ChannelList(channelListContainer);
      }
      const messageArea = this.chatContainer.querySelector("#message-area");
      if (messageArea) {
        this.messageArea = new MessageArea(messageArea);
      }
      const inputArea = this.chatContainer.querySelector("#input-area");
      if (inputArea) {
        this.messageInput = new MessageInput(inputArea);
      }
    }
    bindUIEvents() {
      if (!this.chatContainer) return;
      const channelInfoButton = this.chatContainer.querySelector("#btn-channel-info");
      channelInfoButton == null ? void 0 : channelInfoButton.addEventListener("click", () => {
        this.showChannelInfo();
      });
      const leaveChannelButton = this.chatContainer.querySelector("#btn-leave-channel");
      leaveChannelButton == null ? void 0 : leaveChannelButton.addEventListener("click", () => {
        this.leaveCurrentChannel();
      });
      const inputArea = this.chatContainer.querySelector("#input-area");
      if (inputArea) {
        inputArea.addEventListener("typing:start", () => {
          this.chatService.sendTypingStart();
        });
        inputArea.addEventListener("typing:stop", () => {
          this.chatService.sendTypingStop();
        });
      }
    }
    registerEventHandlers() {
      this.chatService.on("connected", () => {
        this.updateConnectionStatus("connected", "已连接");
        this.updateUIState();
      });
      this.chatService.on("disconnected", () => {
        this.updateConnectionStatus("disconnected", "连接断开");
        this.updateUIState();
      });
      this.chatService.on("reconnecting", (data) => {
        this.updateConnectionStatus("reconnecting", `重连中(${data.attempt}/${data.maxAttempts})`);
      });
      this.chatService.on("error", (error) => {
        this.updateConnectionStatus("error", "连接错误");
        this.error("聊天服务错误:", error);
      });
      this.chatService.on("channel_list_updated", (channels) => {
        this.updateChannelList();
      });
      this.chatService.on("channel_joined", (channel) => {
        this.handleChannelJoined(channel);
      });
      this.chatService.on("new_message", (message) => {
        this.handleNewMessage(message);
      });
      this.chatService.on("typing_start", (data) => {
        var _a;
        (_a = this.messageInput) == null ? void 0 : _a.setTypingIndicator(data.username, true);
      });
      this.chatService.on("typing_stop", (data) => {
        var _a;
        (_a = this.messageInput) == null ? void 0 : _a.setTypingIndicator(data.username, false);
      });
      this.on("system:theme-changed", () => {
        this.applyTheme();
      });
      this.on("system:before-quit", () => {
        this.chatService.disconnect();
      });
    }
    removeEventHandlers() {
      this.off("system:theme-changed", this.applyTheme);
      this.off("system:before-quit", () => this.chatService.disconnect());
    }
    updateConnectionStatus(status, text) {
      var _a;
      const statusElement = (_a = this.chatContainer) == null ? void 0 : _a.querySelector("#connection-status");
      if (!statusElement) return;
      const indicator = statusElement.querySelector(".status-indicator");
      const textElement = statusElement.querySelector(".status-text");
      if (indicator && textElement) {
        indicator.className = `status-indicator status-${status}`;
        textElement.textContent = text;
      }
    }
    updateUIState() {
      var _a;
      const isConnected = this.chatService.isConnected();
      const currentChannel = this.chatService.getCurrentChannel();
      (_a = this.messageInput) == null ? void 0 : _a.update({
        onSendMessage: (content) => this.sendMessage(content),
        onFileUpload: () => this.handleFileUpload(),
        disabled: !isConnected,
        currentChannel
      });
    }
    updateChannelList() {
      var _a;
      const channels = this.chatService.getChannels();
      const currentChannel = this.chatService.getCurrentChannel();
      (_a = this.channelList) == null ? void 0 : _a.update({
        channels,
        currentChannel,
        onChannelSelect: (channelId) => this.joinChannel(channelId),
        onCreateChannel: () => this.showCreateChannelDialog()
      });
    }
    handleChannelJoined(channel) {
      this.updateChannelHeader(channel);
      this.updateMessageArea(channel.id);
      this.updateChannelList();
    }
    handleNewMessage(message) {
      var _a, _b;
      (_a = this.messageArea) == null ? void 0 : _a.addMessage(message);
      if (this.config.enableSound && message.authorId !== ((_b = this.chatService.getCurrentUser()) == null ? void 0 : _b.id)) {
        this.playNotificationSound();
      }
    }
    updateChannelHeader(channel) {
      var _a;
      const channelHeader = (_a = this.chatContainer) == null ? void 0 : _a.querySelector("#channel-header");
      if (!channelHeader) return;
      const channelName = channelHeader.querySelector(".channel-name");
      if (channelName) {
        channelName.textContent = `# ${channel.name}`;
      }
    }
    updateMessageArea(channelId) {
      var _a;
      const messages = this.chatService.getMessages(channelId);
      const currentChannel = this.chatService.getCurrentChannel();
      (_a = this.messageArea) == null ? void 0 : _a.update({
        messages,
        currentChannel,
        isLoading: false
      });
    }
    async sendMessage(content) {
      try {
        await this.chatService.sendMessage(content);
      } catch (error) {
        this.error("发送消息失败:", error);
        this.showNotification("发送消息失败: " + error.message, "error");
      }
    }
    async handleFileUpload() {
      try {
        const file = await this.fileUploadService.showFileDialog();
        if (!file) return;
        const attachment = await this.fileUploadService.uploadFile(file);
        await this.chatService.sendMessage(`[文件] ${file.name}`, "file", attachment);
      } catch (error) {
        this.error("文件上传失败:", error);
        this.showNotification("文件上传失败: " + error.message, "error");
      }
    }
    async joinChannel(channelId) {
      try {
        await this.chatService.joinChannel(channelId);
      } catch (error) {
        this.error("加入频道失败:", error);
        this.showNotification("加入频道失败: " + error.message, "error");
      }
    }
    async showCreateChannelDialog() {
      try {
        await this.showDialog({
          title: "创建新频道",
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
              text: "创建",
              type: "primary",
              onClick: () => {
                const nameElement = document.getElementById("channel-name");
                const descriptionElement = document.getElementById("channel-description");
                const name = nameElement == null ? void 0 : nameElement.value.trim();
                const description = descriptionElement == null ? void 0 : descriptionElement.value.trim();
                if (!name) {
                  this.showNotification("请输入频道名称", "warning");
                  return false;
                }
                this.createChannel(name, description);
                return true;
              }
            },
            {
              text: "取消",
              type: "secondary"
            }
          ]
        });
      } catch (error) {
        this.error("显示创建频道对话框失败:", error);
      }
    }
    async createChannel(name, description) {
      try {
        await this.chatService.createChannel(name, description);
      } catch (error) {
        this.error("创建频道失败:", error);
        this.showNotification("创建频道失败: " + error.message, "error");
      }
    }
    showChannelInfo() {
      const currentChannel = this.chatService.getCurrentChannel();
      if (!currentChannel) return;
      this.showDialog({
        title: "频道信息",
        content: `
        <div class="channel-info">
          <h3>${currentChannel.name}</h3>
          <p><strong>描述:</strong> ${currentChannel.description || "无描述"}</p>
          <p><strong>成员数量:</strong> ${currentChannel.memberCount || 0}</p>
          <p><strong>创建时间:</strong> ${new Date(currentChannel.createdAt).toLocaleString()}</p>
        </div>
      `,
        buttons: [
          { text: "关闭", type: "primary" }
        ]
      });
    }
    async leaveCurrentChannel() {
      const currentChannel = this.chatService.getCurrentChannel();
      if (!currentChannel) return;
      try {
        const confirmed = await this.showDialog({
          title: "离开频道",
          content: `确定要离开频道 "${currentChannel.name}" 吗？`,
          buttons: [
            {
              text: "离开",
              type: "danger",
              onClick: () => true
            },
            {
              text: "取消",
              type: "secondary",
              onClick: () => false
            }
          ]
        });
        if (confirmed) {
          await this.chatService.leaveChannel(currentChannel.id);
        }
      } catch (error) {
        this.error("离开频道失败:", error);
        this.showNotification("离开频道失败: " + error.message, "error");
      }
    }
    applyTheme() {
      const theme = this.config.theme;
      if (this.chatContainer) {
        this.chatContainer.setAttribute("data-theme", theme);
      }
    }
    playNotificationSound() {
      try {
        const audio = new Audio("/assets/notification.mp3");
        audio.volume = 0.3;
        audio.play().catch((error) => {
          this.debug("播放通知声音失败:", error);
        });
      } catch (error) {
        this.debug("创建音频对象失败:", error);
      }
    }
    cleanupUI() {
      this.channelList = null;
      this.messageArea = null;
      this.messageInput = null;
    }
  }
  function createPlugin(api, manifest) {
    return new ChatPlugin(api, manifest);
  }
  if (typeof window !== "undefined") {
    if (!window.LifeBoxPlugins) {
      window.LifeBoxPlugins = {};
    }
    window.LifeBoxPlugins["chat-plugin-dev"] = ChatPlugin;
    window.createChatPlugin = createPlugin;
    window.ChatPlugin = ChatPlugin;
  }
  exports2.ChatPlugin = ChatPlugin;
  exports2.createPlugin = createPlugin;
  exports2.default = createPlugin;
  Object.defineProperties(exports2, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
});
//# sourceMappingURL=chat-plugin.umd.cjs.map
