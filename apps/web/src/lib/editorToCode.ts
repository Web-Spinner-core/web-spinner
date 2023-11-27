import { Editor, getSvgAsImage } from "@tldraw/tldraw";
import fetchCanvasToPageResponse from "./fetchCanvasToPageResponse";

/**
 * Convert the editor selection to code
 */
export async function convertEditorToCode(editor: Editor): Promise<string> {
  const shapes = editor.getCurrentPageShapeIds();
  if (shapes.size === 0) {
    throw new Error("Page is empty. Draw something first");
  }

  const imageUrl = await getCurrentPageImageDataUrl(editor);
  const selectionText = getCurrentPageAsText(editor);

  return fetchCanvasToPageResponse(imageUrl, selectionText);
}

/**
 * Serialize the contents of the current selection
 */
function getCurrentPageAsText(editor: Editor) {
  const shapeIds = editor.getCurrentPageShapeIds();
  const shapeDescendantIds =
    editor.getShapeAndDescendantIds([...shapeIds]);

  const texts = Array.from(shapeDescendantIds)
    .map((id) => {
      const shape = editor.getShape(id);
      if (!shape) return null;
      if (
        shape.type === "text" ||
        shape.type === "geo" ||
        shape.type === "arrow" ||
        shape.type === "note"
      ) {
        // @ts-expect-error
        return shape.props.text;
      }
      return null;
    })
    .filter((v) => v !== null && v !== "");

  return texts.join("\n");
}

/**
 * Convert a binary blob to base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

/**
 * Get the current selection as a base64 encoded image data url
 */
export async function getCurrentPageImageDataUrl(editor: Editor) {
  const svg = await editor.getSvg([...editor.getCurrentPageShapeIds()]);
  if (!svg) throw new Error("Could not get SVG");

  const IS_SAFARI = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  const blob = await getSvgAsImage(svg, IS_SAFARI, {
    type: "png",
    quality: 1,
    scale: 1,
  });

  if (!blob) throw new Error("Could not get blob");
  return await blobToBase64(blob);
}