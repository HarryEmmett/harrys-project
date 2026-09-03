import './index.css';
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useNavigate,
  useParams,
  useSearch,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import BaseView from './views/BaseView';
import GameHub from './components/GameHub';
import GameDetail from './components/GameDetail';
import MessageThread from './components/MessageThread';
import Profile from './components/Profile';

const rootRoute = createRootRoute({
  component: () => (
    <>
      <BaseView>
        <Outlet />
      </BaseView>
      {import.meta.env.VITE_APPLICATION_ENV === 'dev' && (
        <TanStackRouterDevtools />
      )}
    </>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: function Index() {
    return <GameHub />;
  },
});

const gameRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/game/$id',
  // Codenames keeps its session id in the URL so a refresh (or a link shared
  // to the other team's device) lands back on the same board.
  validateSearch: (search: Record<string, unknown>): { session?: string } =>
    typeof search.session === 'string' ? { session: search.session } : {},
  component: function Game() {
    const params = useParams({ from: '/game/$id' });
    const search = useSearch({ strict: false });
    const navigate = useNavigate();
    return (
      <GameDetail
        id={params.id}
        codenamesSessionId={search.session}
        onCodenamesSessionIdChange={(sessionId) =>
          void navigate({
            to: '/game/$id',
            params: { id: params.id },
            search: { session: sessionId },
            replace: true,
          })
        }
      />
    );
  },
});

const messageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/message/$id',
  component: function Message() {
    const params = useParams({ from: '/message/$id' });
    return <MessageThread id={params.id} />;
  },
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile/$id',
  component: function ProfilePage() {
    const params = useParams({ from: '/profile/$id' });
    return <Profile id={params.id} />;
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  gameRoute,
  messageRoute,
  profileRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
