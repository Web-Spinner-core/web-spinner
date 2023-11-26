"use client";
import { Editor, Tldraw } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { useState } from "react";
import initialState from "./initial-state.json";

/**
 * Canvas wrapper for tldraw
 */
export default function Canvas() {
  const [editor, setEditor] = useState<Editor>();

  const onEditorMount = (editor: Editor) => {
    setEditor(editor);
  };

  return (
    <Tldraw
      persistenceKey="doodle-canvas"
      onMount={onEditorMount}
      snapshot={initialState}
    />
  );
}
