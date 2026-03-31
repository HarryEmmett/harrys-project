import { usePageVisitsQuery } from "../hooks/usePageVisitsQuery";
import ErrorView from "../views/ErrorView";

const PageVisits = () => {
  const { pageVisitsQuery } = usePageVisitsQuery();

  const { data, isLoading, isError } = pageVisitsQuery;

  if (isError) return <ErrorView />;
  if (isLoading) return <p>Loading...</p>;
  
  const pageVisits = data?.pageVisits ?? 0;

  return (
    <>
      <h2>likes: {pageVisits} </h2>
    </>
  );
};

export default PageVisits;
