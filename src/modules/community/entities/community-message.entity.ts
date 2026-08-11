export const MESSAGE_CATEGORIES = [
  'water',
  'food',
  'shelter',
  'medical',
  'volunteers',
  'transport',
  'info',
] as const;

export type MessageCategory = (typeof MESSAGE_CATEGORIES)[number];

export interface CommunityMessageRow {
  id: string;
  city: string;
  author_name: string | null;
  category: MessageCategory;
  content: string;
  contact: string | null;
  user_id: string | null;
  is_hidden: boolean;
  created_at: Date;
}

export interface CommunityMessage {
  id: string;
  city: string;
  authorName: string | null;
  category: MessageCategory;
  content: string;
  contact: string | null;
  isMine: boolean;
  createdAt: string;
}

export function toCommunityMessage(
  row: CommunityMessageRow,
  currentUserId?: string,
): CommunityMessage {
  return {
    id: row.id,
    city: row.city,
    authorName: row.author_name,
    category: row.category,
    content: row.content,
    contact: row.contact,
    isMine: Boolean(currentUserId && row.user_id === currentUserId),
    createdAt: row.created_at.toISOString(),
  };
}
