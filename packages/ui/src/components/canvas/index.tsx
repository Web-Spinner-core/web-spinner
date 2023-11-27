"use client";
import { Editor, Tldraw } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { useCallback, useState } from "react";
import initialState from "./initial-state.json";

interface CanvasProps {
  onPageChanged?: (newPageId: string, oldPageId: string) => void;
}

/**
 * Canvas wrapper for tldraw
 */
export default function Canvas({
  onPageChanged
}: CanvasProps) {
  const [editor, setEditor] = useState<Editor>();

  const onEditorMount = useCallback((editor: Editor) => {
    setEditor(editor);

    editor.on("change", (change) => {
      if (change.source !== "user") {
        return;
      }

      // Changed page
      for (const [from, to] of Object.values(change.changes.updated)) {
        if (from.typeName === "instance" && to.typeName === "instance" && from.currentPageId !== to.currentPageId) {
          if (onPageChanged) {
            onPageChanged(to.currentPageId, from.currentPageId);
          }
        }
      }
    });
  }, []);

  return (
    <Tldraw
      persistenceKey="web-spinner-canvas"
      onMount={onEditorMount}
      snapshot={initialState}
    />
  );
}
