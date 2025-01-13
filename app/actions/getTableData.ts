import { responses } from "@/app/data/responses"; // Adjust path as needed

// Transform the data into a table-like format
export function getTableData() {
  // Map through the responses to flatten the structure
  const tableData = responses.map((response) => ({
    id: response.id,
    date: response.date,
    workload: response["How often do you feel overwhelmed by your academic workload?"],
    stressSources: response["What are the main sources of academic stress you experience as a university student?"],
    strategies: response["Which of the following strategies do you use to manage academic stress? (Select all that apply)"],
    mentalHealthRating: response["On a scale from 1 to 10, how would you rate your overall mental health during the academic year?"],
    supportServices: response["What support services do you think would help improve your academic experience and mental health?"],
  }));

  return tableData;
}
