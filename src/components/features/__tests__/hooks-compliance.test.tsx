/**
 * Regression test: verifies React hooks rules are not violated in components.
 *
 * React's renderToString / renderToStaticMarkup will throw if hooks are
 * called conditionally, in loops, after early returns, or in non-component
 * functions. This gives us a programmatic safeguard beyond lint.
 *
 * Ported from fm/portfolio-react-hooks-debt-h1 (edcb78e) with added coverage
 * for derived-value correctness: division-by-zero guards must keep the donut
 * and bar chart free of NaN output when no tracked sport has any hours.
 */
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ActivityDistributionChart } from '../whoop/ActivityDistributionChart';
import { ActivityHeatmap } from '../whoop/ActivityHeatmap';
import { GlobalChatbot } from '../GlobalChatbot';

const oneWorkout = [
  {
    id: '1',
    sport_name: 'Running',
    start_time: '2025-01-15T08:00:00Z',
    end_time: '2025-01-15T09:00:00Z',
  },
];

describe('hooks compliance — rules-of-hooks', () => {
  it('ActivityDistributionChart renders without hooks violations', () => {
    // Empty data triggers the early return path (must come *after* all hook calls)
    expect(() => renderToStaticMarkup(<ActivityDistributionChart data={[]} />)).not.toThrow();
  });

  it('ActivityDistributionChart renders with data without hooks violations', () => {
    expect(() => renderToStaticMarkup(<ActivityDistributionChart data={oneWorkout} />)).not.toThrow();
  });

  it('ActivityDistributionChart renders no NaN when data has no tracked sports', () => {
    // Only untracked sports -> yearly totals are all zero -> donut and bar
    // scales must still divide safely instead of producing NaN.
    const untrackedOnly = [
      {
        id: '1',
        sport_name: 'Swimming',
        start_time: '2026-01-15T08:00:00Z',
        end_time: '2026-01-15T09:00:00Z',
      },
      {
        id: '2',
        sport_name: 'Swimming',
        start_time: '2026-02-10T08:00:00Z',
        end_time: '2026-02-10T09:30:00Z',
      },
    ];
    const html = renderToStaticMarkup(<ActivityDistributionChart data={untrackedOnly} />);
    expect(html).not.toMatch(/NaN/);
  });

  it('ActivityHeatmap renders without hooks violations', () => {
    expect(() =>
      renderToStaticMarkup(<ActivityHeatmap data={[]} />),
    ).not.toThrow();
  });

  it('ActivityHeatmap renders with data without hooks violations', () => {
    const oneDay = [{ formatted_date: '2025-01-15', strain: 10 }];
    expect(() =>
      renderToStaticMarkup(<ActivityHeatmap data={oneDay} />),
    ).not.toThrow();
  });

  it('GlobalChatbot renders without hooks violations', () => {
    expect(() => renderToStaticMarkup(<GlobalChatbot />)).not.toThrow();
  });
});
