import { useQuestionsQuery } from '../hooks/useQuestionsQuery';
import { useRoom } from '../hooks/useRoom';

// Mounted once at the app shell (BaseView) rather than inside the Questions
// list page, so the socket stays connected and joined to the room across
// route navigation (e.g. while viewing a single question's detail page).
const RoomSync = () => {
  const { questionsQuery } = useQuestionsQuery();
  const eventId = questionsQuery.data?.event.id ?? '';
  useRoom(eventId);

  return null;
};

export default RoomSync;
