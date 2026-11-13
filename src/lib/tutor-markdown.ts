/**
 * The tutor's replies as HTML. A model's output is untrusted text: raw HTML in
 * it is shown as text, and a link survives only if it goes to a page of the
 * course or to an http(s) address.
 */
import { Marked } from "marked";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const marked = new Marked({ gfm: true, breaks: true });
marked.use({
  renderer: {
    html({ text }) {
      return esc(text);
    },
    link({ href, tokens }) {
      const inner = this.parser.parseInline(tokens);
      if (/^\/(?!\/)/.test(href)) return `<a href="${esc(href)}">${inner}</a>`;
      if (/^https?:\/\//i.test(href)) return `<a href="${esc(href)}" target="_blank" rel="noreferrer">${inner}</a>`;
      return inner;
    },
    image({ text }) {
      return esc(text);
    },
  },
});

export const tutorHtml = (markdown: string) => marked.parse(markdown, { async: false });
