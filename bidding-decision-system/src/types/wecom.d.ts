declare module '@wecom/aibot-node-sdk' {
  export interface WSOptions {
    botId: string;
    secret: string;
    logger?: { info: () => void; warn: () => void; error: (e: unknown) => void; debug: () => void };
  }
  export class WSClient {
    constructor(opts: WSOptions);
    sendText(userId: string, content: string): Promise<unknown>;
  }
}
