import { v4 as uuidv4 } from 'uuid'

// Simulated user database
const DEMO_USERS = [
  {
    id: '1',
    email: 'user@example.com',
    password: 'password123',
    name: 'Regular User',
    role: 'user',
    created_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    email: 'admin@example.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
    created_at: '2024-01-01T00:00:00.000Z',
  },
]

const AUTH_TOKEN_KEY = 'auth_token'
const USER_KEY = 'user'

// Initialize user storage if empty
const initializeStorage = () => {
  const users = localStorage.getItem('users')
  if (!users) {
    localStorage.setItem('users', JSON.stringify(DEMO_USERS))
  }
}

// Get all users
const getUsers = () => {
  initializeStorage()
  return JSON.parse(localStorage.getItem('users') || '[]')
}

// Register a new user
const register = async (userData) => {
  const users = getUsers()

  // Check if email already exists
  if (users.find((user) => user.email === userData.email)) {
    throw new Error('Email already registered')
  }

  // Create new user
  const newUser = {
    id: uuidv4(),
    email: userData.email,
    password: userData.password, // In a real app, this would be hashed
    name: userData.name,
    role: 'user', // Default role is user
    created_at: new Date().toISOString(),
  }

  // Add to users array
  users.push(newUser)
  localStorage.setItem('users', JSON.stringify(users))

  // Remove password from returned user
  const userWithoutPassword = { ...newUser }
  delete userWithoutPassword.password
  return userWithoutPassword
}

// Login user
const login = async (email, password) => {
  const users = getUsers()
  const user = users.find((u) => u.email === email && u.password === password)

  if (!user) {
    throw new Error('Invalid login credentials')
  }

  // Generate token
  const token = uuidv4()

  // Store auth data in localStorage
  const authUser = { ...user }
  delete authUser.password

  localStorage.setItem(AUTH_TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(authUser))

  return { user: authUser, token }
}

// Logout user
const logout = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  return true
}

// Check if user is authenticated
const isAuthenticated = () => {
  return !!localStorage.getItem(AUTH_TOKEN_KEY)
}

// Get current user
const getCurrentUser = () => {
  const userJson = localStorage.getItem(USER_KEY)
  return userJson ? JSON.parse(userJson) : null
}

// Reset password
const forgotPassword = async (email) => {
  const users = getUsers()
  const user = users.find((u) => u.email === email)

  if (!user) {
    throw new Error('Email not found')
  }

  // In a real app, send an email with reset link
  // Here we just simulate success
  return { success: true, message: 'Reset link sent to your email' }
}

export default {
  register,
  login,
  logout,
  isAuthenticated,
  getCurrentUser,
  forgotPassword,
}
 