import { Link } from '@tanstack/react-router';
import { User } from 'lucide-react';
import { useOnlineCount } from '../hooks/useOnlineCount';
import ThemeToggle from './ThemeToggle';

const Header = () => {
  const { onlineCount } = useOnlineCount();
  return (
    <header
      id="header"
      className="flex h-full items-center justify-between gap-4 px-6"
    >
      <nav className="flex items-center gap-4 text-sm">
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>
        <Link
          to="/question/$id"
          params={{ id: '123' }}
          className="[&.active]:font-bold"
        >
          Question ID
        </Link>
      </nav>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>Online Users: {onlineCount}</span>
        <ThemeToggle />
        <Link
          to="/profile/$id"
          params={{ id: 'me' }}
          aria-label="View profile"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-accent hover:text-accent-foreground [&.active]:bg-accent"
        >
          <User className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
};

export default Header;
