'use client';

interface RunSelectorProps {
  runs: any[];
  selectedRunId: number | null;
  onRunSelect: (runId: number | null) => void;
}

export function RunSelector({ runs, selectedRunId, onRunSelect }: RunSelectorProps) {
  return (
    <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
      <button
        onClick={() => onRunSelect(null)}
        className={`px-4 py-2 rounded-lg whitespace-nowrap ${
          selectedRunId === null ? 'bg-cyan-500 text-black' : 'bg-black/20 text-white hover:bg-black/30'
        }`}
      >
        All Runs
      </button>
      {runs.map((run) => (
        <button
          key={run.id}
          onClick={() => onRunSelect(run.id)}
          className={`px-4 py-2 rounded-lg whitespace-nowrap ${
            selectedRunId === run.id ? 'bg-cyan-500 text-black' : 'bg-black/20 text-white hover:bg-black/30'
          }`}
        >
          Run #{run.run_number}
        </button>
      ))}
    </div>
  );
}