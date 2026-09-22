import type { CitationStyle } from "@the-desk/shared";

export interface CitationFields {
  style: CitationStyle;
  sourceType: string;
  title: string;
  authors: string[];
  year: number | null;
  publisher: string | null;
  url: string | null;
  doi: string | null;
}

// Organizational/corporate authors (standards bodies, wire services, government
// agencies) must never be split and inverted like a personal name — "American
// Society of Civil Engineers" is not "Last=Engineers, First=American Society of
// Civil". No style guide's real algorithm is needed here, just a keyword check
// real citation tools (Zotero, EndNote) use the same kind of heuristic for.
const ORG_KEYWORDS =
  /\b(Association|Society|Institute|University|Press|Committee|Corporation|Department|Agency|Bureau|Organization|Foundation|Council|Company|Inc\.?|LLC)\b/i;
function isOrganization(author: string) {
  return ORG_KEYWORDS.test(author);
}

function authorsAma(authors: string[]) {
  // AMA: Last FM, initials no periods/spaces, "et al" past 6 authors.
  const formatted = authors.slice(0, 6).map((a) => {
    if (isOrganization(a)) return a;
    const parts = a.trim().split(/\s+/);
    const last = parts.pop() ?? a;
    const initials = parts.map((p) => p[0]).join("");
    return initials ? `${last} ${initials}` : last;
  });
  return authors.length > 6 ? `${formatted.join(", ")}, et al` : formatted.join(", ");
}

function authorsIeee(authors: string[]) {
  // IEEE: F. Last, F. Last, and F. Last.
  const formatted = authors.map((a) => {
    if (isOrganization(a)) return a;
    const parts = a.trim().split(/\s+/);
    const last = parts.pop() ?? a;
    const initials = parts.map((p) => `${p[0]}.`).join(" ");
    return initials ? `${initials} ${last}` : last;
  });
  if (formatted.length <= 1) return formatted.join("");
  return `${formatted.slice(0, -1).join(", ")}, and ${formatted[formatted.length - 1]}`;
}

function authorsMlaChicago(authors: string[]) {
  // First author "Last, First"; subsequent authors "First Last" (MLA/Chicago share this shape closely enough for our scope).
  if (authors.length === 0) return "";
  const [first, ...rest] = authors;
  const firstFormatted = isOrganization(first!)
    ? first
    : (() => {
        const firstParts = first!.trim().split(/\s+/);
        const firstLast = firstParts.pop();
        return firstParts.length ? `${firstLast}, ${firstParts.join(" ")}` : firstLast;
      })();
  if (rest.length === 0) return firstFormatted ?? "";
  return `${firstFormatted}, and ${rest.join(", ")}`;
}

export function formatCitation(c: CitationFields): string {
  const year = c.year ?? "n.d.";
  switch (c.style) {
    case "ama": {
      // AMA 11th ed., journal-article-shaped: Authors. Title. Publisher. Year.
      const parts = [authorsAma(c.authors), `${c.title}.`, c.publisher ? `${c.publisher}.` : null, `${year}.`];
      if (c.doi) parts.push(`doi:${c.doi}`);
      else if (c.url) parts.push(c.url);
      return parts.filter(Boolean).join(" ");
    }
    case "ieee": {
      // IEEE: [n] not included (list position, not the formatter's job). F. Last, "Title," Publisher, Year.
      const parts = [`${authorsIeee(c.authors)},`, `"${c.title},"`, c.publisher ? `${c.publisher},` : null, `${year}.`];
      if (c.doi) parts.push(`doi: ${c.doi}.`);
      else if (c.url) parts.push(`[Online]. Available: ${c.url}`);
      return parts.filter(Boolean).join(" ");
    }
    case "mla": {
      // MLA 9th ed.: Author. "Title." Publisher, Year, URL.
      const parts = [
        `${authorsMlaChicago(c.authors)}.`,
        c.sourceType === "book" ? `${c.title}.` : `"${c.title}."`,
        c.publisher ? `${c.publisher},` : null,
        `${year}${c.url ? "," : "."}`,
      ];
      if (c.url) parts.push(c.url + ".");
      return parts.filter(Boolean).join(" ");
    }
    case "chicago": {
      // Chicago (notes-bibliography, simplified): Author. "Title." Publisher, Year. URL.
      const parts = [
        `${authorsMlaChicago(c.authors)}.`,
        c.sourceType === "book" ? `${c.title}.` : `"${c.title}."`,
        c.publisher ? `${c.publisher},` : null,
        `${year}.`,
      ];
      if (c.url) parts.push(c.url + ".");
      return parts.filter(Boolean).join(" ");
    }
  }
}
