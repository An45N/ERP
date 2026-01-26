import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../ui/Button';

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    const button = screen.getByText('Click me');
    expect(button).toBeDisabled();
  });

  it('should not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply variant classes correctly', () => {
    const { rerender } = render(<Button variant="default">Default</Button>);
    expect(screen.getByText('Default')).toHaveClass('bg-primary');

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByText('Outline')).toHaveClass('border');
  });

  it('should apply size classes correctly', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    let button = screen.getByText('Small');
    expect(button).toHaveClass('h-9');

    rerender(<Button size="lg">Large</Button>);
    button = screen.getByText('Large');
    expect(button).toHaveClass('h-11');
  });
});
