import type { ChatUser, UserListProps } from '../types';

export class UserList {
  private container: HTMLElement;
  private users: ChatUser[] = [];
  private currentUser: ChatUser | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  update(props: UserListProps): void {
    this.users = props.users;
    this.currentUser = props.currentUser;
    this.renderUsers();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="user-section">
        <h3>在线用户</h3>
        <ul class="user-list" id="user-list"></ul>
      </div>
    `;
  }

  private renderUsers(): void {
    const userList = this.container.querySelector('#user-list') as HTMLUListElement;
    if (!userList) return;

    userList.innerHTML = '';

    if (this.users.length === 0) {
      userList.innerHTML = '<li class="no-users">暂无在线用户</li>';
      return;
    }

    this.users.forEach(user => {
      const li = document.createElement('li');
      li.className = 'user-item';
      li.setAttribute('data-user-id', user.id);

      if (this.currentUser && user.id === this.currentUser.id) {
        li.classList.add('current-user');
      }

      li.innerHTML = `
        <img class="user-avatar"
             src="${user.avatar || '/default-avatar.png'}"
             alt="${this.escapeHtml(user.displayName)}"
             onerror="this.src='/default-avatar.png'">
        <div class="user-info">
          <span class="user-name">${this.escapeHtml(user.displayName)}</span>
          <span class="user-status status-${user.status}">${this.getStatusText(user.status)}</span>
        </div>
        <div class="status-indicator status-${user.status}"></div>
      `;

      userList.appendChild(li);
    });
  }

  private getStatusText(status: ChatUser['status']): string {
    switch (status) {
      case 'online': return '在线';
      case 'away': return '离开';
      case 'busy': return '忙碌';
      case 'offline': return '离线';
      default: return '未知';
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}