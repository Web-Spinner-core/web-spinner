import { Callbacks } from "langchain/callbacks";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanMessage, SystemMessage } from "langchain/schema";

const systemPrompt = `You are an expert frontend web developer, specializing in React and Tailwind.
You will be provided with the description of an issue and a mockup describing the changes to make.
Return a single JSX file that uses React, Tailwind CSS, and TypeScript to create the high-fidelity changes.

Use creative license to make the application more fleshed out.
Use ESM modules to import any necessary dependencies.
Respond ONLY with the contents of the JSX file.`;

/**
 * Generate standalone React + Tailwind JSX from a request and an image
 */
export default async function renderStandalonePage(
  description: string,
  imageUrl: string,
  callbacks?: Callbacks
) {
  const client = new ChatOpenAI({
    modelName: "gpt-4-vision-preview",
    maxTokens: 4096,
    temperature: 0.1,
  });
  const response = await client.call(
    [
      new SystemMessage(systemPrompt),
      new HumanMessage({
        content: [
          {
            type: "text",
            text: description,
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
              detail: "high",
            },
          },
        ],
      }),
    ],
    { callbacks }
  );
  if (Array.isArray(response.content)) {
    throw new Error(`Expected response content tot be a string`);
  }
  const content = response.content;
  const start = content.indexOf("```jsx");
  const end = content.lastIndexOf("```");

  const jsx = content.slice(start + 6, end).trim();
  return jsx;
}
