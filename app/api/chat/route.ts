import countResponses from "@/app/actions/countResponses";
import getQuestions from "@/app/actions/getQuestions";
import getResponses from "@/app/actions/getResponses";
import getTableData from "@/app/actions/getTableData";

import { google } from "@ai-sdk/google";
import { Message, streamText, tool } from "ai";
import { z } from "zod";

const displayBase64Image = tool({
  description: "Prints out the base64 string to the user. Print the entire base 64 string. The user wants to see the full base64 string as is. You do not need to convert it",
  parameters: z.object({
    base64String: z.string().describe("The Base64-encoded string of the image."),
  }),
  execute: async ({ base64String }) => {
    // Return an <img> tag with the base64 string
  },
});


const executePythonCode = tool({
  description: "Execute Python code to generate a visualization and return the chart as a Base64-encoded image.",
  parameters: z.object({
    code: z.string().describe("The Python code to execute."),
  }),
  execute: async ({ code }) => {
    const response = await fetch("http://127.0.0.1:8000/visualize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    const result = await response.json();
    if (result.success) {
      return `${result.image}`;
    } else {
      return `Error generating chart: ${result.error}`;
    }
  },
});

const getPythonCode = tool({
  description: `Generate Python code to visualize the data based on the user's query. 
  The dataset is preloaded as a dataframe called 'df'. 
  The dataframe has the following columns:
  - id
  - date
  - "What are the main sources of academic stress you experience as a university student?"
  - "How often do you feel overwhelmed by your academic workload?"
  - "Which of the following strategies do you use to manage academic stress? (Select all that apply)"
  - "On a scale from 1 to 10, how would you rate your overall mental health during the academic year?"
  - "What support services do you think would help improve your academic experience and mental health?"
  
  The code should:
  - Use the dataframe 'df' to create the requested visualization.
  - Save the visualization as a PNG file in a BytesIO object named 'output_image'.
  - If there is an ascending order to the x-axis, sort the order first
  `,
  parameters: z.object({
    question: z.string().describe("The user's specific request for a visualisation."),
  }),
  execute: async ({ question }) => {
    const pythonCode = `
import matplotlib.pyplot as plt
from io import BytesIO

# Generate a chart based on the user's query: "${question}"
plt.figure(figsize=(8, 6))
df['What are the main sources of academic stress you experience as a university student?'].value_counts().plot(kind='bar', color='skyblue')
plt.title('Frequency of Stress Sources')
plt.xlabel('Source')
plt.ylabel('Count')

# Save the figure to BytesIO
output_image = BytesIO()
plt.savefig(output_image, format='png')
output_image.seek(0)
`;

    return pythonCode;
  },
});


export async function POST(req: Request) {
  const { messages } = await req.json();
  const updatedMessages = [...messages];
  const result = streamText({
    experimental_toolCallStreaming: true,
    model: google("gemini-1.5-flash"),
    system: `You are an assistant that provides detailed instructions on a particular dataset. 

    Firstly, you need to parse the data by using the getResponses tool. 

    You are an assistant that provides detailed answers to user queries. Your behavior depends on the type of query:
      1. For general questions: Answer in natural language using the data you have access to.
      2. For data analysis or visualization requests: Use the appropriate tools to fetch and process data, then explain the results or display visualizations.

      Guidelines:
      - First, analyze the user's query to determine if it is a general question or a visualization/data-analysis-related query.
      - For visualization-related queries, use tools like 'getPythonCode' or 'processChartData' to generate a Base64-encoded chart.
      - For general queries, respond in simple, concise language without using tools unless necessary.

    Rules to follow for analysing the data:
    1. Use statistics when a user has asked quantitative questions. 
    For example: 
    A. Find out what is the most frequent answer (e.g: Mode)
    B. Perform calculations and explain (briefly) how you have arrived at the result
    C. Include numbers and quantitative substantiation where relevant

    2. Presentation of data
    A. Write out points in a concise way (bullet points are preferred)
    B. Use simple English
    
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
      getTable: tool({
        description: "Get the data in a table form, part of which can then be used as inputs for other tools",
        parameters: z.object({}),
        execute: getTableData,
      }),
      getPythonCode: getPythonCode,
      executePythonCode: executePythonCode,
      displayBase64Img: displayBase64Image
    },
    maxSteps: 10,

  });

  // Default behavior for text streaming
  return result.toDataStreamResponse();

}
