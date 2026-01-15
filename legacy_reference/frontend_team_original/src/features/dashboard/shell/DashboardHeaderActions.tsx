import React from 'react';
import { format } from 'date-fns';
import { Calendar, Filter, RefreshCw, Share2 } from 'lucide-react';

export type DashboardFilterOption = {
  key: string;
  label: string;
};

type CalendarSelection = {
  start: string;
  end: string;
};

type Props = {
  filterOptions: readonly DashboardFilterOption[];
  globalDateRange: string;
  setGlobalDateRange: React.Dispatch<React.SetStateAction<any>>;
  globalFilterOpen: boolean;
  setGlobalFilterOpen: React.Dispatch<React.SetStateAction<boolean>>;
  calendarOpen: boolean;
  setCalendarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  calendarSelection: CalendarSelection;
  setCalendarSelection: React.Dispatch<React.SetStateAction<CalendarSelection>>;
  onRefresh: () => void;
  notificationCenter: React.ReactNode;
};

const DashboardHeaderActions: React.FC<Props> = ({
  filterOptions,
  globalDateRange,
  setGlobalDateRange,
  globalFilterOpen,
  setGlobalFilterOpen,
  calendarOpen,
  setCalendarOpen,
  calendarSelection,
  setCalendarSelection,
  onRefresh,
  notificationCenter,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2">
        <button
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700"
          onClick={onRefresh}
        >
          <RefreshCw className="h-4 w-4" /> Refresh mock
        </button>
        <button className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700">
          <Share2 className="h-4 w-4" /> Share
        </button>
      </div>
      <div className="relative">
        <button
          className="inline-flex items-center px-4 py-2 rounded-full bg-white shadow-md text-sm font-medium text-gray-800 hover:shadow-lg transition"
          onClick={() => setGlobalFilterOpen((prev) => !prev)}
        >
          <Filter className="h-4 w-4 mr-2" />
          {filterOptions.find((option) => option.key === globalDateRange)?.label || 'Filter'}
        </button>
        {globalFilterOpen && (
          <div className="absolute right-0 mt-2 w-64 rounded-3xl shadow-2xl z-30 theme-panel-soft p-3 space-y-2">
            {filterOptions.map((option) => {
              const isActive = globalDateRange === option.key;
              return (
                <button
                  key={option.key}
                  onClick={() => {
                    setGlobalDateRange(option.key as any);
                    setGlobalFilterOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors theme-text"
                  style={
                    isActive
                      ? { backgroundColor: 'var(--accent-color)', color: '#ffffff' }
                      : undefined
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="relative">
        <button
          className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white p-3 text-gray-700 shadow-sm hover:shadow-md transition"
          onClick={() => setCalendarOpen((prev) => !prev)}
          aria-label="Open calendar"
        >
          <Calendar className="h-5 w-5" />
        </button>
        {calendarOpen && (
          <div className="absolute right-0 mt-2 w-72 rounded-3xl shadow-2xl space-y-4 z-30 theme-panel-soft p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold theme-text">Select date range</p>
              <button
                className="text-xs theme-muted hover:opacity-80"
                onClick={() => setCalendarOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] uppercase theme-muted">From</label>
                <div className="relative mt-1">
                  <input
                    type="date"
                    value={calendarSelection.start}
                    onChange={(event) =>
                      setCalendarSelection((prev) => ({ ...prev, start: event.target.value }))
                    }
                    className="date-input w-full rounded-xl px-3 py-2 pr-10 text-sm"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      border: '1px solid var(--theme-border)',
                      color: 'var(--theme-text)',
                    }}
                  />
                  <Calendar
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 cursor-pointer"
                    style={{ color: '#ffffff' }}
                    onClick={(event) => {
                      const input = event.currentTarget.previousElementSibling as HTMLInputElement | null;
                      if (input) {
                        const anyInput = input as any;
                        if (typeof anyInput.showPicker === 'function') {
                          anyInput.showPicker();
                        } else {
                          input.focus();
                          input.click();
                        }
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] uppercase theme-muted">To</label>
                <div className="relative mt-1">
                  <input
                    type="date"
                    value={calendarSelection.end}
                    onChange={(event) =>
                      setCalendarSelection((prev) => ({ ...prev, end: event.target.value }))
                    }
                    className="date-input w-full rounded-xl px-3 py-2 pr-10 text-sm"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      border: '1px solid var(--theme-border)',
                      color: 'var(--theme-text)',
                    }}
                  />
                  <Calendar
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 cursor-pointer"
                    style={{ color: '#ffffff' }}
                    onClick={(event) => {
                      const input = event.currentTarget.previousElementSibling as HTMLInputElement | null;
                      if (input) {
                        const anyInput = input as any;
                        if (typeof anyInput.showPicker === 'function') {
                          anyInput.showPicker();
                        } else {
                          input.focus();
                          input.click();
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            {calendarSelection.start && calendarSelection.end ? (
              <p className="text-xs theme-muted">
                Showing data for {format(new Date(calendarSelection.start), 'dd MMM yyyy')} –{' '}
                {format(new Date(calendarSelection.end), 'dd MMM yyyy')}
              </p>
            ) : (
              <p className="text-xs theme-muted">Select a start and end date to filter dashboard metrics.</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                className="text-xs font-semibold theme-muted hover:opacity-80"
                onClick={() => {
                  setCalendarSelection({ start: '', end: '' });
                  setCalendarOpen(false);
                }}
              >
                Clear
              </button>
              <button
                className="rounded-full text-base font-bold px-6 py-3"
                style={{ backgroundColor: 'var(--accent-color)', color: '#ffffff' }}
                onClick={() => setCalendarOpen(false)}
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
      {notificationCenter}
    </div>
  );
};

export default DashboardHeaderActions;
