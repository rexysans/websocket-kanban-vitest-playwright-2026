import React, { useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = {
  todo: '#6366f1',
  inProgress: '#f59e0b',
  done: '#10b981'
};

function TaskProgressChart({ tasks }) {
  const chartData = useMemo(() => {
    const statusCounts = {
      todo: 0,
      inProgress: 0,
      done: 0
    };

    tasks.forEach(task => {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
    });

    const barData = [
      { name: 'To Do', count: statusCounts.todo, fill: COLORS.todo },
      { name: 'In Progress', count: statusCounts.inProgress, fill: COLORS.inProgress },
      { name: 'Done', count: statusCounts.done, fill: COLORS.done }
    ];

    const pieData = [
      { name: 'To Do', value: statusCounts.todo },
      { name: 'In Progress', value: statusCounts.inProgress },
      { name: 'Done', value: statusCounts.done }
    ];

    const total = tasks.length;
    const completionPercentage = total > 0 ? Math.round((statusCounts.done / total) * 100) : 0;

    return { barData, pieData, completionPercentage, total };
  }, [tasks]);

  return (
    <div className="progress-chart-container">
      <div className="chart-header">
        📊 Task Progress Overview
        <div style={{ fontSize: '1rem', color: '#94a3b8', marginTop: '0.5rem' }}>
          {chartData.total} total tasks • {chartData.completionPercentage}% completed
        </div>
      </div>

      <div className="charts-grid">
        {/* Bar Chart - Task Distribution */}
        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#e2e8f0' }}>
            Task Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData.barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  background: '#131829',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  borderRadius: '8px',
                  color: '#e2e8f0'
                }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {chartData.barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Completion Percentage */}
        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#e2e8f0' }}>
            Completion Status
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData.pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => 
                  percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#131829',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  borderRadius: '8px',
                  color: '#e2e8f0'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default TaskProgressChart;
