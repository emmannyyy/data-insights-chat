import countResponses from "@/app/actions/countResponses";
import getQuestions from "@/app/actions/getQuestions";
import getResponses from "@/app/actions/getResponses";
import { google } from "@ai-sdk/google";
import { streamText, tool } from "ai";
import { z } from "zod";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google("gemini-1.5-flash"),
    system: `You are an assistant that provides detailed instructions on a particular dataset. 

    You answer questions following the steps listed below:
    Step 0: ALWAYS DO THIS: Parse the data by using the getResponses tool. 
    Step 1: Analyse the user's query and decide which tools (if any) can support you in answering the question precisely 
    Step 2: Execute the selected tools in the correct order, to gather and process data.
    If no tools are relevant to the query, formulate a response based on just the data alone. 
    Step 3: Formulate a good response obeying the rules listed below. 

    Rules to follow for analysing the data:
    1. Use statistics when a user has asked quantitative questions. 
    For example: 
    A. Find out what is the most frequent answer (e.g: Mode)
    B. Perform calculations and explain (briefly) how you have arrived at the result
    C. Include numbers and quantitative substantiation where relevant

    2. Presentation of data
    A. Write out points in a concise way (bullet points are preferred)
    B. Use simple English
    
    3. Where relevant, make use of other tools created. 
    `,
    messages,
    tools: {
      count: tool({
        description: "Get the total count of responses",
        parameters: z.object({
          count: z.number().describe("The total count of responses"),
        }),
        execute: countResponses,
      }),
      getResponses: tool({
        description: "Get the list of responses",
        parameters: z.object({
          question: z.string().describe("The target question"),
        }),
        execute: getResponses,
      }),
      getQuestions: tool({
        description: "Get the list of questions in the dataset",
        parameters: z.object({}),
        execute: getQuestions,
      }),
    },
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
}
