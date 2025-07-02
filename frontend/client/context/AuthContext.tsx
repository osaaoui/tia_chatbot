import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserResponse, LoginRequest as ApiLoginRequest, UserCreateRequest as ApiUserCreateRequest } from '@/services/api'; // Assuming these are defined
import { loginUser, signupUser } from '@/services/api'; // We'll ensure these are in api.ts

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: UserResponse | null;
  isLoading: boolean;
  login: (data: ApiLoginRequest) => Promise<void>;
  signup: (data: ApiUserCreateRequest) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start with loading true to check localStorage
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for user session in localStorage on initial load
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const parsedUser: UserResponse = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.error("Failed to parse stored user from localStorage", e);
      localStorage.removeItem('currentUser'); // Clear corrupted data
    }
    setIsLoading(false);
  }, []);

  const login = async (data: ApiLoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await loginUser(data);
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('currentUser', JSON.stringify(user));
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Login failed';
      setError(errorMessage);
      setIsAuthenticated(false);
      setCurrentUser(null);
      throw new Error(errorMessage); // Re-throw for component to handle
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: ApiUserCreateRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      // Backend signup currently returns UserResponse directly
      await signupUser(data);
      // After successful signup, user typically needs to login separately
      // Or, backend could return UserResponse and auto-login, but current plan is separate login
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Signup failed';
      setError(errorMessage);
      throw new Error(errorMessage); // Re-throw for component to handle
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
    // Optionally: call a backend /logout endpoint if it exists
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, isLoading, login, signup, logout, error, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
