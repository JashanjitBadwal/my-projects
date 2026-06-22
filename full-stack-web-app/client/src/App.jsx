import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import ProtectedRoute from './components/ProtectedRoute'
import RecipeList from './pages/RecipeList'
import RecipeDetail from './pages/RecipeDetail'
import RecipeForm from './pages/RecipeForm'
import Login from './pages/Login'
import Register from './pages/Register'
import './App.css'

// Root component: renders the nav bar and the route tree.
// Routes that require a logged-in user are wrapped in ProtectedRoute.
function App() {
  return (
    <>
      <NavBar />
      <main className="container">
        <Routes>
          {/* Browse all recipes (public) */}
          <Route path="/" element={<RecipeList />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Recipe detail (public) */}
          <Route path="/recipes/:id" element={<RecipeDetail />} />
          {/* Create a new recipe (auth required) */}
          <Route
            path="/recipes/new"
            element={
              <ProtectedRoute>
                <RecipeForm />
              </ProtectedRoute>
            }
          />
          {/* Edit an existing recipe (auth required, ownership checked server-side) */}
          <Route
            path="/recipes/:id/edit"
            element={
              <ProtectedRoute>
                <RecipeForm />
              </ProtectedRoute>
            }
          />
          {/* Current user's favorited recipes (auth required) */}
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <RecipeList mode="favorites" />
              </ProtectedRoute>
            }
          />
          {/* Recipes created by the current user (auth required) */}
          <Route
            path="/my-recipes"
            element={
              <ProtectedRoute>
                <RecipeList mode="mine" />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </>
  )
}

export default App
