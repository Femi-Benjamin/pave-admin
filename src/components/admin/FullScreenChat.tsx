import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  MoreHorizontal,
  Paperclip,
  Smile,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { Conversation } from "./AdminApp";

export interface ChatMessage {
  id: string;
  sender: "incoming" | "outgoing";
  text: string;
  time: string;
}

interface FullScreenChatProps {
  conversation: Conversation;
  onClose: () => void;
}

// Initial mock messages matching the user's screenshot for Emeka Adeyemi
const EMEKA_DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    sender: "incoming",
    text: "Hi! Your savings goal is coming along great 🎉",
    time: "10:22 AM",
  },
  {
    id: "2",
    sender: "outgoing",
    text: "Thank you! I'm trying to stay consistent",
    time: "10:24 AM",
  },
  {
    id: "3",
    sender: "incoming",
    text: "Your next weekly deposit is due on Saturday. Will you be ready?",
    time: "10:25 AM",
  },
  {
    id: "4",
    sender: "outgoing",
    text: "Yes, I've set a reminder already",
    time: "10:27 AM",
  },
  {
    id: "5",
    sender: "incoming",
    text: "Perfect! You're 42% of the way to your iPhone goal 📱",
    time: "10:28 AM",
  },
];

const GENERIC_CONVERSATIONS: Record<number, ChatMessage[]> = {
  2: [
    {
      id: "c1",
      sender: "incoming",
      text: "Thank you for approving my KYC!",
      time: "1:15 PM",
    },
    {
      id: "c2",
      sender: "outgoing",
      text: "You're welcome, Chinwe! Your Tier 2 account is now active and ready for all features.",
      time: "1:18 PM",
    },
  ],
  3: [
    {
      id: "f1",
      sender: "incoming",
      text: "Can I change my savings frequency?",
      time: "11:30 AM",
    },
    {
      id: "f2",
      sender: "outgoing",
      text: "Yes Fatima, you can change it directly in your savings settings or during the next cycle opening.",
      time: "11:35 AM",
    },
  ],
  4: [
    {
      id: "o1",
      sender: "incoming",
      text: "Got it, thanks!",
      time: "Yesterday",
    },
    {
      id: "o2",
      sender: "outgoing",
      text: "Always happy to help! Let us know if you need anything else.",
      time: "Yesterday",
    },
  ],
};

export const FullScreenChat: React.FC<FullScreenChatProps> = ({
  conversation,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (conversation.id === 1 || conversation.name.includes("Emeka")) {
      return EMEKA_DEFAULT_MESSAGES;
    }
    return (
      GENERIC_CONVERSATIONS[conversation.id] || [
        {
          id: "m_init",
          sender: "incoming",
          text: conversation.lastMsg || "Hello!",
          time: conversation.time || "Just now",
        },
      ]
    );
  });

  const [inputValue, setInputValue] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom("auto");
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages]);

  // Handle ESC key to exit full screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;

    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const newMsg: ChatMessage = {
      id: String(Date.now()),
      sender: "outgoing",
      text,
      time: formattedTime,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputValue("");
    setShowEmojiPicker(false);

    // Focus back on input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const fileMsg: ChatMessage = {
      id: String(Date.now()),
      sender: "outgoing",
      text: `📎 Attached: ${file.name}`,
      time: formattedTime,
    };

    setMessages((prev) => [...prev, fileMsg]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addEmoji = (emoji: string) => {
    setInputValue((prev) => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const initials = conversation.name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const commonEmojis = ["👍", "🎉", "📱", "💰", "🙏", "😊", "🚀", "🔥", "❤️", "🙌"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[100] flex flex-col bg-[#F8F9FE] dark:bg-[#0A0B18] text-[#0D0F1C] dark:text-[#F0F2FF] overflow-hidden select-text"
      style={{
        fontFamily: "var(--font-family-body, 'DM Sans', sans-serif)",
      }}
    >
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Top Header Bar */}
      <header className="w-full bg-white dark:bg-[#111327] border-b border-[#E5E7EB]/80 dark:border-white/10 px-4 sm:px-6 py-3 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.03)] z-10 flex-shrink-0">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Back button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 -ml-1 text-[#374151] dark:text-gray-300 hover:text-[#0D0F1C] dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            title="Back to messaging (Esc)"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>

          {/* User Avatar */}
          <div className="w-10 h-10 rounded-full bg-[#2A2167] dark:bg-[#3730A3] text-white font-bold flex items-center justify-center text-sm flex-shrink-0 shadow-xs tracking-tight">
            {initials}
          </div>

          {/* User Info */}
          <div className="flex flex-col">
            <h2
              className="text-[15px] sm:text-base font-bold text-[#0D0F1C] dark:text-[#F0F2FF] leading-tight"
              style={{
                fontFamily: "var(--font-family-display, 'Bricolage Grotesque', sans-serif)",
              }}
            >
              {conversation.name}
            </h2>
            <span className="text-xs font-semibold text-[#10B981] dark:text-[#34D399] leading-tight mt-0.5">
              Online
            </span>
          </div>
        </div>

        {/* Right menu action */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-[#6B7280] dark:text-[#94A3B8] hover:text-[#0D0F1C] dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            title="Options"
            aria-label="Options"
          >
            <MoreHorizontal size={20} />
          </button>

          {/* Options Dropdown Menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#161834] rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 py-1.5 z-20"
              >
                <button
                  type="button"
                  onClick={() => {
                    setMessages([]);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Clear conversation
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onClose();
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-medium text-[#6B7280] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2"
                >
                  <X size={14} />
                  Close chat
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Messages Canvas */}
      <main
        onClick={() => {
          if (showMenu) setShowMenu(false);
          if (showEmojiPicker) setShowEmojiPicker(false);
        }}
        className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-14 lg:px-20 py-6 space-y-5"
      >
        {messages.map((m) => {
          const isIncoming = m.sender === "incoming";

          return (
            <div
              key={m.id}
              className={`flex w-full ${isIncoming ? "justify-start" : "justify-end"}`}
            >
              {isIncoming ? (
                /* Incoming Message (White Bubble on Left) */
                <div className="flex flex-col items-start max-w-[85%] sm:max-w-[70%] md:max-w-[560px]">
                  <div className="bg-white dark:bg-[#161834] rounded-2xl rounded-tl-sm px-4 py-3 sm:px-5 sm:py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] border border-[#EBEFF8] dark:border-white/5 text-[#0D0F1C] dark:text-[#F0F2FF]">
                    <p className="text-sm sm:text-[15px] leading-relaxed break-words font-normal">
                      {m.text}
                    </p>
                    <div className="text-[11px] text-[#9CA3AF] dark:text-gray-400 mt-1 font-normal select-none">
                      {m.time}
                    </div>
                  </div>
                </div>
              ) : (
                /* Outgoing Message (Purple Bubble on Right) */
                <div className="flex flex-col items-end max-w-[85%] sm:max-w-[70%] md:max-w-[560px]">
                  <div className="bg-[#3730A3] dark:bg-[#3E34BF] text-white rounded-2xl rounded-tr-sm px-4 py-3 sm:px-5 sm:py-3.5 shadow-[0_2px_6px_rgba(55,48,163,0.18)]">
                    <p className="text-sm sm:text-[15px] leading-relaxed break-words font-normal text-white">
                      {m.text}
                    </p>
                    <div className="text-[11px] text-indigo-200/80 mt-1 font-normal select-none">
                      {m.time}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* Bottom Chat Bar */}
      <footer className="w-full bg-[#F8F9FE] dark:bg-[#0A0B18] px-4 sm:px-8 py-3.5 flex items-center border-t border-gray-200/60 dark:border-white/5 flex-shrink-0 relative">
        {/* Emoji picker popup */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-16 right-16 bg-white dark:bg-[#161834] border border-gray-200 dark:border-white/10 rounded-2xl p-3 shadow-xl z-20 flex gap-2"
            >
              {commonEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => addEmoji(emoji)}
                  className="hover:scale-125 transition-transform text-lg p-1"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attachment paperclip button on left */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 text-[#9CA3AF] hover:text-[#3730A3] dark:hover:text-white transition-colors rounded-full flex-shrink-0"
          title="Attach file"
          aria-label="Attach file"
        >
          <Paperclip size={21} className="rotate-45" />
        </button>

        {/* Input pill container */}
        <div className="flex-1 flex items-center bg-white dark:bg-[#161834] rounded-full border border-gray-200/80 dark:border-white/10 px-4 py-2.5 sm:py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] mx-2 sm:mx-3 transition-all focus-within:border-[#3730A3]/70 focus-within:ring-2 focus-within:ring-[#3730A3]/10">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-sm sm:text-[15px] text-[#0D0F1C] dark:text-[#F0F2FF] placeholder-[#9CA3AF] outline-none px-2"
          />
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1 text-[#9CA3AF] hover:text-amber-500 transition-colors rounded-full flex-shrink-0"
            title="Emoji"
            aria-label="Choose emoji"
          >
            <Smile size={20} />
          </button>
        </div>

        {/* Circular Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!inputValue.trim()}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#3730A3] hover:bg-[#312E81] text-white flex items-center justify-center flex-shrink-0 shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Send message"
          aria-label="Send message"
        >
          <Send size={17} className="-translate-x-0.5 translate-y-0.5" />
        </button>
      </footer>
    </motion.div>
  );
};
