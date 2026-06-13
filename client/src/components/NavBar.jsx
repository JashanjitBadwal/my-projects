import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="navbar">
      <Link to="/" className="brand">🍳 Recipe Manager</Link>
      <div className="nav-links">
        <Link to="/">Browse</Link>
        {user && <Link to="/favorites">Favorites</Link>}
        {user && <Link to="/my-recipes">My Recipes</Link>}
        {user && <Link to="/recipes/new">Add Recipe</Link>}
        {user ? (
          <>
            <span className="nav-user">Hi, {user.name}</span>
            <button className="link-button" onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
