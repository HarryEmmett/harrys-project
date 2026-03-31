import { useQuestionsQuery } from "../hooks/useQuestionsQuery";
import Questions from "../components/Questions";
import { ErrorView } from "./ErrorView";

export const BaseView = () => {
  const { questionsQuery } = useQuestionsQuery();

  const { data, isLoading, isError } = questionsQuery;

  if (isError) return <ErrorView />;
  if (isLoading) return <p>Loading...</p>;

  const questions = data?.questions ? data.questions : [];

  return (
    <>
      <section id="page-content">
        <div className="hero"></div>
        <div>
          <h1>Get started</h1>
          <Questions questions={questions} />
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
