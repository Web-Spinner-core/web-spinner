"use client";
import {
  Editor,
  Tldraw
} from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";

function onEditorMount(editor: Editor) {
  // Clear all pages
  const pages = editor.pages;
  const hasHomePage = pages.find(page => page.name === "Home");
  const hasSignUpPage = pages.find(page => page.name === "Sign Up");

  if (!hasHomePage) {
    editor.createPage({
      name: "Home"
    });
  }
  if (!hasSignUpPage) {
    editor.createPage({
      name: "Sign Up"
    });
  }
}

/**
 * Canvas wrapper for tldraw
 */
export default function Canvas() {
  return <Tldraw persistenceKey="doodle-canvas" onMount={onEditorMount} />;
}
