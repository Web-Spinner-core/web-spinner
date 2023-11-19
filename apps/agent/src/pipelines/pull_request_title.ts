import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanMessage, SystemMessage } from "langchain/schema";
import { z } from "zod";
import { env } from "~/env";
import SaveAnalysisTool from "~/tools/save_analysis";

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
  description: string
): Promise<string> {
  const openai = new ChatOpenAI({
    modelName: "gpt-4-1106-preview",
    openAIApiKey: env.OPENAI_API_KEY,
    temperature: 0.7,
  });

  const tool = new SaveAnalysisTool(
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
    }
  );

  const toolCall = result.additional_kwargs.tool_calls![0];
  const argumentsRaw = toolCall.function.arguments;
  const { title } = objectiveSchema.parse(JSON.parse(argumentsRaw ?? ""));

  return title;
}
