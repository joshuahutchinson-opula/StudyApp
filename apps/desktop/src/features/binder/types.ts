import type { Binder, TabDivider, Page } from "@the-desk/shared";

export interface BinderDetail extends Binder {
  tabDividers: TabDivider[];
  pages: Page[];
}
