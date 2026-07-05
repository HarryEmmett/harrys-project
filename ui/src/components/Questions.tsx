import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useQuestionsQuery } from '../hooks/useQuestionsQuery';
import { useRoom } from '../hooks/useRoom';
import QuestionCard from './QuestionCard';
import CreateQuestionModal from './CreateQuestionModal';
import ErrorView from '../views/ErrorView';

// TODO(roadmap #5, identity/roles): replace with a persisted anonymous user id.
const CURRENT_USER_ID = 'user_me';

const Questions = () => {
  const {
    questionsQuery,
    createQuestionMutation,
    deleteQuestionMutation,
    voteQuestionMutation,
  } = useQuestionsQuery();
  const { data, isLoading, isError } = questionsQuery;

  const [isModalOpen, setIsModalOpen] = useState(false);

  const eventId = data?.event.id ?? '';
  const { joinRoom, leaveRoom } = useRoom(eventId);

  useEffect(() => {
    if (!eventId) return;
    joinRoom();
    return () => leaveRoom();
    // joinRoom/leaveRoom are recreated each render but only depend on eventId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const handleCreateQuestion = (content: string) => {
    createQuestionMutation.mutate({ userId: CURRENT_USER_ID, content });
  };

  const handleDeleteQuestion = (id: string) => {
    deleteQuestionMutation.mutate(id);
  };

  const handleVoteQuestion = (id: string, delta: 1 | -1) => {
    voteQuestionMutation.mutate({ id, delta });
  };

  if (isError) return <ErrorView />;
  if (isLoading) return <p>Loading...</p>;

  const sortedQuestions = [...(data?.questions ?? [])].sort(
    (a, b) => b.votes - a.votes,
  );

  return (
    <div className="w-full p-2">
      <section id="questions-content" className="text-left">
        <div className="mb-4 flex items-center justify-between">
          <h2>Questions</h2>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Create Question
          </button>
        </div>

        <ul className="flex flex-col gap-3">
          {sortedQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              onDelete={handleDeleteQuestion}
              onVote={handleVoteQuestion}
            />
          ))}
        </ul>

        <CreateQuestionModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onCreate={handleCreateQuestion}
        />
      </section>
    </div>
  );
};

export default Questions;
