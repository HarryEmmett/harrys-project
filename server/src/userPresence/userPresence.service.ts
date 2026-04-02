import { Injectable } from '@nestjs/common';

@Injectable()
export class UserPresenceService {
  // implement client id to namespace mapping to track how many clients are in each namespace, and total clients across all namespaces
  private userMap: Map<string, number> = new Map();

  handleAddUser(namespace: string) {
    this.addToNamespaceMap(namespace);
  }

  handleRemoveUser(namespace: string) {
    this.removeFromNamespaceMap(namespace);
  }

  addToNamespaceMap(namespace: string) {
    if (this.userMap.has(namespace)) {
      this.userMap.set(namespace, (this.userMap.get(namespace) ?? 0) + 1);
    } else {
      this.userMap.set(namespace, 1);
    }
  }

  removeFromNamespaceMap(namespace: string) {
    if (this.userMap.has(namespace)) {
      const currentCount = this.userMap.get(namespace) ?? 0;

      if (currentCount > 0) {
        this.userMap.set(namespace, currentCount - 1);
      }
    }
  }

  getTotalOnlineCount() {
    let totalCount = 0;
    for (const count of this.userMap.values()) {
      totalCount += count;
    }
    return totalCount;
  }

  getNamespaceOnlineCount(namespace: string) {
    return this.userMap.get(namespace) ?? 0;
  }
}
