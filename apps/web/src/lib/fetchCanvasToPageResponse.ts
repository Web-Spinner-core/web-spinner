"use server";

import { TLPageId } from "@tldraw/tldraw";
import axios from "axios";
import { z } from "zod";

/**
 * Fetch the canvas to page response from the backend
 */
export default async function fetchCanvasToPageResponse(
  imageUrl: string,
  pageText: string,
  pageId: TLPageId,
  pageName: string
): Promise<string> {
  const result = await axios.post("http://localhost:3001/canvas/page", {
    imageUrl,
    pageText,
    canvasPageId: pageId,
    pageName,
  });

  return z.string().parse(result.data);
}
