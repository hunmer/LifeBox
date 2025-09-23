import type { ChatChannel, ChannelListProps } from '../types';

export class ChannelList {
  private container: HTMLElement;
  private channels = new Map<string, ChatChannel>();
  private currentChannel: ChatChannel | null = null;
  private onChannelSelect: ((channelId: string) => void) | null = null;
  private onCreateChannel: (() => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  update(props: ChannelListProps): void {
    this.channels = props.channels;
    this.currentChannel = props.currentChannel;
    this.onChannelSelect = props.onChannelSelect;
    this.onCreateChannel = props.onCreateChannel;
    this.renderChannelList();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="channel-section">
        <h3>频道列表</h3>
        <ul class="channel-list" id="channel-list"></ul>
        <button class="btn-create-channel" id="btn-create-channel">创建频道</button>
      </div>
    `;

    this.bindEvents();
  }

  private renderChannelList(): void {
    const channelList = this.container.querySelector('#channel-list') as HTMLUListElement;
    if (!channelList) return;

    channelList.innerHTML = '';

    this.channels.forEach(channel => {
      const li = document.createElement('li');
      li.className = 'channel-item';
      li.setAttribute('data-channel-id', channel.id);

      if (this.currentChannel && channel.id === this.currentChannel.id) {
        li.classList.add('active');
      }

      li.innerHTML = `
        <span class="channel-icon">#</span>
        <span class="channel-name">${this.escapeHtml(channel.name)}</span>
        <span class="member-count">${channel.memberCount || 0}</span>
      `;

      li.addEventListener('click', () => {
        this.onChannelSelect?.(channel.id);
      });

      channelList.appendChild(li);
    });
  }

  private bindEvents(): void {
    const createChannelButton = this.container.querySelector('#btn-create-channel') as HTMLButtonElement;

    if (createChannelButton) {
      createChannelButton.addEventListener('click', () => {
        this.onCreateChannel?.();
      });
    }
  }

  highlightChannel(channelId: string): void {
    // 移除其他频道的高亮
    this.container.querySelectorAll('.channel-item').forEach(item => {
      item.classList.remove('active');
    });

    // 高亮当前频道
    const currentChannelItem = this.container.querySelector(`[data-channel-id="${channelId}"]`) as HTMLElement;
    if (currentChannelItem) {
      currentChannelItem.classList.add('active');
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}