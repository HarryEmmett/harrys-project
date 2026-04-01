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
    const id = params.id;
    return <div className="p-2">Hello from Question id page {id}!</div>;
  },
});

const messageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/message/$id',
  component: function Message() {
    const params = useParams({ from: '/message/$id' });
    const id = params.id;
    return <div className="p-2">Hello from Message id page {id}!</div>;
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  questionRoute,
  messageRoute,
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
