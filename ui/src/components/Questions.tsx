import type { QuestionsResponse } from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';
import { useQuestionsQuery } from '../hooks/useQuestionsQuery';
import { useRoom } from '../hooks/useRoom';
import ErrorView from '../views/ErrorView';
import Likes from '../components/Likes';
import PageVisits from '../components/PageVisits';

const Questions = () => {
  const { questionsQuery } = useQuestionsQuery();
  const { postQuestion, joinRoom, leaveRoom } = useRoom(
    constants.ws.questions.QUESTIONS_ROOM,
  );

  const { data, isLoading, isError } = questionsQuery;

  if (isError) return <ErrorView />;
  if (isLoading) return <p>Loading...</p>;

  const questions = data?.questions ? data.questions : [];
  return (
    <>
      <section id="questions-content">
        <button onClick={() => postQuestion()}>Add Question</button>
        <button onClick={joinRoom}>Join Room</button>
        <button onClick={leaveRoom}>Leave Room</button>
        <div>
          <ul>
            {questions &&
              questions.map((q: QuestionsResponse['questions'][number]) => {
                // eslint-disable-next-line react-hooks/purity
                return <li key={q.id + Math.random()}>{q.content}</li>;
              })}
          </ul>
        </div>

        <section id="likes-content">
          <div id="likes">
            <Likes />
          </div>
          <div id="viewers">
            <PageVisits />
          </div>
        </section>
      </section>
    </>
  );
};

export default Questions;
