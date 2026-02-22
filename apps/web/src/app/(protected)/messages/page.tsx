'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/useAuth';
import { useLang } from '@/lib/i18n';
import {
    MessageCircle, ArrowLeft, Send, Loader2, Briefcase,
} from 'lucide-react';

type Conversation = {
    jobId: string;
    jobTitle: string;
    jobStatus: string;
    otherPartyName: string;
    lastMessage: { text: string; createdAt: string; senderId: string } | null;
    totalMessages: number;
};

type Message = {
    id: string;
    jobId: string;
    senderId: string;
    text: string;
    createdAt: string;
    sender: { fullName: string };
};

function markChatRead(jobId: string) {
    try { localStorage.setItem(`chat_read_${jobId}`, Date.now().toString()); } catch { }
}

export function isChatRead(jobId: string, lastMessageAt: string | undefined): boolean {
    if (!lastMessageAt) return true;
    try {
        const readAt = localStorage.getItem(`chat_read_${jobId}`);
        if (!readAt) return false;
        return parseInt(readAt, 10) >= new Date(lastMessageAt).getTime() - 2000;
    } catch { return false; }
}

function MessagesContent() {
    const { t, lang } = useLang();
    const { userId } = useAuth();
    const searchParams = useSearchParams();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeJobId, setActiveJobId] = useState<string | null>(null);
    const autoOpenRef = useRef(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const fetchConversations = useCallback(async () => {
        try {
            setConversations(await api.messages.getConversations());
        } catch { }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        if (!userId) return;
        fetchConversations().then(() => {
            const jobParam = searchParams.get('job');
            if (jobParam && !autoOpenRef.current) {
                autoOpenRef.current = true;
                openChat(jobParam);
            }
        });
    }, [fetchConversations, searchParams, userId]);

    const fetchMessages = useCallback(async (jobId: string) => {
        try {
            const serverMsgs = await api.messages.getForJob(jobId);
            setMessages((prev) => {
                const optimistic = prev.filter((m) => m.id.startsWith('opt-'));
                if (optimistic.length === 0) return serverMsgs;
                const serverIds = new Set(serverMsgs.map((m: Message) => m.text));
                const stillPending = optimistic.filter((m) => !serverIds.has(m.text));
                return [...serverMsgs, ...stillPending];
            });
            markChatRead(jobId);
        } catch { }
        finally { setMessagesLoading(false); }
    }, []);

    function openChat(jobId: string) {
        setActiveJobId(jobId);
        setMessages([]);
        setMessagesLoading(true);
        markChatRead(jobId);
        void fetchMessages(jobId);

        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(() => void fetchMessages(jobId), 4000);
    }

    function closeChat() {
        if (activeJobId) markChatRead(activeJobId);
        setActiveJobId(null);
        if (pollRef.current) clearInterval(pollRef.current);
        void fetchConversations();
    }

    useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!activeJobId || !newMessage.trim() || sending) return;
        const text = newMessage.trim();
        const optimisticId = `opt-${Date.now()}`;
        const optimisticMsg: Message = {
            id: optimisticId,
            jobId: activeJobId,
            senderId: userId || '',
            text,
            createdAt: new Date().toISOString(),
            sender: { fullName: '' },
        };
        setMessages((prev) => [...prev, optimisticMsg]);
        setNewMessage('');
        inputRef.current?.focus();
        setSending(true);
        try {
            const msg = await api.messages.send(activeJobId, text);
            setMessages((prev) => prev.map((m) => m.id === optimisticId ? msg : m));
            markChatRead(activeJobId);
        } catch {
            setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        } finally { setSending(false); }
    }

    function formatTime(dateString: string) {
        return new Date(dateString).toLocaleTimeString(lang === 'ru' ? 'ru-RU' : 'en-US', {
            hour: '2-digit', minute: '2-digit',
        });
    }

    function formatDate(dateString: string) {
        const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000);
        if (diff === 0) return lang === 'ru' ? 'Сегодня' : 'Today';
        if (diff === 1) return lang === 'ru' ? 'Вчера' : 'Yesterday';
        return new Date(dateString).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' });
    }

    const activeConv = conversations.find((c) => c.jobId === activeJobId);

    if (activeJobId) {
        return (
            <div className="fixed inset-0 top-12 md:top-14 z-[60] bg-[#09090b] text-white flex flex-col">
                <div className="bg-surface border-b border-white/[0.04] px-4 py-2.5 flex items-center gap-3 shrink-0">
                    <button onClick={closeChat} className="p-1.5 -ml-1 text-zinc-500 active:text-white">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm truncate">{activeConv?.otherPartyName || (lang === 'ru' ? 'Чат' : 'Chat')}</div>
                        <div className="text-[10px] text-zinc-600 truncate">{activeConv?.jobTitle}</div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                    {messagesLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="animate-spin text-gold" size={24} />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-16 text-zinc-600 text-sm">
                            {lang === 'ru' ? 'Начните диалог — напишите первое сообщение' : 'Start the conversation'}
                        </div>
                    ) : (
                        messages.map((msg, i) => {
                            const isMine = userId != null && msg.senderId === userId;
                            const isOptimistic = msg.id.startsWith('opt-');
                            const showDate = i === 0 || formatDate(messages[i - 1].createdAt) !== formatDate(msg.createdAt);
                            return (
                                <div key={msg.id}>
                                    {showDate && (
                                        <div className="text-center my-3">
                                            <span className="text-[10px] text-zinc-700 bg-white/[0.03] px-2.5 py-0.5 rounded-full">
                                                {formatDate(msg.createdAt)}
                                            </span>
                                        </div>
                                    )}
                                    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] px-3.5 py-2 ${
                                            isMine
                                                ? 'bg-gold/15 rounded-2xl rounded-br-sm'
                                                : 'bg-white/[0.05] border border-white/[0.06] rounded-2xl rounded-bl-sm'
                                        } ${isOptimistic ? 'opacity-60' : ''}`}>
                                            {!isMine && (
                                                <div className="text-[10px] text-gold font-semibold mb-0.5">
                                                    {msg.sender.fullName}
                                                </div>
                                            )}
                                            <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                                            <div className={`text-[9px] mt-0.5 ${isMine ? 'text-gold/40 text-right' : 'text-zinc-700'}`}>
                                                {isOptimistic ? '...' : formatTime(msg.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} className="bg-surface border-t border-white/[0.04] px-3 py-2.5 flex gap-2 safe-area-bottom shrink-0">
                    <input
                        ref={inputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={t('msgs.typeMessage')}
                        className="flex-1 px-4 py-3 rounded-full bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-gold/20"
                    />
                    <button type="submit" disabled={!newMessage.trim() || sending}
                        className="w-11 h-11 bg-gold rounded-full text-black disabled:opacity-20 active:scale-90 transition-transform shrink-0 flex items-center justify-center">
                        {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090b] text-white px-4 py-5 md:px-12 md:py-10">
            <div className="max-w-3xl mx-auto space-y-4">
                <h1 className="font-display text-xl font-bold flex items-center gap-2">
                    <MessageCircle size={20} className="text-gold" />
                    {t('msgs.title')}
                </h1>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="animate-spin text-gold" size={24} />
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="bg-surface border border-white/[0.04] rounded-xl p-8 text-center">
                        <MessageCircle size={28} className="text-zinc-700 mx-auto mb-2" />
                        <p className="text-zinc-500 text-sm">{t('msgs.noChats')}</p>
                        <p className="text-zinc-700 text-xs mt-1">{t('msgs.noChatsDesc')}</p>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {conversations.map((conv) => {
                            const fromOther = conv.lastMessage && conv.lastMessage.senderId !== userId;
                            const hasUnread = fromOther && !isChatRead(conv.jobId, conv.lastMessage?.createdAt);
                            return (
                                <button key={conv.jobId} onClick={() => openChat(conv.jobId)}
                                    className="w-full text-left bg-surface border border-white/[0.04] rounded-xl p-4 active:scale-[0.98] transition-all relative">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-semibold text-sm truncate">{conv.otherPartyName}</span>
                                        <div className="flex items-center gap-2 shrink-0 ml-2">
                                            {hasUnread && (
                                                <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse" />
                                            )}
                                            {conv.lastMessage && (
                                                <span className="text-[10px] text-zinc-600">
                                                    {formatDate(conv.lastMessage.createdAt)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-600 mb-1">
                                        <Briefcase size={10} />
                                        <span className="truncate">{conv.jobTitle}</span>
                                    </div>
                                    {conv.lastMessage && (
                                        <p className={`text-xs truncate ${hasUnread ? 'text-white font-medium' : 'text-zinc-500'}`}>
                                            {conv.lastMessage.text}
                                        </p>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#09090b] flex items-center justify-center"><Loader2 className="animate-spin text-gold" size={24} /></div>}>
            <MessagesContent />
        </Suspense>
    );
}
