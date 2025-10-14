import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import SkeletonCard from '../components/SkeletonCard.jsx';

describe('SkeletonCard', () => {
  it('renders skeleton structure', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.querySelector('.skeleton-card')).toBeTruthy();
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(5);
  });
});
