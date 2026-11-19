'use client';

interface RunSelectorProps {
  runs: any[];
  selectedRunId: number | null;
  onRunSelect: (runId: number | null) => void;
}

function chipClass(selected: boolean) {
  return `min-h-10 whitespace-nowrap rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
    selected ? 'border-ink bg-ink text-page' : 'border-line-strong text-ink hover:border-ink'
  }`;
}

export function RunSelector({ runs, selectedRunId, onRunSelect }: RunSelectorProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2" role="group" aria-label="Select a run">
      <button type="button" onClick={() => onRunSelect(null)} aria-pressed={selectedRunId === null} className={chipClass(selectedRunId === null)}>
        All runs
      </button>
      {runs.map((run) => (
        <button
          key={run.id}
          type="button"
          onClick={() => onRunSelect(run.id)}
          aria-pressed={selectedRunId === run.id}
          className={chipClass(selectedRunId === run.id)}
        >
          Run #{run.run_number}
        </button>
      ))}
    </div>
  );
}
