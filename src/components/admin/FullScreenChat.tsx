import { X } from "lucide-react";

interface FullScreenChatProps {
  conversation: { name: string };
  onClose: () => void;
}

export function FullScreenChat({ conversation, onClose }: FullScreenChatProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <section className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#111327]">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-semibold text-[#0D0F1C] dark:text-[#F0F2FF]">
            Conversation with {conversation.name}
          </h2>
          <button onClick={onClose} aria-label="Close conversation">
            <X size={20} />
          </button>
        </div>
        <p className="py-12 text-center text-sm text-[#9CA3AF]">
          Conversation history and sending messages are unavailable because the
          documented API collection has no messaging endpoints.
        </p>
      </section>
    </div>
  );
}
