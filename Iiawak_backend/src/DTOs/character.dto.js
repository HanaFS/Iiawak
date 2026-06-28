'use strict';

/**
 * character.dto.js — DTOs cho Character endpoints.
 */
const CharacterDTO = {

  toCharacterResponse(char) {
    if (!char) return null;
    return {
      id:           char._id,
      name:         char.name,
      avatar:       char.avatar,
      gender:       char.gender,
      tags:         char.tags || [],
      slogan:       char.slogan,
      creatorId:    char.creatorId?._id || char.creatorId,
      creatorName:  char.creatorId?.displayName || 'Iiawak',
      publicInfo:   char.publicInfo,
      personality:  char.personality,
      openingLine:  char.openingLine,
      bio:          char.bio,
      firstMessage: char.firstMessage,
      status:       char.status,
      chatMode:     char.chatMode || 'both',
      totalChats:   char.totalChats || 0,
      totalLikes:   char.likedBy?.length || 0,
      ageRating:    char.ageRating || 'all',
      createdAt:    char.createdAt,
    };
  }
};

module.exports = CharacterDTO;
