"use server";

import axios from "axios";
import { z } from "zod";


/**
 * Fetch the canvas to page response from the backend
 */
export default async function fetchCanvasToPageResponse(imageUrl: string, pageText: string): Promise<string> {

  const result = await axios.post("http://localhost:3001/canvas/page", {
    imageUrl,
    pageText,
  });

  return z.string().parse(result.data)
}