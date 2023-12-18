"use client";
import { Editor, TLPageId, Tldraw } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { Dispatch, SetStateAction, useCallback } from "react";
import initialState from "./initial-state.json";

interface CanvasProps {
  onPageChanged?: (newPageId: TLPageId, oldPageId: TLPageId) => void;
  setEditor?: Dispatch<SetStateAction<Editor>>;
  projectId: string;
}

/**
 * Canvas wrapper for tldraw
 */
export default function Canvas({
  onPageChanged,
  setEditor,
  projectId,
}: CanvasProps) {
  const onEditorMount = useCallback((editor: Editor) => {
    editor.on("change", (change) => {
      if (change.source !== "user") {
        return;
      }

      // Changed page
      for (const [from, to] of Object.values(change.changes.updated)) {
        if (
          from.typeName === "instance" &&
          to.typeName === "instance" &&
          from.currentPageId !== to.currentPageId
        ) {
          if (onPageChanged) {
            onPageChanged(to.currentPageId, from.currentPageId);
          }
        }
      }
    });

    if (setEditor) {
      setEditor(editor);
    }
  }, []);

  return (
    <Tldraw
      persistenceKey={`web-spinner-${projectId}`}
      onMount={onEditorMount}
      snapshot={initialState}
      className="z-0"
    />
  );
}
