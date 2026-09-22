export interface SearchResult {
  kind: "note" | "task" | "flashcard" | "citation";
  id: string;
  title: string;
  snippet: string;
  pageId?: string;
}
