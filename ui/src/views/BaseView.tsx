import { constants } from '@harrys-project/shared/constants';
import { useQuestionsQuery } from '../hooks/useQuestionsQuery';
import { useRoom } from '../hooks/useRoom';
import ErrorView from './ErrorView';
import Likes from '../components/Likes';
import PageVisits from '../components/PageVisits';

function BaseView() {
  const { questionsQuery } = useQuestionsQuery();
  const { latestQuestion, postQuestion, joinRoom } = useRoom(
    constants.ws.questions.QUESTIONS_ROOM,
  );

  const { isLoading, isError } = questionsQuery;

  if (isError) return <ErrorView />;
  if (isLoading) return <p>Loading...</p>;

  // const questions = data?.questions ? data.questions : [];

  return (
    <>
      <section id="page-content">
        <div className="hero"></div>
        <div>
          <h1>Questions</h1>
          <p>{latestQuestion || 'No questions yet'}</p>
        </div>
        <button onClick={() => postQuestion()}>Add Question</button>
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
