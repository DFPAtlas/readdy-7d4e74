import { useState, useEffect, useRef } from 'react';
import supabase from '@/lib/supabase';

interface Message {
  id: string;
  assignment_id: string;
  sender_id: string;
  recipient_id: string | null;
  message: string;
  message_type: string;
  attachment_path: string | null;
  attachment_name: string | null;
  is_read: boolean;
  created_at: string;
}

interface MessagesTabProps {
  assignmentId: string;
  currentUserId: string;
  currentUserName: string;
}

export default function MessagesTab({ assignmentId, currentUserId, currentUserName }: MessagesTabProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error: fErr } = await supabase
        .from('assignment_messages')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('created_at', { ascending: true });
      if (fErr) throw fErr;
      setMessages(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`messages-${assignmentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'assignment_messages',
          filter: `assignment_id=eq.${assignmentId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [assignmentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim()) return;
    try {
      setSending(true);
      const { error: insErr } = await supabase.from('assignment_messages').insert({
        assignment_id: assignmentId,
        sender_id: currentUserId,
        message: newMsg.trim(),
        message_type: 'message',
      });
      if (insErr) throw insErr;
      setNewMsg('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    if (isToday) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-dfp-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-sm font-semibold text-dfp-stone-900">Messages</h2>
        <span className="text-[11px] text-dfp-stone-400">{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 mb-4">{error}</div>}

      <div className="bg-white rounded-xl border border-dfp-stone-200 overflow-hidden">
        {/* Messages area */}
        <div className="h-[420px] overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-dfp-stone-50 flex items-center justify-center mx-auto mb-3">
                  <i className="ri-chat-3-line text-xl text-dfp-stone-300"></i>
                </div>
                <p className="text-sm text-dfp-stone-400 mb-1">No messages yet</p>
                <p className="text-xs text-dfp-stone-300">Start the conversation below</p>
              </div>
            </div>
          ) : (
            messages.map(msg => {
              const isMine = msg.sender_id === currentUserId;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${isMine ? 'order-1' : ''}`}>
                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm ${
                      isMine
                        ? 'bg-dfp-green-600 text-white rounded-br-md'
                        : 'bg-dfp-stone-100 text-dfp-stone-700 rounded-bl-md'
                    }`}>
                      {msg.message_type === 'system' ? (
                        <span className="text-dfp-stone-400 italic text-xs">{msg.message}</span>
                      ) : (
                        <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                      )}
                    </div>
                    <p className={`text-[10px] text-dfp-stone-400 mt-1 ${isMine ? 'text-right' : 'text-left'}`}>
                      {isMine ? 'You' : 'PM'} · {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-dfp-stone-100 p-3 flex items-end gap-2">
          <textarea
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 text-sm rounded-xl border border-dfp-stone-200 bg-dfp-stone-50 focus:outline-none focus:border-dfp-green-400 resize-none min-h-[40px] max-h-[120px]"
          />
          <button
            onClick={handleSend}
            disabled={sending || !newMsg.trim()}
            className="w-10 h-10 rounded-xl bg-dfp-green-600 text-white flex items-center justify-center hover:bg-dfp-green-700 disabled:opacity-50 transition-colors cursor-pointer flex-shrink-0"
          >
            <i className={`text-lg ${sending ? 'ri-loader-4-line animate-spin' : 'ri-send-plane-fill'}`}></i>
          </button>
        </div>
      </div>
    </div>
  );
}