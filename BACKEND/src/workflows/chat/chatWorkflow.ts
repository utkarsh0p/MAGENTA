import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { config } from "../../config.js";

const ChatWorkflowState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (left, right) => left.concat(right),
    default: () => []
  })
});

function getModel() {
  if (!config.geminiApiKey) {
    throw new Error("Missing GEMINI_API_KEY in .env");
  }

  return new ChatGoogleGenerativeAI({
    apiKey: config.geminiApiKey,
    model: config.geminiModel,
    temperature: 0.4,
    streaming: true
  });
}

async function callModel(state: typeof ChatWorkflowState.State) {
  const response = await getModel().invoke(state.messages);
  return { messages: [response] };
}

const chatWorkflow = new StateGraph(ChatWorkflowState)
  .addNode("model", callModel)
  .addEdge(START, "model")
  .addEdge("model", END)
  .compile();

export type StreamChatWorkflowInput = {
  message: string;
  threadId: string;
  systemPrompt?: string;
  userPrompt?: string;
};

export async function* streamChatWorkflow(input: StreamChatWorkflowInput) {
  const systemPrompt = input.systemPrompt?.trim() || "You are the HumanTouch Admin agent. Be concise, useful, and honest.";
  const userPrompt = input.userPrompt?.trim();
  const messages: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    ...(userPrompt ? [new SystemMessage(`User response preferences: ${userPrompt}`)] : []),
    new HumanMessage(input.message)
  ];

  const stream = await chatWorkflow.streamEvents(
    { messages },
    {
      version: "v2",
      configurable: {
        thread_id: input.threadId
      }
    }
  );

  for await (const event of stream) {
    if (event.event !== "on_chat_model_stream") {
      continue;
    }

    const chunk = event.data?.chunk;
    const content = chunk?.content;

    if (typeof content === "string" && content.length > 0) {
      yield content;
      continue;
    }

    if (Array.isArray(content)) {
      for (const part of content) {
        if (typeof part === "string") {
          yield part;
        } else if (part && typeof part === "object" && "text" in part && typeof part.text === "string") {
          yield part.text;
        }
      }
    }
  }
}
