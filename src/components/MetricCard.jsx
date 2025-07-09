import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MetricCard = ({ 
  title, 
  value, 
  previousValue, 
  format = 'number', 
  icon: Icon,
  trend = null,
  subtitle = null 
}) => {
  const formatValue = (val) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(val);
    } else if (format === 'percentage') {
      return `${parseFloat(val).toFixed(2)}%`;
    } else if (format === 'decimal') {
      return parseFloat(val).toFixed(2);
    } else {
      return new Intl.NumberFormat('en-US').format(val);
    }
  };

  const calculateChange = () => {
    if (!previousValue || previousValue === 0) return null;
    return (((value - previousValue) / previousValue) * 100).toFixed(1);
  };

  const change = calculateChange();
  const isPositive = change > 0;
  const isNegative = change < 0;

  const getTrendIcon = () => {
    if (isPositive) return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
    if (isNegative) return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = () => {
    if (isPositive) return 'text-green-600 dark:text-green-400';
    if (isNegative) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value)}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {change !== null && (
          <div className={`flex items-center text-xs mt-2 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="ml-1">
              {Math.abs(change)}% from last period
            </span>
          </div>
        )}
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">{trend}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;

