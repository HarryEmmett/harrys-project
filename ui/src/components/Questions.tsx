import type { QuestionsResponse } from '@harrys-project/shared/apiSchema';

type QuestionsProps = { questions: QuestionsResponse['questions'] };

const Questions = ({ questions }: QuestionsProps) => {
  return (
    <>
      <ul>
        {questions &&
          questions.map((q: QuestionsResponse['questions'][number]) => {
            // eslint-disable-next-line react-hooks/purity
            return <li key={q.id + Math.random()}>{q.content}</li>;
          })}
      </ul>
    </>
  );
};

export default Questions;
