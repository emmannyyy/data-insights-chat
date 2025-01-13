"use client";

import { useChat } from "ai/react";
import { useState } from "react";
import Image from "next/image";
import Title from "./title";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // For GitHub-Flavored Markdown
import { renderChart } from "@/app/actions/renderChart";
import { renderWordCloud } from "@/app/actions/renderWordCloud";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // Set loading to true when the user submits a message
    await handleSubmit(e); // Submit the message
    setLoading(false); // Set loading to false after response is received
  };

  return (
    <div className="flex flex-col w-full sm:w-[95%] md:w-[80%] lg:max-w-lg py-16 mx-auto">
      {/* Title */}
      <Title />
      <div className="flex flex-col space-y-4 px-4 py-2 bg-gray-100 rounded-md shadow-lg overflow-y-auto h-[70vh]">
        {/* Messages */}
        {messages
          .filter((m) => m.content.trim() !== "") // Filter out blank messages
          .map((m) => {
            console.log("Message content:", m.content); // Debugging content
            return (
              <div
                key={m.id}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {/* User Avatar */}
                {m.role !== "user" && (
                  <div className="w-10 h-10 flex-shrink-0">
                    <Image
                      src="/assets/chatbot.jpg"
                      alt="Chatbot"
                      width={40}
                      height={40}
                      className="rounded-full mr-3"
                    />
                  </div>
                )}
                {/* Message Content */}
                <div
                  className={`px-4 py-2 rounded-lg ${
                    m.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-300 text-black"
                  }`}
                >
                  {m.content.startsWith("data:image") ? (
                    <img
                      src={m.content}
                      alt="Visualization"
                      className="max-w-full h-auto rounded"
                    />
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.content}
                    </ReactMarkdown>
                  )}
                </div>
                {/* User Icon */}
                {m.role === "user" && (
                  <div className="w-10 h-10 flex-shrink-0">
                    <Image
                      src="/assets/user.png"
                      alt="User"
                      width={40}
                      height={40}
                      className="rounded-full ml-3"
                    />
                  </div>
                )}
              </div>
            );
          })}
        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center space-x-2 text-gray-500">
            <Image
              src="/assets/chatbot-avatar.png"
              alt="Chatbot"
              width={40}
              height={40}
              className="rounded-full mr-3"
            />
            <span>Chatbot is typing...</span>
          </div>
        )}
      </div>
      {/* Input Form */}
      <form
        onSubmit={handleFormSubmit}
        className="mt-4 flex items-center space-x-2"
      >
        <input
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={input}
          placeholder="Type your message..."
          onChange={handleInputChange}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600"
        >
          Send
        </button>
      </form>
    </div>
  );
}
