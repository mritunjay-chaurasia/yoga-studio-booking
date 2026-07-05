import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const dashboardPath =
    user?.role === 'admin'
      ? '/admin'
      : user?.role === 'instructor'
        ? '/instructor'
        : user?.role === 'student'
          ? '/student'
          : null;

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition ${
      isActive ? 'text-sage-700' : 'text-sage-500 hover:text-sage-700'
    }`;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-sage-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🧘</span>
            <span className="font-display text-xl font-bold text-sage-800">
              Serenity Yoga
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <NavLink to="/" className={navLinkClass} end>
              Classes
            </NavLink>
            {user ? (
              <>
                {dashboardPath && (
                  <NavLink to={dashboardPath} className={navLinkClass}>
                    Dashboard
                  </NavLink>
                )}
                <span className="hidden text-sm text-sage-500 sm:inline">
                  {user.name}
                  <span className="ml-1 rounded-full bg-sage-100 px-2 py-0.5 text-xs capitalize text-sage-600">
                    {user.role}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg bg-sage-100 px-3 py-1.5 text-sm font-medium text-sage-700 hover:bg-sage-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-lg bg-sage-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sage-700"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      <footer className="mt-16 border-t border-sage-100 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-sage-500 sm:px-6">
          © {new Date().getFullYear()} Serenity Yoga Studio. Book mindfully.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
