import type { Binder, TabDivider, Page, MarginAnnotation } from "@the-desk/shared";

export interface PageWithAnnotations extends Page {
  annotations: MarginAnnotation[];
}

export interface BinderDetail extends Binder {
  tabDividers: TabDivider[];
  pages: PageWithAnnotations[];
}
