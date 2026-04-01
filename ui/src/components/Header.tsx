import { Link } from '@tanstack/react-router';
import { useOnlineCount } from '../hooks/useOnlineCount';

const Header = () => {
  const { onlineCount } = useOnlineCount();
  return (
    <header id="header">
      <Link to="/" className="[&.active]:font-bold">
        Home
      </Link>{' '}
      <Link
        to="/question/$id"
        params={{ id: '123' }}
        className="[&.active]:font-bold"
      >
        Question ID
      </Link>
      <Link
        to="/message/$id"
        params={{ id: '456' }}
        className="[&.active]:font-bold"
      >
        Message IDs
      </Link>
      <div>Online Users: {onlineCount}</div>
    </header>
  );
};

export default Header;
