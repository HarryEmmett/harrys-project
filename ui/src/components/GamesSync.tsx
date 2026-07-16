import { useGamesSocket } from '../hooks/useGamesSocket';

// Mounted once at the app shell (BaseView) so the socket stays connected
// across route navigation, same as RoomSync did for the old Slido feature.
const GamesSync = () => {
  useGamesSocket();

  return null;
};

export default GamesSync;
