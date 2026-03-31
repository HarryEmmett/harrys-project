import { useLikesQuery } from "../hooks/useLikesQuery";
import ErrorView from "../views/ErrorView";

const Likes = () => {
  const { likesQuery } = useLikesQuery();

  const { data, isLoading, isError } = likesQuery;

  if (isError) return <ErrorView />;
  if (isLoading) return <p>Loading...</p>;

  const likes = data?.likes ?? 0;
  
  return (
    <>
      <h2>likes: {likes} </h2>
    </>
  );
};

export default Likes;
