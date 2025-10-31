/**
 * Base message store management for microAgents framework.
 * 
 * This module provides a base BaseMessageStore class that can be extended with additional
 * fields and functionality while maintaining compatibility with the core framework.
 */

export interface Message {
    role: string;
    content: string;
}

export class BaseMessageStore {
    messages: Message[];

    /**
     * Initialize base message store with messages list.
     */
    constructor() {
        this.messages = [];
    }

    /**
     * Add a message to the store and return its index.
     * 
     * @param message - Message object with 'role' and 'content'
     * @returns Index of the newly added message
     */
    addMessage(message: Message): number {
        this.messages.push(message);
        return this.messages.length - 1;
    }

    /**
     * Get a copy of all messages to prevent modification.
     * 
     * @returns Copy of all stored messages
     */
    getMessages(): Message[] {
        return [...this.messages];
    }

    /**
     * Clear all messages from the store.
     */
    clearMessages(): void {
        this.messages = [];
    }

    /**
     * Get the last message in the store.
     * 
     * @returns The last message or null if store is empty
     */
    getLastMessage(): Message | null {
        return this.messages.length > 0 ? this.messages[this.messages.length - 1] : null;
    }
}