import type { QuestionsResponse } from "../schemas/apiSchema";

type QuestionsProps = { questions: QuestionsResponse["questions"] };

const Questions = ({ questions }: QuestionsProps) => {
  return (
    <>
      <ul>
        {questions &&
          questions.map((q: QuestionsResponse["questions"][number]) => {
            return <li key={q.id}>{q.content}</li>;
          })}
      </ul>
    </>
  );
};

export default Questions;
