'use strict';

/**
 * chat.dto.js — DTOs cho Chat (AI & Direct) endpoints.
 */
const ChatDTO = {

  toAiSessionResponse(session) {
    if (!session) return null;
    return {
      id:          session._id,
      userId:      session.userId,
      characterId: session.characterId ? {
        id:     session.characterId._id || session.characterId,
        name:   session.characterId.name,
        avatar: session.characterId.avatar,
      } : session.characterId,
      mode:        session.mode,
      isFrozen:    session.isFrozen || false,
      lastMessage: session.messages?.length > 0
        ? session.messages[session.messages.length - 1].content
        : '',
      updatedAt:   session.updatedAt,
    };
  },

  toAiHistoryResponse(session) {
    if (!session) return [];
    return session.messages.map(m => ({
      role:      m.role,
      content:   m.content,
      timestamp: m.timestamp,
    }));
  }
};

module.exports = ChatDTO;
