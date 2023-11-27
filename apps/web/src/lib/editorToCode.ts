import { Editor } from "@tldraw/tldraw";
import fetchCanvasToPageResponse from "./fetchCanvasToPageResponse";
import { getSelectionAsImageDataUrl } from "./selectionToUrl";

/**
 * Convert the editor selection to code
 */
export async function convertEditorToCode(editor: Editor): Promise<string> {
  const shapes = editor.getCurrentPageShapeIds();
  if (shapes.size === 0) {
    throw new Error("Page is empty. Draw something first");
  }

  const imageUrl = await getSelectionAsImageDataUrl(editor);
  const selectionText = getSelectionAsText(editor);

  return fetchCanvasToPageResponse(imageUrl, selectionText);
}

/**
 * Serialize the contents of the current selection
 */
function getSelectionAsText(editor: Editor) {
  const selectedShapeIds = editor.getSelectedShapeIds();
  const selectedShapeDescendantIds =
    editor.getShapeAndDescendantIds(selectedShapeIds);

  const texts = Array.from(selectedShapeDescendantIds)
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
