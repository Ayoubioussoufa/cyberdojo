/**
 * The code editor in the Python challenges, built on CodeMirror 6: Python
 * colours that match the course's code blocks (src/lib/highlight.ts), line
 * numbers, the current line, matching brackets, auto-indent, Tab to indent and
 * Ctrl+Enter (Cmd+Enter) to run. Loaded on demand by src/components/CodeEditor.tsx,
 * so pages without a challenge never download it.
 *
 * Colours come from CSS variables (--hl-*) that globals.css sets per theme,
 * so the editor follows the light and dark themes like everything else.
 */
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
import { bracketMatching, HighlightStyle, indentOnInput, indentUnit, syntaxHighlighting } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { drawSelection, EditorView, highlightActiveLine, highlightActiveLineGutter, highlightSpecialChars, keymap, lineNumbers } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";

const colours = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.definitionKeyword, t.moduleKeyword], color: "var(--hl-keyword)" },
  { tag: [t.string, t.special(t.string), t.regexp], color: "var(--hl-string)" },
  { tag: t.comment, color: "var(--hl-comment)", fontStyle: "italic" },
  { tag: [t.number, t.bool, t.null, t.atom], color: "var(--hl-number)" },
  { tag: [t.function(t.variableName), t.function(t.definition(t.variableName)), t.function(t.propertyName), t.meta], color: "var(--hl-function)" },
  { tag: [t.className, t.definition(t.className), t.typeName], color: "var(--hl-type)" },
  { tag: [t.standard(t.variableName), t.self, t.special(t.variableName)], color: "var(--hl-builtin)" },
  { tag: [t.operator, t.compareOperator, t.arithmeticOperator, t.logicOperator, t.updateOperator], color: "var(--hl-operator)" },
]);

const look = EditorView.theme({
  "&": { color: "var(--ink)", backgroundColor: "var(--code-bg)", fontSize: "13.5px", border: "1px solid var(--rule)", borderRadius: "var(--radius)" },
  "&.cm-focused": { outline: "2px solid var(--accent)", outlineOffset: "1px" },
  ".cm-scroller": { fontFamily: "var(--mono)", lineHeight: "1.55", minHeight: "8.5em", maxHeight: "32em" },
  ".cm-content": { caretColor: "var(--accent)", padding: "8px 0" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--accent)", borderLeftWidth: "2px" },
  ".cm-gutters": { backgroundColor: "var(--sunk)", color: "var(--muted)", border: "none", borderRight: "1px solid var(--rule)" },
  ".cm-activeLine": { backgroundColor: "color-mix(in srgb, var(--accent) 7%, transparent)" },
  ".cm-activeLineGutter": { backgroundColor: "color-mix(in srgb, var(--accent) 14%, transparent)", color: "var(--ink)" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": { backgroundColor: "color-mix(in srgb, var(--info) 30%, transparent)" },
  ".cm-matchingBracket": { backgroundColor: "color-mix(in srgb, var(--ok) 25%, transparent)", outline: "1px solid var(--ok)" },
});

export interface EditorHandle {
  /** Replaces the whole text, as the Reset button does. */
  set(text: string): void;
  focus(): void;
  destroy(): void;
}

export function createEditor(parent: HTMLElement, doc: string, o: { label: string; onChange: (text: string) => void; onRun: () => void }): EditorHandle {
  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        highlightActiveLine(),
        EditorState.tabSize.of(4),
        indentUnit.of("    "),
        python(),
        syntaxHighlighting(colours),
        look,
        keymap.of([{ key: "Mod-Enter", run: () => (o.onRun(), true) }, ...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.contentAttributes.of({ "aria-label": o.label, spellcheck: "false", autocorrect: "off", autocapitalize: "off" }),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) o.onChange(u.state.doc.toString());
        }),
      ],
    }),
  });
  return {
    set(text) {
      if (text !== view.state.doc.toString()) view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } });
    },
    focus: () => view.focus(),
    destroy: () => view.destroy(),
  };
}
