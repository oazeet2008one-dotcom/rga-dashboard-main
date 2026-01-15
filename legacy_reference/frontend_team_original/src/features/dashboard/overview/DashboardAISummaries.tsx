import React, { forwardRef } from 'react';

type Props = {
  themePanelClass: string;
};

const DashboardAISummaries = forwardRef<HTMLDivElement, Props>(({ themePanelClass }, ref) => {
  return (
    <div
      ref={ref}
      className={`${themePanelClass} shadow-sm hover:shadow-lg transition-all duration-300`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[24px] font-bold theme-text">AI summaries</p>
          <p className="text-[18px] theme-muted">Core metrics overview</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95">
          View all
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="theme-panel-soft rounded-2xl p-4 space-y-2 hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase theme-muted group-hover:text-blue-400 transition-colors">Total Revenue</p>
            <span className="text-xs font-semibold text-blue-400 group-hover:scale-110 transition-transform">+15.3%</span>
          </div>
          <p className="text-[18px] font-bold theme-text group-hover:text-blue-300 transition-colors">THB 2.45M</p>
          <p className="text-xs theme-muted">From last period</p>
        </div>

        <div className="theme-panel-soft rounded-2xl p-4 space-y-2 hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase theme-muted group-hover:text-emerald-300 transition-colors">Total Orders</p>
            <span className="text-xs text-emerald-300 font-semibold group-hover:scale-110 transition-transform">+8.2%</span>
          </div>
          <p className="text-[18px] font-bold theme-text group-hover:text-emerald-200 transition-colors">1,284</p>
          <p className="text-xs theme-muted">From last period</p>
        </div>

        <div className="theme-panel-soft rounded-2xl p-4 space-y-2 hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase theme-muted group-hover:text-purple-300 transition-colors">Avg Order Value</p>
            <span className="text-xs text-purple-300 font-semibold group-hover:scale-110 transition-transform">+6.8%</span>
          </div>
          <p className="text-[18px] font-bold theme-text group-hover:text-purple-200 transition-colors">THB 1,908</p>
          <p className="text-xs theme-muted">From last period</p>
        </div>

        <div className="theme-panel-soft rounded-2xl p-4 space-y-2 hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase theme-muted group-hover:text-orange-300 transition-colors">Conversion Rate</p>
            <span className="text-xs text-orange-300 font-semibold group-hover:scale-110 transition-transform">+2.1%</span>
          </div>
          <p className="text-[18px] font-bold theme-text group-hover:text-orange-200 transition-colors">4.8%</p>
          <p className="text-xs theme-muted">From last period</p>
        </div>
      </div>
    </div>
  );
});

DashboardAISummaries.displayName = 'DashboardAISummaries';

export default DashboardAISummaries;
