import { createChatModel } from "@lib/openai";
import { TraceGroup } from "langchain/callbacks";
import { HumanMessage, SystemMessage } from "langchain/schema";
import { htmlPrompt } from "./messages";

interface ConvertCanvasToPageParams {
  imageUrl: string;
  pageText: string;
  styleImageUrl?: string;
  styleCode?: string;
}

/**
 * Generate standalone HTML + Tailwind from a request and an image
 */
export default async function convertCanvasToPage({
  imageUrl,
  pageText,
  styleImageUrl,
  styleCode,
}: ConvertCanvasToPageParams) {
  // Observability group
  const traceGroup = new TraceGroup("convert_canvas_to_page");
  const callbacks = await traceGroup.start();

  const humanMessage =
    styleImageUrl == null || styleCode == null
      ? await generateStandaloneMessage(imageUrl, pageText)
      : await generateStyledMessage(
          imageUrl,
          pageText,
          styleImageUrl,
          styleCode
        );

  try {
    const model = await createChatModel({
      modelName: "gpt-4-vision-preview",
      maxTokens: 4096,
      temperature: 0.1,
      callbacks,
      cache: false,
    });
    const response = await model.call(
      [new SystemMessage(htmlPrompt), humanMessage],
      { callbacks }
    );
    if (Array.isArray(response.content)) {
      throw new Error(`Expected response content to be a string`);
    }
    const content = response.content;
    console.log(content);

    // const start = content.indexOf("```jsx") + "```jsx".length + 1;
    // const end = content.lastIndexOf("```");
    // const code = content.slice(start, end).trim();

    const start = content.indexOf("<!DOCTYPE html>");
    const end = content.lastIndexOf("</html>");
    const code = content.slice(start, end + "</html>".length).trim();
    return code;
  } finally {
    await traceGroup.end();
  }
}

/**
 * Create a message to generate a standalone page
 */
async function generateStandaloneMessage(
  imageUrl: string,
  pageText: string
): Promise<HumanMessage> {
  return new HumanMessage({
    content: [
      {
        type: "image_url",
        image_url: {
          url: imageUrl,
          detail: "high",
        },
      },
      {
        type: "text",
        text: "Here are the latest wireframes. Could you make a new website based on these wireframes and notes and send back just the code?",
      },
      // {
      //   type: "text",
      //   text: pageText,
      // },
    ],
  });
}

/**
 * Create a message to generate a page styled with a reference image
 */
async function generateStyledMessage(
  imageUrl: string,
  pageText: string,
  styleImageUrl: string,
  styleCode: string
): Promise<HumanMessage> {
  return new HumanMessage({
    content: [
      {
        type: "image_url",
        image_url: {
          url: imageUrl,
          detail: "high",
        },
      },
      {
        type: "text",
        text: "Here are the latest wireframes. Could you make a new website based on these wireframes and notes and send back just the code?",
      },
      {
        type: "image_url",
        image_url: {
          url: styleImageUrl,
          detail: "high",
        },
      },
      {
        type: "text",
        text: "Here is a picture of another page in the website. Make your new page look like this one. Think carefully about the styles, themes, and colors used in this page.",
      },
      {
        type: "text",
        text: `Also, here is the code used to generate the image shown in the screenshot:\n\n\`\`\`html\n${styleCode}\n\`\`\``,
      },
    ],
  });
}
