"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Archive,
  ArrowUp,
  ChevronDown,
  FileText,
  Loader2,
  Plus,
  SlidersHorizontal,
  X,
} from "lucide-react";

export const Icons = {
  Plus,
  ArrowUp,
  X,
  FileText,
  Loader2,
  Archive,
  ChevronDown,
  SlidersHorizontal,
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

type UploadStatus = "pending" | "uploading" | "complete";

export interface AttachedFile {
  id: string;
  file: File;
  type: string;
  preview: string | null;
  uploadStatus: UploadStatus;
  content?: string;
}

interface PastedContent {
  id: string;
  content: string;
  timestamp: Date;
}

interface FilePreviewCardProps {
  file: AttachedFile;
  onRemove: (id: string) => void;
}

const FilePreviewCard: React.FC<FilePreviewCardProps> = ({ file, onRemove }) => {
  const isImage = file.type.startsWith("image/") && file.preview;

  return (
    <div className="relative group flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-bg-300 bg-bg-200 animate-fade-in transition-all hover:border-text-400">
      {isImage ? (
        <div className="w-full h-full relative">
          <img
            src={file.preview!}
            alt={file.file.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-accent/20 group-hover:bg-accent/0 transition-colors" />
        </div>
      ) : (
        <div className="w-full h-full p-3 flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-bg-300 rounded">
              <Icons.FileText className="w-4 h-4 text-text-300" />
            </div>
            <span className="text-[10px] font-medium text-text-400 uppercase tracking-wider truncate">
              {file.file.name.split(".").pop()}
            </span>
          </div>
          <div className="space-y-0.5">
            <p
              className="text-xs font-medium text-text-200 truncate"
              title={file.file.name}
            >
              {file.file.name}
            </p>
            <p className="text-[10px] text-text-500">
              {formatFileSize(file.file.size)}
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => onRemove(file.id)}
        className="absolute top-1 right-1 p-1 bg-accent/80 hover:bg-accent rounded-full text-bg-0 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={`Remove ${file.file.name}`}
      >
        <Icons.X className="w-3 h-3" />
      </button>

      {file.uploadStatus === "uploading" && (
        <div className="absolute inset-0 bg-accent/70 flex items-center justify-center">
          <Icons.Loader2 className="w-5 h-5 text-white animate-spin" />
        </div>
      )}
    </div>
  );
};

interface PastedContentCardProps {
  content: PastedContent;
  onRemove: (id: string) => void;
}

const PastedContentCard: React.FC<PastedContentCardProps> = ({
  content,
  onRemove,
}) => (
  <div className="relative group flex-shrink-0 w-28 h-28 rounded-2xl overflow-hidden border border-bg-300 bg-bg-200 animate-fade-in p-3 flex flex-col justify-between shadow-[0_1px_2px_color-mix(in_srgb,var(--main-color)_18%,transparent)]">
    <div className="overflow-hidden w-full">
      <p className="text-[10px] text-text-300 leading-[1.4] font-mono break-words whitespace-pre-wrap line-clamp-4 select-none">
        {content.content}
      </p>
    </div>

    <div className="flex items-center justify-between w-full mt-2">
      <div className="inline-flex items-center justify-center px-1.5 py-[2px] rounded border border-bg-300 bg-bg-0">
        <span className="text-[9px] font-bold text-text-200 uppercase tracking-wider font-sans">
          Pasted
        </span>
      </div>
    </div>

    <button
      type="button"
      onClick={() => onRemove(content.id)}
      className="absolute top-2 right-2 p-[3px] bg-bg-0 border border-bg-300 rounded-full text-text-300 hover:text-text-100 transition-colors shadow-sm opacity-0 group-hover:opacity-100"
      aria-label="Remove pasted content"
    >
      <Icons.X className="w-2 h-2" />
    </button>
  </div>
);

interface ClaudeChatInputProps {
  onSendMessage: (data: {
    message: string;
    files: AttachedFile[];
    pastedContent: PastedContent[];
  }) => void;
  disabled?: boolean;
  draftMessage?: {
    id: string;
    text: string;
  } | null;
}

export const ClaudeChatInput: React.FC<ClaudeChatInputProps> = ({
  onSendMessage,
  disabled = false,
  draftMessage = null,
}) => {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [pastedContent, setPastedContent] = useState<PastedContent[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        384,
      )}px`;
    }
  }, [message]);

  useEffect(() => {
    if (!draftMessage) return;

    setMessage(draftMessage.text);
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus();

      if (textareaRef.current) {
        textareaRef.current.selectionStart = draftMessage.text.length;
        textareaRef.current.selectionEnd = draftMessage.text.length;
      }
    });
  }, [draftMessage]);

  const handleFiles = useCallback((newFilesList: FileList | File[]) => {
    const newFiles: AttachedFile[] = Array.from(newFilesList).map((file) => {
      const isImage =
        file.type.startsWith("image/") ||
        /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);

      return {
        id: Math.random().toString(36).slice(2, 11),
        file,
        type: isImage ? "image/unknown" : file.type || "application/octet-stream",
        preview: isImage ? URL.createObjectURL(file) : null,
        uploadStatus: "pending",
      };
    });

    setFiles((previousFiles) => [...previousFiles, ...newFiles]);

    setMessage((previousMessage) => {
      if (previousMessage) return previousMessage;
      if (newFiles.length === 1) {
        return newFiles[0].type.startsWith("image/")
          ? "Analyzed image..."
          : "Analyzed document...";
      }
      return `Analyzed ${newFiles.length} files...`;
    });

    newFiles.forEach((file) => {
      window.setTimeout(() => {
        setFiles((previousFiles) =>
          previousFiles.map((previousFile) =>
            previousFile.id === file.id
              ? { ...previousFile, uploadStatus: "complete" }
              : previousFile,
          ),
        );
      }, 800 + Math.random() * 1000);
    });
  }, []);

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files) handleFiles(event.dataTransfer.files);
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    const items = event.clipboardData.items;
    const pastedFiles: File[] = [];

    for (let i = 0; i < items.length; i += 1) {
      if (items[i].kind === "file") {
        const file = items[i].getAsFile();
        if (file) pastedFiles.push(file);
      }
    }

    if (pastedFiles.length > 0) {
      event.preventDefault();
      handleFiles(pastedFiles);
      return;
    }

    const text = event.clipboardData.getData("text");
    if (text.length > 300) {
      event.preventDefault();
      setPastedContent((previousContent) => [
        ...previousContent,
        {
          id: Math.random().toString(36).slice(2, 11),
          content: text,
          timestamp: new Date(),
        },
      ]);

      if (!message) setMessage("Analyzed pasted text...");
    }
  };

  const handleSend = () => {
    if (
      disabled ||
      (!message.trim() && files.length === 0 && pastedContent.length === 0)
    ) {
      return;
    }

    onSendMessage({
      message,
      files,
      pastedContent,
    });
    setMessage("");
    setFiles([]);
    setPastedContent([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const hasContent =
    message.trim() || files.length > 0 || pastedContent.length > 0;

  return (
    <div
      className="relative w-full max-w-[48rem] mx-auto transition-all duration-300 font-sans"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="!box-content flex min-h-[7.25rem] flex-col mx-2 md:mx-0 items-stretch transition-all duration-200 relative z-10 rounded-2xl cursor-text border border-bg-300 bg-bg-200 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--text-100)_4%,transparent)] hover:border-text-500 focus-within:border-text-400 font-sans antialiased">
        <div className="flex min-h-[7.25rem] flex-col px-5 py-4 gap-1">
          {(files.length > 0 || pastedContent.length > 0) && (
            <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 px-1">
              {pastedContent.map((content) => (
                <PastedContentCard
                  key={content.id}
                  content={content}
                  onRemove={(id) =>
                    setPastedContent((previousContent) =>
                      previousContent.filter((item) => item.id !== id),
                    )
                  }
                />
              ))}
              {files.map((file) => (
                <FilePreviewCard
                  key={file.id}
                  file={file}
                  onRemove={(id) =>
                    setFiles((previousFiles) =>
                      previousFiles.filter((item) => item.id !== id),
                    )
                  }
                />
              ))}
            </div>
          )}

          <div className="relative">
            <div className="w-full overflow-hidden font-sans break-words transition-opacity duration-200 min-h-11">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                placeholder="How can I help you today?"
                disabled={disabled}
                className="w-full bg-transparent border-0 outline-none text-text-100 text-[1.05rem] placeholder:text-text-500 resize-none overflow-hidden py-0 leading-relaxed block font-normal antialiased"
                rows={1}
                autoFocus
                style={{ minHeight: "1.35em" }}
              />
            </div>
          </div>

          <div className="mt-auto flex gap-2 w-full items-end">
            <div className="relative flex-1 flex items-center shrink min-w-0 gap-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="inline-flex items-center justify-center relative shrink-0 transition-colors duration-200 h-9 w-9 rounded-lg active:scale-95 text-text-400 hover:text-text-100 hover:bg-bg-300"
                type="button"
                aria-label="Attach file"
              >
                <Icons.Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-row items-center min-w-0 gap-3 text-text-400">
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-base font-medium transition-colors hover:bg-bg-300 hover:text-text-100"
                aria-label="Current agent"
              >
                <span>Admin</span>
                <Icons.ChevronDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-bg-300 hover:text-text-100"
                aria-label="Input settings"
              >
                <Icons.SlidersHorizontal className="h-5 w-5" />
              </button>
              <button
                onClick={handleSend}
                disabled={!hasContent || disabled}
                className={`inline-flex items-center justify-center relative shrink-0 transition-colors h-9 w-9 rounded-xl active:scale-95 ${
                  hasContent && !disabled
                    ? "bg-accent text-bg-0 hover:bg-accent-hover shadow-md"
                    : "hidden"
                }`}
                type="button"
                aria-label="Send message"
              >
                <Icons.ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isDragging && (
        <div className="absolute inset-0 bg-bg-200/90 border-2 border-dashed border-accent rounded-2xl z-50 flex flex-col items-center justify-center backdrop-blur-sm pointer-events-none">
          <Icons.Archive className="w-10 h-10 text-accent mb-2 animate-bounce" />
          <p className="text-accent font-medium">Drop files to upload</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          if (event.target.files) handleFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <div className="hidden text-center mt-4">
        <p className="text-xs text-text-500">
          AI can make mistakes. Check important information.
        </p>
      </div>
    </div>
  );
};

export default ClaudeChatInput;
