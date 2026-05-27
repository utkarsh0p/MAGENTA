"use client";

import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, Copy, Pencil } from "lucide-react";
import ClaudeChatInput, {
  type AttachedFile,
} from "@/components/ui/claude-style-chat-input";
import { HoneycombLoader } from "@/components/ui/honeycomb-loader";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
}

interface ChatInputPayload {
  message: string;
  files: AttachedFile[];
  pastedContent: unknown[];
}

const getGreeting = () => {
  const currentHour = new Date().getHours();

  if (currentHour < 12) return "Good morning";
  if (currentHour < 18) return "Good afternoon";
  return "Good evening";
};

const parseSseEvent = (eventBlock: string) => {
  let event = "message";
  const dataLines: string[] = [];

  for (const line of eventBlock.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trim());
    }
  }

  return {
    event,
    data: dataLines.join("\n"),
  };
};

const STREAM_RENDER_INTERVAL_MS = 80;

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

const updateAssistantMessage = (
  assistantId: string,
  content: string,
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>,
) => {
  setMessages((currentMessages) =>
    currentMessages.map((message) =>
      message.id === assistantId ? { ...message, content } : message,
    ),
  );
};

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState<{
    id: string;
    text: string;
  } | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const threadIdRef = useRef(`web-${crypto.randomUUID()}`);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const greeting = useMemo(() => `${getGreeting()}, ready when you are`, []);
  const hasMessages = messages.length > 0;

  useEffect(() => {
    const messagesScroll = messagesScrollRef.current;

    if (!messagesScroll) return;

    messagesScroll.scrollTo({
      top: messagesScroll.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isStreaming]);

  const copyMessage = async (message: ChatMessage) => {
    const content = message.content;

    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = content;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCopiedMessageId(message.id);
    window.setTimeout(() => {
      setCopiedMessageId((currentId) =>
        currentId === message.id ? null : currentId,
      );
    }, 1200);
  };

  const editMessage = (content: string) => {
    if (!content) return;

    setDraftMessage({
      id: crypto.randomUUID(),
      text: content,
    });
  };

  const handleSendMessage = async (payload: ChatInputPayload) => {
    const userText = payload.message.trim();
    const pastedText = payload.pastedContent.length
      ? `\n\nPasted content attached: ${payload.pastedContent.length}`
      : "";
    const fileText = payload.files.length
      ? `\n\nFiles attached: ${payload.files.map((item) => item.file.name).join(", ")}`
      : "";
    const outboundMessage = `${userText}${pastedText}${fileText}`.trim();

    if (!outboundMessage || isStreaming) return;

    const assistantId = crypto.randomUUID();
    const now = Date.now();

    setError(null);
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: userText || "Attachment message",
        createdAt: now,
      },
      {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: now,
      },
    ]);
    setIsStreaming(true);

    let streamedText = "";
    let renderedText = "";
    let renderTimer: number | null = null;

    const flushAssistantMessage = () => {
      if (streamedText === renderedText) return;

      renderedText = streamedText;
      updateAssistantMessage(assistantId, renderedText, setMessages);
    };

    const scheduleAssistantMessageFlush = () => {
      if (renderTimer) return;

      renderTimer = window.setTimeout(() => {
        renderTimer = null;
        flushAssistantMessage();
      }, STREAM_RENDER_INTERVAL_MS);
    };

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: outboundMessage,
          thread_id: threadIdRef.current,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat request failed with ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Chat stream response was empty");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let receivedToken = false;

      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });

        const eventBlocks = buffer.split("\n\n");
        buffer = eventBlocks.pop() ?? "";

        for (const eventBlock of eventBlocks) {
          if (!eventBlock.trim()) continue;

          const parsedEvent = parseSseEvent(eventBlock);
          const data = parsedEvent.data ? JSON.parse(parsedEvent.data) : {};

          if (parsedEvent.event === "token" && typeof data.text === "string") {
            receivedToken = true;
            streamedText += data.text;
            scheduleAssistantMessageFlush();
          }

          if (parsedEvent.event === "error") {
            throw new Error(data.message ?? "Chat stream failed");
          }
        }

        if (done) break;
      }

      if (renderTimer) {
        window.clearTimeout(renderTimer);
        renderTimer = null;
      }

      flushAssistantMessage();

      if (!receivedToken) {
        updateAssistantMessage(assistantId, "No response received.", setMessages);
      }
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Chat request failed";

      if (renderTimer) {
        window.clearTimeout(renderTimer);
        renderTimer = null;
      }

      flushAssistantMessage();
      setError(message);
      setMessages((currentMessages) =>
        currentMessages.map((chatMessage) =>
          chatMessage.id === assistantId && !chatMessage.content
            ? {
                ...chatMessage,
                content: "I could not complete that response.",
              }
            : chatMessage,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <main className="chat-page h-dvh overflow-hidden bg-bg-0 text-text-100">
      <div
        className={`chat-page-content relative z-10 mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col bg-bg-0 px-4 sm:px-6 lg:px-8 ${
          hasMessages ? "pb-0" : "pb-8"
        }`}
      >
        <section
          className={`flex min-h-0 flex-1 flex-col gap-8 ${
            hasMessages ? "justify-start" : "justify-center"
          }`}
        >
          {!hasMessages && (
            <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8">
              <div className="w-full max-w-3xl text-center">
                <h1 className="flex items-center justify-center gap-4 text-3xl font-medium tracking-normal text-text-300 sm:text-5xl">
                  <span className="text-4xl leading-none text-accent sm:text-5xl" aria-hidden="true">
                    *
                  </span>
                  <span>{greeting}</span>
                </h1>
              </div>

              <div className="w-full">
                <ClaudeChatInput
                  onSendMessage={handleSendMessage}
                  disabled={isStreaming}
                  draftMessage={draftMessage}
                />
              </div>
            </div>
          )}

          {hasMessages && (
            <div className="relative mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-hidden">
              <div
                ref={messagesScrollRef}
                className="scrollbar-hide flex h-full w-full flex-col gap-5 overflow-y-auto px-6 pb-56 pt-8"
              >
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`group/message flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex flex-col ${
                        message.role === "user"
                          ? "max-w-[85%] items-end gap-2"
                          : "w-full items-start gap-2"
                      }`}
                    >
                      <div
                        className={`whitespace-pre-wrap text-sm leading-6 ${
                          message.role === "user"
                            ? "relative rounded-none bg-accent px-4 py-3 text-white before:pointer-events-none before:absolute before:inset-y-0 before:-left-3 before:w-3 before:bg-gradient-to-r before:from-transparent before:to-accent after:pointer-events-none after:absolute after:inset-y-0 after:-right-3 after:w-3 after:bg-gradient-to-r after:from-accent after:to-transparent"
                            : "min-h-6 w-full rounded-none bg-transparent p-0 text-text-100"
                        }`}
                      >
                        {message.content ||
                          (message.role === "assistant" ? (
                            <HoneycombLoader />
                          ) : (
                            ""
                          ))}
                      </div>

                      {message.role === "user" ? (
                        <div className="flex items-center gap-3 text-text-500 opacity-0 transition-opacity group-hover/message:opacity-100">
                          <time className="text-xs" dateTime={new Date(message.createdAt).toISOString()}>
                            {timeFormatter.format(message.createdAt)}
                          </time>
                          <button
                            type="button"
                            className="inline-flex h-4 w-4 items-center justify-center rounded text-text-500 transition-colors hover:text-text-100"
                            onClick={() => editMessage(message.content)}
                            aria-label="Edit message"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-4 w-4 items-center justify-center rounded text-text-500 transition-colors hover:text-text-100"
                            onClick={() => copyMessage(message)}
                            aria-label="Copy message"
                            title="Copy"
                          >
                            {copiedMessageId === message.id ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      ) : message.content ? (
                        <button
                          type="button"
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-lg transition-colors ${
                            copiedMessageId === message.id
                              ? "bg-bg-200 text-text-100"
                              : "text-text-500 hover:text-text-100"
                          }`}
                          onClick={() => copyMessage(message)}
                          aria-label="Copy response"
                          title="Copy"
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="mx-auto max-w-2xl text-center text-sm text-red-400">
              {error}
            </p>
          )}

        </section>
      </div>

      {hasMessages && (
        <div className="chat-input-dock fixed inset-x-0 bottom-0 z-20 bg-transparent shadow-none transition-[box-shadow] duration-500 ease-[var(--ease-silk)]">
          <div className="chat-input-inner mx-auto w-full max-w-5xl bg-transparent px-4 pb-4 pt-3 sm:px-6 lg:px-8">
            <ClaudeChatInput
              onSendMessage={handleSendMessage}
              disabled={isStreaming}
              draftMessage={draftMessage}
            />
          </div>
        </div>
      )}
    </main>
  );
}
