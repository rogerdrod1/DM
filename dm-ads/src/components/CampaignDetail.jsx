import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X,
  Calendar,
  DollarSign,
  MessageSquare,
  TrendingUp,
  BarChart3,
  Target,
  Eye,
  Users
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const CampaignDetail = ({ campaign, onClose, campaignDailyData = [] }) => {
  if (!campaign) return null;

  // Calculate additional metrics
  const totalDays = campaignDailyData.length;
  const activeDays = campaignDailyData.filter(day => day.spend > 0).length;
  const daysWithResults = campaignDailyData.filter(day => day.inboundDMs > 0).length;
  const avgDailySpend = totalDays > 0 ? campaign.spend / totalDays : 0;
  const avgDailyDMs = totalDays > 0 ? campaign.inboundDMs / totalDays : 0;

  // Prepare chart data
  const chartData = campaignDailyData.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    spend: day.spend,
    inboundDMs: day.inboundDMs,
    impressions: day.impressions / 1000, // Scale down for better visualization
    clicks: day.clicks
  }));

  const getStatusBadge = (status) => {
    const config = {
      'Active': { variant: 'default', className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800' },
      'Inactive': { variant: 'secondary', className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100 dark:border-red-800' },
      'Paused': { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100 dark:border-yellow-800' }
    };
    const statusConfig = config[status] || config['Active'];
    
    return (
      <Badge variant={statusConfig.variant} className={statusConfig.className}>
        {status}
      </Badge>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-US').format(number || 0);
  };

  // Calculate cost per DM dynamically
  const calculateCostPerDM = (spend, inboundDMs) => {
    return inboundDMs > 0 ? spend / inboundDMs : 0;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background border rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b p-6 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-foreground">
                {campaign.name}
              </h2>
              {getStatusBadge(campaign.status)}
            </div>
            <p className="text-muted-foreground">Campaign Performance Analysis</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Spend</p>
                    <p className="text-2xl font-bold">{formatCurrency(campaign.spend)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Inbound DMs</p>
                    <p className="text-2xl font-bold">{formatNumber(campaign.inboundDMs)}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Cost per DM</p>
                    <p className="text-2xl font-bold">{formatCurrency(calculateCostPerDM(campaign.spend, campaign.inboundDMs))}</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Impressions</p>
                    <p className="text-2xl font-bold">{formatNumber(campaign.impressions)}</p>
                  </div>
                  <Eye className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Reach</p>
                    <p className="text-xl font-semibold">{formatNumber(campaign.reach)}</p>
                  </div>
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Clicks</p>
                    <p className="text-xl font-semibold">{formatNumber(campaign.clicks)}</p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Days</p>
                    <p className="text-xl font-semibold">{activeDays}/{totalDays}</p>
                  </div>
                  <Calendar className="h-6 w-6 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Result Days</p>
                    <p className="text-xl font-semibold">{daysWithResults}/{totalDays}</p>
                  </div>
                  <BarChart3 className="h-6 w-6 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          {chartData.length > 0 && (
            <div className="space-y-6">
              {/* Daily Spend vs DMs */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Spend vs Inbound DMs</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'spend' ? formatCurrency(value) : formatNumber(value), 
                          name === 'spend' ? 'Spend' : 'Inbound DMs'
                        ]}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="spend" fill="#3B82F6" name="Daily Spend" />
                      <Bar yAxisId="right" dataKey="inboundDMs" fill="#10B981" name="Inbound DMs" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Performance Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        formatter={(value, name) => [
                          formatNumber(value), 
                          name === 'impressions' ? 'Impressions (K)' : 'Clicks'
                        ]}
                      />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="impressions" stroke="#F59E0B" strokeWidth={2} name="Impressions (K)" />
                      <Line yAxisId="right" type="monotone" dataKey="clicks" stroke="#8B5CF6" strokeWidth={2} name="Clicks" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Campaign Stats Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">Performance Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Average Daily Spend:</span>
                      <span className="font-medium">{formatCurrency(avgDailySpend)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Average Daily DMs:</span>
                      <span className="font-medium">{avgDailyDMs.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Click-through Rate:</span>
                      <span className="font-medium">
                        {campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">DM Conversion Rate:</span>
                      <span className="font-medium">
                        {campaign.clicks > 0 ? ((campaign.inboundDMs / campaign.clicks) * 100).toFixed(2) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">Campaign Activity</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Days Tracked:</span>
                      <span className="font-medium">{totalDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Days with Spend:</span>
                      <span className="font-medium">{activeDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Days with Results:</span>
                      <span className="font-medium">{daysWithResults}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Success Rate:</span>
                      <span className="font-medium">
                        {activeDays > 0 ? ((daysWithResults / activeDays) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Breakdown Table */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Daily Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Spend</th>
                        <th className="pb-2">DMs</th>
                        <th className="pb-2">Impressions</th>
                        <th className="pb-2">Clicks</th>
                        <th className="pb-2">Cost/DM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {campaignDailyData.map((day, index) => (
                        <tr key={index} className="hover:bg-muted/50">
                          <td className="py-2">{new Date(day.date).toLocaleDateString()}</td>
                          <td className="py-2">{formatCurrency(day.spend)}</td>
                          <td className="py-2 font-medium">{day.inboundDMs}</td>
                          <td className="py-2">{formatNumber(day.impressions)}</td>
                          <td className="py-2">{formatNumber(day.clicks)}</td>
                          <td className="py-2">
                            {day.inboundDMs > 0 ? formatCurrency(day.spend / day.inboundDMs) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignDetail;