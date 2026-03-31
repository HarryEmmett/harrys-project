import { useQuestionsQuery } from "../hooks/useQuestionsQuery";
import Questions from "../components/Questions";
import ErrorView from "./ErrorView";
import Likes from "../components/Likes";
import PageVisits from "../components/PageVisits";

function BaseView() {
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
          <Likes />
        </div>
        <div id="viewers">
          <PageVisits />
        </div>
      </section>
    </>
  );
}

export default BaseView;
