import type { Block } from "@the-desk/shared";

export interface PageRevision {
  id: string;
  pageId: string;
  content: Block[];
  createdAt: string;
}
