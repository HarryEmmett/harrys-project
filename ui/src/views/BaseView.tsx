import Footer from '../components/Footer';
import Header from '../components/Header';
import FriendsPanel from '../components/FriendsPanel';
import GamesSync from '../components/GamesSync';

function BaseView({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <GamesSync />
      <section id="header" className="spacer">
        <Header />
      </section>
      <section id="page-content" className="flex flex-1 flex-col lg:flex-row">
        <main className="min-w-0 flex-1">{children}</main>
        <FriendsPanel />
      </section>
      <section id="footer" className="spacer">
        <Footer />
      </section>
    </>
  );
}

export default BaseView;
