import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const PerformanceChart = ({ data, title = "Performance Over Time" }) => {
  const [chartType, setChartType] = useState('line');
  const [selectedMetrics, setSelectedMetrics] = useState({
    inboundDMs: true,
    conversations: true,
    salesBooked: true,
    spend: false
  });

  const toggleMetric = (metric) => {
    setSelectedMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTooltipValue = (value, name) => {
    if (name === 'spend') {
      return [`$${value.toFixed(2)}`, 'Ad Spend'];
    }
    return [value, name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1')];
  };

  const ChartComponent = chartType === 'line' ? LineChart : BarChart;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{title}</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
            >
              Line
            </Button>
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('bar')}
            >
              Bar
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4">
          {Object.entries(selectedMetrics).map(([metric, isSelected]) => (
            <Button
              key={metric}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleMetric(metric)}
              className="text-xs"
            >
              {metric.charAt(0).toUpperCase() + metric.slice(1).replace(/([A-Z])/g, ' $1')}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ChartComponent data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              fontSize={12}
            />
            <YAxis fontSize={12} />
            <Tooltip 
              labelFormatter={(label) => formatDate(label)}
              formatter={formatTooltipValue}
            />
            <Legend />
            
            {selectedMetrics.inboundDMs && (
              chartType === 'line' ? (
                <Line 
                  type="monotone" 
                  dataKey="inboundDMs" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Inbound DMs"
                />
              ) : (
                <Bar dataKey="inboundDMs" fill="#3B82F6" name="Inbound DMs" />
              )
            )}
            
            {selectedMetrics.conversations && (
              chartType === 'line' ? (
                <Line 
                  type="monotone" 
                  dataKey="conversations" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Conversations"
                />
              ) : (
                <Bar dataKey="conversations" fill="#10B981" name="Conversations" />
              )
            )}
            
            {selectedMetrics.salesBooked && (
              chartType === 'line' ? (
                <Line 
                  type="monotone" 
                  dataKey="salesBooked" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  name="Sales Booked"
                />
              ) : (
                <Bar dataKey="salesBooked" fill="#F59E0B" name="Sales Booked" />
              )
            )}
            
            {selectedMetrics.spend && (
              chartType === 'line' ? (
                <Line 
                  type="monotone" 
                  dataKey="spend" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="Ad Spend"
                  yAxisId="right"
                />
              ) : (
                <Bar dataKey="spend" fill="#EF4444" name="Ad Spend" />
              )
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PerformanceChart;

