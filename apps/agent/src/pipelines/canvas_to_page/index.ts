import { TraceGroup } from "langchain/callbacks";
import { HumanMessage, SystemMessage } from "langchain/schema";
import { createChatModel } from "~/lib/openai";

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

The user may also provide you with the html of a previous design that they want you to iterate from.
In the wireframe, the previous design's html will appear as a white rectangle.
Use their notes, together with the previous design, to inform your next result.

Sometimes it's hard for you to read the writing in the wireframes.
For this reason, all text from the wireframes will be provided to you as a list of strings, separated by newlines.
Use the provided list of text from the wireframes as a reference if any text is hard to read.

You love your designers and want them to be happy. Incorporating their feedback and notes and producing working websites makes them happy.

When sent new wireframes, respond ONLY with the contents of the html file.`;

/**
 * Generate standalone React + Tailwind JSX from a request and an image
 */
export default async function convertCanvasToPage(
  imageUrl: string,
  selectionText: string
) {
  // Observability group
  const traceGroup = new TraceGroup("convert_canvas_to_page");
  const callbacks = await traceGroup.start();

  try {
    const model = await createChatModel({
      modelName: "gpt-4-vision-preview",
      maxTokens: 4096,
      temperature: 0.1,
      callbacks,
      cache: false
    });
    const response = await model.call(
      [
        new SystemMessage(systemPrompt),
        new HumanMessage({
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
              text: selectionText,
            },
          ],
        }),
      ],
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
