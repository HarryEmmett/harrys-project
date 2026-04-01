function BaseView({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <section id="page-content">{children}</section>
    </>
  );
}

export default BaseView;
