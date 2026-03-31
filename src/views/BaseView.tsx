import type { ApiResponse } from "../schemas/apiSchema";
import { useEffect, useState } from "react";
import { fetchMockData } from "../api/mockApi/mockApi";

export const BaseView = () => {
  const [questions, setQuestions] = useState<ApiResponse["questions"]>();
  useEffect(() => {
    fetchMockData(1500, false)
      .then((data) => setQuestions(data.questions))
      .catch((err) => console.error(err));
  }, []);
  return (
    <>
      <section id="page-content">
        <div className="hero"></div>
        <div>
          <h1>Get started</h1>
          <ul>
            {questions &&
              questions.map((q) => {
                return <li key={q.id}>{q.content}</li>;
              })}
          </ul>
        </div>
      </section>

      <section id="likes-container">
        <div id="likes">
          <h2>likes</h2>
          <p>Your questions, answered</p>
        </div>
        <div id="viewers">
          <h2>Viewers</h2>
          <p>Join the Vite community</p>
        </div>
      </section>

      <div className="ticks"></div>
    </>
  );
};
