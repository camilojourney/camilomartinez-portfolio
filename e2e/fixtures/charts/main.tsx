import React from 'react';
import { createRoot } from 'react-dom/client';
import { ActivityHeatmap } from '../../../src/components/features/whoop/ActivityHeatmap';
import { TrainingAnalytics } from '../../../src/components/features/whoop/TrainingAnalytics';
import { ActivityDistributionChart } from '../../../src/components/features/whoop/ActivityDistributionChart';
import { StrainVsRecoveryChart } from '../../../src/components/features/whoop/StrainVsRecoveryChart';
import { WeeklyHabitsChart } from '../../../src/components/features/whoop/WeeklyHabitsChart';
import { RecoveryChart } from '../../../src/components/features/whoop/RecoveryChart';
import WorkoutTimeChart from '../../../src/components/features/whoop/WorkoutTimeChart';
import '../../../src/styles/globals.css';

const workouts = ['Weightlifting', 'Running', 'Boxing'].map((sport_name, index) => ({
  id: String(index),
  sport_name,
  start_time: `2026-01-0${index + 1}T12:00:00Z`,
  end_time: `2026-01-0${index + 1}T13:00:00Z`,
}));
const monthlyTrainingDays = [{ month: '2026-01', trainingDays: 3, daysInMonth: 31 }];
const recoveries = [20, 50, 80].map((recovery_score, index) => ({
  created_at: `2026-01-0${index + 1}T12:00:00Z`,
  updated_at: `2026-01-0${index + 1}T12:00:00Z`,
  score: { recovery_score, user_calibrating: false, resting_heart_rate: 50, hrv_rmssd_ms: 60 },
}));

createRoot(document.getElementById('charts')!).render(
  <div className="mx-auto max-w-6xl space-y-16 p-6">
    <section aria-label="Heatmap">
      <ActivityHeatmap data={Array.from({ length: 22 }, (_, strain) => ({
        formatted_date: `2026-01-${String(strain + 1).padStart(2, '0')}`, strain,
      }))} />
    </section>
    <section aria-label="Training">
      <TrainingAnalytics workoutData={workouts} monthlyTrainingDays={monthlyTrainingDays} />
    </section>
    <section aria-label="Distribution"><ActivityDistributionChart data={workouts} /></section>
    <section aria-label="Correlation">
      <StrainVsRecoveryChart data={recoveries.map((record, index) => ({
        strain_date: record.created_at, strain: 5 + index * 5, recovery_score: record.score.recovery_score,
      }))} />
    </section>
    <section aria-label="Habits">
      <WeeklyHabitsChart selectedYear={2026} data={[{
        weekStart: '2026-01-05', weekEnd: '2026-01-11', meditationCount: 3, trainingDays: 5,
        avgWakeHour: 7, stdWakeHour: 0.5, avgWorkoutHour: 8, stdWorkoutHour: 0.7,
        avgSleepStartHour: 23, stdSleepStartHour: 0.6,
      }]} />
    </section>
    <section aria-label="Recovery"><RecoveryChart data={recoveries} /></section>
    <section aria-label="Workout times">
      <WorkoutTimeChart goalTime="08:30" data={[
        { date: '2026-01-01', time: '07:30', timeAsMinutes: 450, workoutType: 'Running' },
        { date: '2026-01-02', time: '09:30', timeAsMinutes: 570, workoutType: 'Weightlifting' },
        { date: '2026-01-03', time: '08:00', timeAsMinutes: 480, workoutType: 'Boxing' },
      ]} />
    </section>
  </div>,
);
