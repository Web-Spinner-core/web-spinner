import { TraceGroup } from "langchain/callbacks";
import { HumanMessage, SystemMessage } from "langchain/schema";
import { createChatModel } from "@lib/openai";

interface ConvertCanvasToPageParams {
  imageUrl: string;
  pageText: string;
  styleImageUrl?: string;
}

const systemPrompt = `You are an expert web developer who specializes in building working website prototypes from low-fidelity wireframes.
Your job is to accept low-fidelity wireframes, then create a working prototype using HTML, CSS, and JavaScript, and finally send back the results.
The results should be a single HTML file.
Use tailwind to style the website.
Put any additional CSS styles in a style tag and any JavaScript in a script tag.
Use unpkg or skypack to import any required dependencies.
Use Google fonts to pull in any open source fonts you require.
If you have any images, load them from Unsplash or use solid colored rectangles.

The wireframes may include flow charts, diagrams, labels, arrows, sticky notes, and other features that should inform your work.
If there are screenshots or images, use them to inform the colors, fonts, and layout of your website.
Use your best judgement to determine whether what you see should be part of the user interface, or else is just an annotation.

Use what you know about applications and user experience to fill in any implicit business logic in the wireframes. Flesh it out, make it real!
In your code, make sure to add descriptive comments to explain your thought process and any assumptions you made.

The user may also provide you with designs from other pages in their website.
Use the designs from these other pages to help drive your work so that the page you create is consistent with the rest of the website.
Make sure your theme is consistent with the other pages in the website.

Sometimes it's hard for you to read the writing in the wireframes.
For this reason, all text from the wireframes will be provided to you as a list of strings, separated by newlines.
Use the provided list of text from the wireframes as a reference if any text is hard to read.

You love your designers and want them to be happy. Incorporating their feedback and notes and producing working websites makes them happy.

Respond ONLY with the contents of the html file.`;

/**
 * Generate standalone HTML + Tailwind from a request and an image
 */
export default async function convertCanvasToPage({
  imageUrl,
  pageText,
  styleImageUrl,
}: ConvertCanvasToPageParams) {
  // Observability group
  const traceGroup = new TraceGroup("convert_canvas_to_page");
  const callbacks = await traceGroup.start();

  const humanMessage =
    styleImageUrl == null
      ? await generateStandaloneMessage(imageUrl, pageText)
      : await generateStyledMessage(imageUrl, pageText, styleImageUrl);

  try {
    const model = await createChatModel({
      modelName: "gpt-4-vision-preview",
      maxTokens: 4096,
      temperature: 0.1,
      callbacks,
      cache: false
    });
    const response = await model.call(
      [new SystemMessage(systemPrompt), humanMessage],
      { callbacks }
    );
    if (Array.isArray(response.content)) {
      throw new Error(`Expected response content to be a string`);
    }
    const content = response.content;
    const start = content.indexOf("<!DOCTYPE html>");
    const end = content.lastIndexOf("</html>");

    const html = content.slice(start, end + "</html>".length).trim();
    return html;
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
        text: "Here are the latest wireframes. Could you make a new website based on these wireframes and notes and send back just the html file?",
      },
      {
        type: "text",
        text: pageText,
      },
    ],
  });
}

/**
 * Create a message to generate a page styled with a reference image
 */
async function generateStyledMessage(
  imageUrl: string,
  pageText: string,
  styleImageUrl: string
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
        text: "Here are the latest wireframes. Could you make a new website based on these wireframes and notes and send back just the html file?",
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
        text: "Here is a picture of another page in the website. Could you make the new page designs consistent with this page?",
      },
    ],
  });
}
