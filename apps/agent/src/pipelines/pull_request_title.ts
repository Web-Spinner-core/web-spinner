import { Callbacks } from "langchain/callbacks";
import { HumanMessage, SystemMessage } from "langchain/schema";
import { z } from "zod";
import { createChatModel } from "@lib/openai";
import ObjectiveTool from "~/tools/objective_tool";

const prompt = `You are a senior engineer that upholds excellent coding standards. 
You will be provided with a description of changes to make. 
Come up with a concise title for a pull request that creates the requested changes.`;

const objectiveName = "submit_title";
const objectiveSchema = z.object({
  title: z.string(),
});

/**
 * Create a pull request title from a description of requested changes
 */
export async function createPullRequestTitle(
  description: string,
  callbacks?: Callbacks
): Promise<string> {
  const openai = await createChatModel({
    modelName: "gpt-4-1106-preview",
    temperature: 0,
  })

  const tool = new ObjectiveTool(
    objectiveSchema,
    "Submit the pull request title",
    objectiveName
  );
  const result = await openai.predictMessages(
    [new SystemMessage(prompt), new HumanMessage(description)],
    {
      tools: [tool],
      tool_choice: {
        function: {
          name: objectiveName,
        },
        type: "function",
      },
      callbacks,
    }
  );

  const toolCall = result.additional_kwargs.tool_calls![0];
  const argumentsRaw = toolCall.function.arguments;
  const { title } = objectiveSchema.parse(JSON.parse(argumentsRaw ?? ""));

  return title;
}
