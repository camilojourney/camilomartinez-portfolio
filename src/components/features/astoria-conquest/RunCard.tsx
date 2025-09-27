'use client';

interface RunCardProps {
  run: {
    run_number: number;
    name: string;
    date: string;
    distance_meters: number;
    duration_seconds: number;
    average_speed_mps: number;
    suffer_score: number;
    whoop_strain: number;
    avg_heart_rate: number;
    max_heart_rate: number;
    kilojoules: number;
    heart_rate_zones: {
      rest: number;
      light: number;
      moderate: number;
      hard: number;
      peak: number;
      max: number;
    };
  };
  isSelected: boolean;
  onClick: () => void;
}

export function RunCard({ run, isSelected, onClick }: RunCardProps) {
  const date = new Date(run.date);
  
  // Use consistent date formatting to avoid hydration mismatches
  const formatDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${month} ${day}, ${year} at ${displayHours}:${displayMinutes} ${ampm}`;
  };
  
  const formattedDate = formatDate(date);

  return (
    <div 
      className={`p-4 rounded-lg transition-all cursor-pointer ${
        isSelected ? 'bg-cyan-500/20 border border-cyan-500' : 'bg-black/20 hover:bg-black/30'
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medium text-white">Run #{run.run_number}</h3>
          <p className="text-sm text-gray-400">{run.name}</p>
        </div>
        <span className="text-sm text-gray-400">{formattedDate}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-400">Distance: </span>
          <span className="text-white">{(run.distance_meters / 1000).toFixed(2)} km</span>
        </div>
        <div>
          <span className="text-gray-400">Time: </span>
          <span className="text-white">{Math.floor(run.duration_seconds / 60)}:{(run.duration_seconds % 60).toString().padStart(2, '0')}</span>
        </div>
        <div>
          <span className="text-gray-400">Avg Speed: </span>
          <span className="text-white">{(run.average_speed_mps * 3.6).toFixed(1)} km/h</span>
        </div>
        <div>
          <span className="text-gray-400">Suffer Score: </span>
          <span className="text-white">{run.suffer_score}</span>
        </div>
        <div>
          <span className="text-gray-400">WHOOP Strain: </span>
          <span className="text-white">{run.whoop_strain?.toFixed(1) || 'N/A'}</span>
        </div>
        <div>
          <span className="text-gray-400">Avg HR: </span>
          <span className="text-white">{run.avg_heart_rate || 'N/A'} bpm</span>
        </div>
      </div>

      {/* Heart Rate Zone Mini-Graph */}
      <div className="mt-2">
        <div className="h-1 w-full rounded-full overflow-hidden bg-gray-700 flex">
          {Object.entries(run.heart_rate_zones).map(([zone, minutes]) => {
            const colors = {
              rest: 'bg-blue-500',
              light: 'bg-green-500',
              moderate: 'bg-yellow-500',
              hard: 'bg-orange-500',
              peak: 'bg-red-500',
              max: 'bg-purple-500'
            } as const;
            const totalMinutes = Object.values(run.heart_rate_zones).reduce((a, b) => a + b, 0);
            const percentage = (minutes / totalMinutes) * 100;
            return (
              <div
                key={zone}
                className={`${colors[zone as keyof typeof colors]} h-full transition-all`}
                style={{ width: `${percentage}%` }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}