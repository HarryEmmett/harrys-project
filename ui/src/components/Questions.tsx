import type { QuestionsResponse } from "@harrys-project/shared/apiSchema";

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
