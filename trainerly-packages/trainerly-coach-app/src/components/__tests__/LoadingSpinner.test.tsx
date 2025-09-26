import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoadingSpinner from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders loading spinner with default message', () => {
      render(<LoadingSpinner />)
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.getByText('טוען...')).toBeInTheDocument()
    })

    it('renders with custom message', () => {
      render(<LoadingSpinner message="טוען נתונים..." />)
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.getByText('טוען נתונים...')).toBeInTheDocument()
    })

    it('renders without message when message is empty', () => {
      render(<LoadingSpinner message="" />)
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.queryByText('טוען...')).not.toBeInTheDocument()
    })

    it('applies correct size class', () => {
      const { container } = render(<LoadingSpinner size="large" />)
      
      expect(container.querySelector('.loading-spinner.large')).toBeInTheDocument()
    })

    it('applies fullscreen class when fullScreen is true', () => {
      const { container } = render(<LoadingSpinner fullScreen={true} />)
      
      expect(container.querySelector('.loading-spinner-fullscreen')).toBeInTheDocument()
    })

    it('applies container class when fullScreen is false', () => {
      const { container } = render(<LoadingSpinner fullScreen={false} />)
      
      expect(container.querySelector('.loading-spinner-container')).toBeInTheDocument()
    })
  })
})
