import { useState } from "react";
import AssistantMessage from "./components/AssistantMessage";
import UserMessage from "./components/UserMessage";
import { v4 as uuidv4 } from "uuid";

/**
 * Make a sessions history system like chat histoy
 * 1. make a route in server that returns the sessions
 * 2. make a component to show the list of sessions
 * 3. store the sessions with id and name(to show on frontend). (initially give the new chat then after one message change it)
 * 4. separate the chats sections to dynamically switch between differents chats.
 */

function App() {
  const [sessionId, setSessionId] = useState(() => uuidv4());
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; message: string }[]>(
    [],
  );
  const [generating, setGenerating] = useState(false);

  const handleInput = async () => {
    if (userInput.trim() === "") return;

    setGenerating(true);
    setMessages((prev) => [...prev, { role: "user", message: userInput }]);
    setUserInput("");

    const res = await fetch("http://localhost:3000/message", {
      method: "POST",
      body: JSON.stringify({ message: userInput, sessionId }),
      headers: {
        "content-type": "application/json",
      },
    });
    if (!res.ok) {
      throw new Error("response is not ok");
    }

    const data = await res.json();
    const aiMessage = data.message;
    setMessages((pre) => [...pre, { role: "assistant", message: aiMessage }]);

    setGenerating(false);
  };

  return (
    <main className="w-full h-screen bg-neutral-900 text-neutral-50 overflow-hidden p-6">
      {/* wrapper  */}
      <div className="w-full">
        {/* Messages container */}
        <div className="max-w-4xl h-[60dvh] w-full mx-auto p-6 overflow-y-auto">
          {messages.length > 0 &&
            messages.map((mes, index) => {
              const key = `${mes.role}_${index}`;
              if (mes.role === "user") {
                return <UserMessage key={key} message={mes.message} />;
              } else if (mes.role === "assistant") {
                return <AssistantMessage key={key} message={mes.message} />;
              }
            })}
        </div>

        {/* TextArea */}
        <div className="max-w-4xl mx-auto w-full fixed bottom-0 left-0 right-0 px-6 pb-6">
          <div className="bg-neutral-700 rounded-xl p-4 space-y-4">
            <div>
              <textarea
                onKeyUp={(e) => {
                  if (e.key === "Enter") {
                    handleInput();
                  }
                }}
                autoFocus
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className=" w-full border-none outline-none resize-none h-auto "
                placeholder="Ask Anything"
              ></textarea>
            </div>
            <div>
              <button
                disabled={generating || userInput === ""}
                onClick={handleInput}
                className="bg-neutral-300 text-black px-4 py-0.5 rounded-lg cursor-pointer ml-auto w-fit block"
              >
                Ask
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
