import React from 'react';
import PlanifyAPI from '../api.jsx';
import { IconChat, IconClose, IconSend, IconSpark, IconTrash } from './icons.jsx';

const STORAGE_KEY = 'planify:aiChat';
const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  text: 'Hi, I’m Planify AI. I can help you prioritize assignments, build a study plan, or make sense of a busy week.',
};
const SUGGESTIONS = [
  'Help me plan my study week',
  'What should I work on first?',
  'How can I avoid procrastinating?',
];

function loadMessages(storageKey) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || '[]');
    return Array.isArray(saved) && saved.length ? saved : [WELCOME_MESSAGE];
  } catch {
    return [WELCOME_MESSAGE];
  }
}

function AIChatPanel({ user }) {
  const storageKey = `${STORAGE_KEY}:${user?.id || user?.email || 'guest'}`;
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState(() => loadMessages(storageKey));
  const [draft, setDraft] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [error, setError] = React.useState('');
  const inputRef = React.useRef(null);
  const messagesRef = React.useRef(null);

  React.useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  React.useEffect(() => {
    if (!isOpen) return undefined;
    inputRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    const list = messagesRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, isSending, isOpen]);

  const clearChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setDraft('');
    setError('');
    inputRef.current?.focus();
  };

  const sendMessage = async (suggestedText, isRetry = false) => {
    const text = (suggestedText || draft).trim();
    if (!text || isSending) return;

    const userMessage = isRetry
      ? messages.at(-1)
      : { id: `user-${Date.now()}`, role: 'user', text };
    const previousMessages = isRetry ? messages.slice(0, -1) : messages;
    if (!isRetry) setMessages(current => [...current, userMessage]);
    setDraft('');
    setError('');
    setIsSending(true);

    try {
      const history = previousMessages
        .filter(message => message.id !== 'welcome')
        .map(message => ({ role: message.role === 'assistant' ? 'model' : 'user', parts: [{ text: message.text }] }));
      const answer = await PlanifyAPI.chat(text, history);
      setMessages(current => [...current, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: answer || 'I could not generate a response. Please try again.',
      }]);
    } catch (requestError) {
      setError(requestError.message || 'Planify AI is unavailable right now.');
    } finally {
      setIsSending(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  const onDraftKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <button
        type="button"
        className={'ai-chat-launcher' + (isOpen ? ' is-open' : '')}
        onClick={() => setIsOpen(open => !open)}
        aria-label={isOpen ? 'Close Planify AI chat' : 'Open Planify AI chat'}
        aria-expanded={isOpen}
        aria-controls="planify-ai-chat"
      >
        <span className="ai-chat-launcher-icon">
          {isOpen ? <IconClose size={20} /> : <IconSpark size={20} />}
        </span>
        <span className="ai-chat-launcher-copy">
          <strong>{isOpen ? 'Close chat' : 'Ask Planify'}</strong>
          {!isOpen && <small>AI study assistant</small>}
        </span>
      </button>

      {isOpen && <button className="ai-chat-backdrop" aria-label="Close chat" onClick={() => setIsOpen(false)} />}

      <aside
        id="planify-ai-chat"
        className={'ai-chat-panel' + (isOpen ? ' is-open' : '')}
        aria-hidden={!isOpen}
        aria-label="Planify AI assistant"
        inert={!isOpen ? '' : undefined}
      >
        <header className="ai-chat-head">
          <div className="ai-chat-brandmark"><IconSpark size={20} /></div>
          <div className="ai-chat-title">
            <div className="ai-chat-kicker"><span /> Online</div>
            <h2>Planify AI</h2>
          </div>
          <button type="button" className="ai-chat-head-btn" onClick={clearChat} aria-label="Clear conversation" title="Clear conversation">
            <IconTrash size={17} />
          </button>
          <button type="button" className="ai-chat-head-btn" onClick={() => setIsOpen(false)} aria-label="Close chat">
            <IconClose size={18} />
          </button>
        </header>

        <div className="ai-chat-context">
          <IconChat size={14} />
          <span>Study support for {user?.username || user?.name || 'your day'}</span>
          <span className="ai-chat-context-dot">·</span>
          <span>Powered by Gemini</span>
        </div>

        <div className="ai-chat-messages" ref={messagesRef} aria-live="polite">
          {messages.map(message => (
            <div key={message.id} className={'ai-chat-message ' + message.role}>
              {message.role === 'assistant' && <span className="ai-chat-avatar"><IconSpark size={13} /></span>}
              <div>
                <span className="ai-chat-author">{message.role === 'assistant' ? 'Planify AI' : 'You'}</span>
                <p>{message.text}</p>
              </div>
            </div>
          ))}

          {messages.length === 1 && (
            <div className="ai-chat-suggestions">
              <span>Try asking</span>
              {SUGGESTIONS.map(suggestion => (
                <button key={suggestion} type="button" onClick={() => sendMessage(suggestion)}>
                  {suggestion}<span>↗</span>
                </button>
              ))}
            </div>
          )}

          {isSending && (
            <div className="ai-chat-message assistant ai-chat-typing">
              <span className="ai-chat-avatar"><IconSpark size={13} /></span>
              <div><span className="ai-chat-author">Planify AI</span><p><i /><i /><i /></p></div>
            </div>
          )}
        </div>

        <form className="ai-chat-compose" onSubmit={onSubmit}>
          {error && <div className="ai-chat-error">{error} <button type="button" onClick={() => sendMessage(messages.at(-1)?.text, true)}>Retry</button></div>}
          <div className="ai-chat-input-wrap">
            <textarea
              ref={inputRef}
              rows="1"
              value={draft}
              onChange={event => setDraft(event.target.value)}
              onKeyDown={onDraftKeyDown}
              placeholder="Ask about your tasks or study plan…"
              aria-label="Message Planify AI"
              disabled={isSending}
            />
            <button type="submit" disabled={!draft.trim() || isSending} aria-label="Send message">
              <IconSend size={18} />
            </button>
          </div>
          <span className="ai-chat-disclaimer">AI can make mistakes. Check important details.</span>
        </form>
      </aside>
    </>
  );
}

export { AIChatPanel };
