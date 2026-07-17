export const PHOTO_REACTIONS = [
  { type: 'like', label: 'Like', icon: 'i-fluent-emoji:thumbs-up' },
  { type: 'love', label: 'Love', icon: 'i-fluent-emoji:red-heart' },
  { type: 'laugh', label: 'Made me laugh', icon: 'i-fluent-emoji:face-with-tears-of-joy' },
  { type: 'smile', label: 'Made me smile', icon: 'i-fluent-emoji:smiling-face-with-smiling-eyes' },
  { type: 'adore', label: 'Adore', icon: 'i-fluent-emoji:smiling-face-with-heart-eyes' },
  { type: 'wow', label: 'Wow', icon: 'i-fluent-emoji:astonished-face' },
  { type: 'starstruck', label: 'Star-struck', icon: 'i-fluent-emoji:star-struck' },
  { type: 'thinking', label: 'Thought-provoking', icon: 'i-fluent-emoji:thinking-face' },
  { type: 'sad', label: 'Sad', icon: 'i-fluent-emoji:crying-face' },
  { type: 'moved', label: 'Moved me', icon: 'i-fluent-emoji:loudly-crying-face' },
  { type: 'party', label: 'Celebrate', icon: 'i-fluent-emoji:partying-face' },
  { type: 'fire', label: 'Fire', icon: 'i-fluent-emoji:fire' },
  { type: 'balloon', label: 'Fire', icon: 'i-fluent-emoji:balloon' },
  { type: 'dislike', label: 'Dislike', icon: 'i-fluent-emoji:thumbs-down' },
] as const

export type PhotoReactionType = (typeof PHOTO_REACTIONS)[number]['type']

export const PHOTO_REACTION_TYPES = PHOTO_REACTIONS.map((reaction) => reaction.type)

export function createEmptyPhotoReactionCounts(): Record<PhotoReactionType, number> {
  return {
    like: 0,
    love: 0,
    laugh: 0,
    smile: 0,
    adore: 0,
    wow: 0,
    starstruck: 0,
    thinking: 0,
    sad: 0,
    moved: 0,
    party: 0,
    fire: 0,
    dislike: 0,
    balloon: 0,
  }
}
