import './App.css';
import { RouterProvider } from '@tanstack/react-router';
import { appStore } from './store/appStore';
import { router } from './router';
import ErrorView from './views/ErrorView';

function App() {
  const isValidUser = appStore((state) => state.isValidUser);
  return (
    <>{isValidUser ? <RouterProvider router={router} /> : <ErrorView />}</>
  );
}

export default App;
