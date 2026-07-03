import './index.css';
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useParams,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import BaseView from './views/BaseView';
import Questions from './components/Questions';
import QuestionDetail from './components/QuestionDetail';
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
    return <Questions />;
  },
});

const questionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/question/$id',
  component: function Question() {
    const params = useParams({ from: '/question/$id' });
    return <QuestionDetail id={params.id} />;
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
  questionRoute,
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
