"use server";

import { responses } from "@/app/data/responses";


// This function returns the questions in the dataset
export default async function getQuestions() {

  // Extract keys (questions) from the first response object
  const firstResponse = responses[0];
  const questions = Object.keys(firstResponse).filter(
    (key) =>
      key !== "id" && // Exclude unecessary fields
      key !== "date" 
  );

  return JSON.stringify(questions);
}
