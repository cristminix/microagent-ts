/**
 * Module for interacting with OpenAI-like LLMs.
 */

import fetch from 'node-fetch';
import { Message } from '../core/message_store';

export interface LLMConfig {
    baseUrl: string;
    apiKey?: string;
    model: string;
    maxTokens: number;
    temperature: number;
    topP: number;
}

export interface ChatCompletionResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

export interface CompletionResponse {
    choices: Array<{
        text: string;
    }>;
}

export interface EmbeddingResponse {
    data: Array<{
        embedding: number[];
    }>;
}

export class LLM {
    baseUrl: string;
    apiKey?: string;
    model: string;
    defaultParams: {
        model: string;
        max_tokens: number;
        temperature: number;
        top_p: number;
    };

    constructor(
        baseUrl: string,
        apiKey?: string,
        model: string = "gpt-3.5-turbo",
        maxTokens: number = 1000,
        temperature: number = 0.7,
        topP: number = 1.0
    ) {
        this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.apiKey = apiKey;
        this.model = model;
        this.defaultParams = {
            model: model,
            max_tokens: maxTokens,
            temperature: temperature,
            top_p: topP
        };
    }

    private async _request(endpoint: string, payload: any): Promise<any> {
        const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;

        const headers: { [key: string]: string } = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async completions(
        prompt: string,
        maxTokens?: number,
        temperature?: number,
        topP?: number,
        ...kwargs: any[]
    ): Promise<string> {
        const payload: any = {
            prompt: prompt,
            ...this.defaultParams,
            ...(kwargs.length > 0 ? kwargs[0] : {})
        };

        if (maxTokens !== undefined) payload.max_tokens = maxTokens;
        if (temperature !== undefined) payload.temperature = temperature;
        if (topP !== undefined) payload.top_p = topP;

        const response: CompletionResponse = await this._request('/completions', payload);
        return response.choices[0].text;
    }

    async chat(
        messages: Message[],
        maxTokens?: number,
        temperature?: number,
        topP?: number,
        ...kwargs: any[]
    ): Promise<string> {
        const payload: any = {
            messages: messages,
            ...this.defaultParams,
            ...(kwargs.length > 0 ? kwargs[0] : {})
        };

        if (maxTokens !== undefined) payload.max_tokens = maxTokens;
        if (temperature !== undefined) payload.temperature = temperature;
        if (topP !== undefined) payload.top_p = topP;

        const response: ChatCompletionResponse = await this._request('/chat/completions', payload);
        return response.choices[0].message.content;
    }

    async embeddings(
        input: string | string[],
        model?: string,
        ...kwargs: any[]
    ): Promise<number[]> {
        const payload: any = {
            input: input,
            model: model || this.model,
            ...(kwargs.length > 0 ? kwargs[0] : {})
        };

        const response: EmbeddingResponse = await this._request('/embeddings', payload);
        return response.data[0].embedding;
    }
}