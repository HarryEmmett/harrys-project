import { constants } from '@harrys-project/shared/constants';
import { useQuestionsQuery } from '../hooks/useQuestionsQuery';
import { useRoom } from '../hooks/useRoom';
import Questions from '../components/Questions';
import ErrorView from './ErrorView';
import Likes from '../components/Likes';
import PageVisits from '../components/PageVisits';

function BaseView() {
  const { questionsQuery } = useQuestionsQuery();
  const { latestQuestion, postQuestion, usersInRoom, joinRoom } = useRoom(
    constants.ws.questions.QUESTIONS_ROOM,
  );

  const { data, isLoading, isError } = questionsQuery;

  if (isError) return <ErrorView />;
  if (isLoading) return <p>Loading...</p>;

  const questions = data?.questions ? data.questions : [];

  return (
    <>
      <section id="page-content">
        <div className="hero"></div>
        <div>
          <h1>Questions</h1>
          <p>{latestQuestion || 'No questions yet'}</p>
          <p>Users in room: {usersInRoom}</p>
          <br />
          <Questions questions={questions} />
        </div>
        <button onClick={() => postQuestion('A new question!')}>
          Add Question
        </button>
        <button onClick={joinRoom}>Join Room</button>
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
