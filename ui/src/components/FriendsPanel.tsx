import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { UserPlus } from 'lucide-react';
import { friends as initialFriends, type Friend } from '../mockData/friends';
import AddFriendModal from './AddFriendModal';

let nextFriendId = initialFriends.length + 1;

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const FriendAvatar = ({ name, isOnline }: Friend) => (
  <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
    {getInitials(name)}
    {isOnline && (
      <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500" />
    )}
  </span>
);

const FriendsPanel = () => {
  const [friends, setFriends] = useState(initialFriends);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddFriend = (name: string) => {
    const newFriend: Friend = {
      id: `${nextFriendId++}`,
      name,
      email: '',
      bio: '',
      isOnline: true,
    };
    setFriends((prev) => [...prev, newFriend]);
  };

  const onlineFriends = friends.filter((friend) => friend.isOnline);
  const offlineFriends = friends.filter((friend) => !friend.isOnline);

  return (
    <aside
      id="friends-panel"
      className="w-full shrink-0 border-border p-6 text-left lg:w-64 lg:border-l"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          Friends Online
        </h2>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          aria-label="Add friend"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <UserPlus className="h-4 w-4" />
        </button>
      </div>

      <ul className="flex flex-col gap-3">
        {onlineFriends.map((friend) => (
          <li key={friend.id}>
            <Link
              to="/message/$id"
              params={{ id: friend.id }}
              className="flex items-center gap-3 rounded-md p-1 -m-1 transition-colors hover:bg-accent"
            >
              <FriendAvatar {...friend} />
              <span className="text-sm text-foreground">{friend.name}</span>
            </Link>
          </li>
        ))}
      </ul>

      {offlineFriends.length > 0 && (
        <>
          <h3 className="mt-6 mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Offline
          </h3>
          <ul className="flex flex-col gap-3">
            {offlineFriends.map((friend) => (
              <li key={friend.id} className="opacity-60">
                <Link
                  to="/message/$id"
                  params={{ id: friend.id }}
                  className="flex items-center gap-3 rounded-md p-1 -m-1 transition-colors hover:bg-accent"
                >
                  <FriendAvatar {...friend} />
                  <span className="text-sm text-foreground">{friend.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <AddFriendModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onAdd={handleAddFriend}
      />
    </aside>
  );
};

export default FriendsPanel;
