import Footer from '../components/Footer';
import Header from '../components/Header';

function BaseView({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <section id="header" className="spacer ">
        <Header />
      </section>
      <section id="page-content">{children}</section>
      <section id="footer" className="spacer ">
        <Footer />
      </section>
    </>
  );
}

export default BaseView;
