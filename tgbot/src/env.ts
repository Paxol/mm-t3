import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    OPENAI_TOKEN: z.string().optional(),
    BOT_TOKEN: z.string().min(1, "You have to provide the bot-token from @BotFather via environment variable (BOT_TOKEN)"),
  },
  runtimeEnv: {
    OPENAI_TOKEN: process.env.OPENAI_TOKEN,
    BOT_TOKEN: process.env.BOT_TOKEN,
  },
});
