import { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import type { QuestionResponse } from '@harrys-project/shared/apiSchema';
import { useQuestionsQuery } from '../hooks/useQuestionsQuery';
import QuestionCard from './QuestionCard';
import CreateQuestionModal from './CreateQuestionModal';
import ErrorView from '../views/ErrorView';

const Questions = () => {
  const { questionsQuery } = useQuestionsQuery();
  const { data, isLoading, isError } = questionsQuery;

  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const nextQuestionIdRef = useRef(1);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (data && !isInitializedRef.current) {
      setQuestions(data.questions);
      nextQuestionIdRef.current = data.questions.length + 1;
      isInitializedRef.current = true;
    }
  }, [data]);

  const handleCreateQuestion = (content: string) => {
    const newQuestion: QuestionResponse = {
      id: `q${nextQuestionIdRef.current++}`,
      userId: 'user_me',
      content,
      votes: 0,
      answered: false,
      createdAt: new Date().toISOString(),
    };
    setQuestions((prev) => [newQuestion, ...prev]);
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((question) => question.id !== id));
  };

  const handleVoteQuestion = (id: string, delta: 1 | -1) => {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === id
          ? { ...question, votes: question.votes + delta }
          : question,
      ),
    );
  };

  if (isError) return <ErrorView />;
  if (isLoading) return <p>Loading...</p>;

  const sortedQuestions = [...questions].sort((a, b) => b.votes - a.votes);

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
