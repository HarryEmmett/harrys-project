import { useFriendsQuery } from '../hooks/useFriendsQuery';
import ErrorView from '../views/ErrorView';

// Placeholder data until the profile API is wired up
const myProfile = {
  name: 'Harry Emmett',
  email: 'harryemmett@live.co.uk',
  bio: 'Building a Slido clone, one component at a time.',
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

type ProfileProps = {
  id: string;
};

const Profile = ({ id }: ProfileProps) => {
  const { friendsQuery } = useFriendsQuery();
  const { data, isLoading, isError } = friendsQuery;

  if (isError) return <ErrorView />;
  if (isLoading) return <p>Loading...</p>;

  const profile =
    id === 'me' ? myProfile : data?.friends.find((friend) => friend.id === id);

  if (!profile) {
    return (
      <div className="w-full max-w-xl p-2 text-left">
        <p className="text-sm text-muted-foreground">Profile not found.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl p-2 text-left">
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary text-lg font-medium text-secondary-foreground">
            {getInitials(profile.name)}
          </span>
          <div>
            <h2 className="m-0">{profile.name}</h2>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-foreground">{profile.bio}</p>
      </div>
    </div>
  );
};

export default Profile;
