export interface CritiqueComment {
  id: string;
  threadId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface CritiqueThread {
  id: string;
  pageId: string;
  x: number;
  y: number;
  resolved: boolean;
  createdAt: string;
  comments: CritiqueComment[];
}
