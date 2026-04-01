import './App.css';
import { appStore } from './store/appStore';
import BaseView from './views/BaseView';
import ErrorView from './views/ErrorView';

function App() {
  const isValidUser = appStore((state) => state.isValidUser);
  return (
    <>
      <section id="spacer"></section>
      {isValidUser ? <BaseView /> : <ErrorView />}
      <section id="spacer"></section>
    </>
  );
}

export default App;
