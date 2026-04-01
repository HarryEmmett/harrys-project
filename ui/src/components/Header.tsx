import { Link } from '@tanstack/react-router';

const Header = () => {
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
    </header>
  );
};

export default Header;
