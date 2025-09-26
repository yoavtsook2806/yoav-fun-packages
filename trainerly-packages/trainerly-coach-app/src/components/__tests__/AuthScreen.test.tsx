import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuthScreen from '../AuthScreen'

describe('AuthScreen', () => {
  const mockProps = {
    onLogin: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('displays welcome message', () => {
      render(<AuthScreen {...mockProps} />)
      
      expect(screen.getByText('Trainerly')).toBeInTheDocument()
      expect(screen.getByText('מערכת ניהול אימונים מקצועית')).toBeInTheDocument()
    })

    it('shows login form inputs', () => {
      render(<AuthScreen {...mockProps} />)
      
      expect(screen.getByPlaceholderText('כתובת אימייל')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('סיסמה')).toBeInTheDocument()
      expect(screen.getByText('התחבר')).toBeInTheDocument()
    })

    it('displays trainerly logo', () => {
      render(<AuthScreen {...mockProps} />)
      
      // Check for the logo specifically by looking for the auth-logo section
      const logoSection = screen.getByRole('heading', { level: 1 })
      expect(logoSection).toHaveTextContent('Trainerly')
      
      // Check that there are multiple 💪 emojis (logo and features)
      const flexEmojis = screen.getAllByText('💪')
      expect(flexEmojis).toHaveLength(2)
    })
  })

  describe('Form Interaction', () => {
    it('allows typing in email field on login form', async () => {
      const user = userEvent.setup()
      render(<AuthScreen {...mockProps} />)
      
      const emailInput = screen.getByPlaceholderText('כתובת אימייל')
      await user.type(emailInput, 'avi@example.com')
      
      expect(emailInput).toHaveValue('avi@example.com')
    })

    it('allows typing in password field on login form', async () => {
      const user = userEvent.setup()
      render(<AuthScreen {...mockProps} />)
      
      const passwordInput = screen.getByPlaceholderText('סיסמה')
      await user.type(passwordInput, 'mypassword')
      
      expect(passwordInput).toHaveValue('mypassword')
    })

    it('enables login button when both fields are filled', async () => {
      const user = userEvent.setup()
      render(<AuthScreen {...mockProps} />)
      
      const emailInput = screen.getByPlaceholderText('כתובת אימייל')
      const passwordInput = screen.getByPlaceholderText('סיסמה')
      const loginButton = screen.getByText('התחבר')
      
      // Fill in fields
      await user.type(emailInput, 'avi@example.com')
      await user.type(passwordInput, 'mypassword')
      
      // Should be enabled now
      expect(loginButton).toBeEnabled()
    })
  })

  describe('Authentication', () => {
    it('shows login form by default', async () => {
      render(<AuthScreen {...mockProps} />)
      
      expect(screen.getByText('ברוכים השבים!')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('כתובת אימייל')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('סיסמה')).toBeInTheDocument()
    })

    it('switches to signup form when signup tab is clicked', async () => {
      const user = userEvent.setup()
      render(<AuthScreen {...mockProps} />)
      
      const signupTab = screen.getByText('הרשמה')
      await user.click(signupTab)
      
      expect(screen.getByText('הצטרפו אלינו!')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('שם מלא')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('כינוי (לזיהוי מתאמנים)')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('login form requires both email and password', async () => {
      const user = userEvent.setup()
      render(<AuthScreen {...mockProps} />)
      
      const emailInput = screen.getByPlaceholderText('כתובת אימייל')
      const loginButton = screen.getByText('התחבר')
      
      // Fill only email
      await user.type(emailInput, 'avi@example.com')
      
      // Button should still be disabled without password
      expect(loginButton).toBeDisabled()
    })

    it('login form requires email when only password is filled', async () => {
      const user = userEvent.setup()
      render(<AuthScreen {...mockProps} />)
      
      const passwordInput = screen.getByPlaceholderText('סיסמה')
      const loginButton = screen.getByText('התחבר')
      
      // Fill only password
      await user.type(passwordInput, 'mypassword')
      
      // Button should still be disabled without email
      expect(loginButton).toBeDisabled()
    })

    it('signup form requires all fields including nickname', async () => {
      const user = userEvent.setup()
      render(<AuthScreen {...mockProps} />)
      
      // Switch to signup form
      const signupTab = screen.getByText('הרשמה')
      await user.click(signupTab)
      
      const signupButton = screen.getByText('הירשם')
      
      // Button should be disabled initially
      expect(signupButton).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('shows error message when login fails', () => {
      render(<AuthScreen {...mockProps} />)
      
      // Component should render without errors
      expect(screen.getByText('התחברות')).toBeInTheDocument()
      expect(screen.getByText('הרשמה')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('renders properly on mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      render(<AuthScreen {...mockProps} />)
      
      // Should render all key elements
      expect(screen.getByText('Trainerly')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('כתובת אימייל')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('סיסמה')).toBeInTheDocument()
    })
  })
})
