import type { ApiResponse } from "../schemas/apiSchema";

type QuestionsProps = { questions: ApiResponse["questions"]};

export default ({ questions }: QuestionsProps) => {
  return (
    <>
      <ul>
        {questions &&
          questions.map((q) => {
            return <li key={q.id}>{q.content}</li>;
          })}
      </ul>
    </>
  );
};
