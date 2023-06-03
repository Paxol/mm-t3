import { Fetcher, OpArgType } from "openapi-typescript-fetch";

import { paths } from "./schema.js";

export class OpenAIClient {
  model = "gpt-3.5-turbo-0301";
  baseUrl = "https://api.openai.com/v1";
  fetcher = Fetcher.for<paths>();

  apiKey: string;
  systemMessage?: Message;

  constructor(apiKey: string, systemMessage?: string) {
    this.apiKey = apiKey;

    if (systemMessage)
      this.systemMessage = {
        role: "system",
        content: systemMessage,
      };

    this.fetcher.configure({
      baseUrl: this.baseUrl,
      init: {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      },
    });
  }

  async ask(message: string) {
    this.askMessages([
      {
        role: "user",
        content: message,
      },
    ]);
  }

  async askMessages(messages: Message[]) {
    const mutation = this.fetcher
      .path("/chat/completions")
      .method("post")
      .create();

    const requestMessages = this.systemMessage !== undefined ? [] : messages;

    await mutation({
      model: this.model,
      messages: requestMessages,
    });
  }
}

export type Message = OpArgType<
  paths["/chat/completions"]["post"]
>["messages"][number];
