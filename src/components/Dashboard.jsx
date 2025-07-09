import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  DollarSign, 
  Users, 
  TrendingUp,
  RefreshCw,
  Download,
  Target,
  Upload,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

import MetricCard from './MetricCard';
import EditableDataTable from './EditableDataTable';
import DataInput from './DataInput';
import CampaignTable from './CampaignTable';
import CSVImport from './CSVImport';
import CampaignDetail from './CampaignDetail';
import ThemeToggle from './ThemeToggle';
import UserAuth from './UserAuth';
import { sampleData } from '../data/sampleData';
import { dataManager } from '../lib/dataManager';
import { userManager } from '../lib/userManager';

// Helper function to calculate current metrics from daily data
const calculateMetricsFromDailyData = (dailyData) => {
  if (!dailyData || dailyData.length === 0) return sampleData.currentMetrics;
  
  const totals = dailyData.reduce((acc, day) => ({
    inboundDMs: acc.inboundDMs + (day.inboundDMs || 0),
    totalSpend: acc.totalSpend + (day.spend || day.activeSpend || 0),
    meetings: acc.meetings + (day.meetings || 0),
    offersMade: acc.offersMade + (day.offersMade || 0),
    closes: acc.closes + (day.closes || 0),
    cashCollected: acc.cashCollected + (day.cashCollected || 0),
    revenue: acc.revenue + (day.revenue || day.totalRevenue || 0),
    recurringRevenue: acc.recurringRevenue + (day.recurringRevenue || 0),
    newRevenue: acc.newRevenue + (day.newRevenue || 0),
    totalRevenue: acc.totalRevenue + (day.totalRevenue || 0),
    impressions: acc.impressions + (day.impressions || day.activeImpressions || 0),
    clicks: acc.clicks + (day.clicks || day.activeClicks || 0),
    reach: Math.max(acc.reach, day.reach || day.activeReach || 0)
  }), {
    inboundDMs: 0, totalSpend: 0, meetings: 0, offersMade: 0, closes: 0,
    cashCollected: 0, revenue: 0, recurringRevenue: 0, newRevenue: 0, totalRevenue: 0,
    impressions: 0, clicks: 0, reach: 0
  });

  return {
    ...totals,
    salesBooked: totals.closes, // Keep for backward compatibility
    costPerDM: totals.inboundDMs > 0 ? totals.totalSpend / totals.inboundDMs : 0,
    costPerAcquisition: totals.closes > 0 ? totals.totalSpend / totals.closes : 0,
    costPerMeeting: totals.meetings > 0 ? totals.totalSpend / totals.meetings : 0,
    ctr: totals.impressions > 0 ? parseFloat(((totals.clicks / totals.impressions) * 100).toFixed(2)) : 0,
    meetingToCloseRate: totals.meetings > 0 ? parseFloat(((totals.closes / totals.meetings) * 100).toFixed(2)) : 0,
    dmToMeetingRate: totals.inboundDMs > 0 ? parseFloat(((totals.meetings / totals.inboundDMs) * 100).toFixed(2)) : 0
  };
};

const Dashboard = () => {
  const [data, setData] = useState(sampleData);
  const [dateRange, setDateRange] = useState('last30days');
  const [historicalData, setHistoricalData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [showAllCampaigns, setShowAllCampaigns] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [currentUser, setCurrentUser] = useState(userManager.getCurrentUser());

  // Load data when user changes or component mounts
  useEffect(() => {
    if (currentUser) {
      try {
        const persistentData = dataManager.loadData();
        
        if (persistentData.dailyData && persistentData.dailyData.length > 0) {
          // Merge persistent daily data with sample data
          const mergedData = {
            ...sampleData,
            dailyData: persistentData.dailyData,
            currentMetrics: calculateMetricsFromDailyData(persistentData.dailyData)
          };
          setData(mergedData);
        } else {
          // Reset to sample data for new user
          setData(sampleData);
        }
        
        // Data loaded for user successfully
      } catch (error) {
        console.error('Error loading persistent data:', error);
      }
    }
  }, [currentUser]);

  // Handle user authentication changes
  const handleAuthChange = (user) => {
    setCurrentUser(user);
    if (user) {
      // User logged in - data will load via useEffect
      setLastUpdated(new Date());
    } else {
      // User logged out - reset to sample data
      setData(sampleData);
    }
  };

  // Filter data based on date range
  const getFilteredData = () => {
    const now = new Date();
    let startDate;
    let endDate = now;
    
    switch (dateRange) {
      case 'last24hours':
        // Show only the most recent day with data (yesterday: 2025-06-23)
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        endDate = new Date(startDate); // Only include yesterday
        break;
      case 'last7days':
        // Include last 7 complete days
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 6);
        break;
      case 'last30days':
        // Include last 30 complete days
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 29);
        break;
      case 'monthToDate':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last3months':
        // Include last 90 complete days
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 89);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 29);
    }
    
    // Filter daily data by date range
    const filteredDailyData = data.dailyData.filter(item => {
      const itemDateStr = item.date; // YYYY-MM-DD format
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      return itemDateStr >= startDateStr && itemDateStr <= endDateStr;
    });

    // Also filter campaigns by date range if we have campaign data
    let filteredCampaigns = data.campaigns || [];
    let filteredAllCampaigns = data.allCampaigns || data.campaigns || [];
    
    if (data.campaigns && data.campaigns.length > 0) {
      // For imported CSV data, we need to recalculate campaign metrics based on date range
      // This is more complex and would require re-aggregating from daily data
      filteredCampaigns = data.campaigns;
      filteredAllCampaigns = data.allCampaigns || data.campaigns;
    }
    
    // Calculate metrics from filtered daily data
    // Check if we have new CSVProcessor format (activeSpend/allSpend) or old format (spend)
    const hasNewFormat = filteredDailyData.length > 0 && filteredDailyData[0].hasOwnProperty('activeSpend');
    
    // Dashboard filtering completed

    const allCampaignsFiltered = {
      totalSpend: hasNewFormat 
        ? filteredDailyData.reduce((sum, item) => sum + (item.allSpend || 0), 0)
        : filteredDailyData.reduce((sum, item) => sum + (item.spend || 0), 0),
      inboundDMs: hasNewFormat
        ? filteredDailyData.reduce((sum, item) => sum + (item.allDMs || 0), 0)
        : filteredDailyData.reduce((sum, item) => sum + (item.inboundDMs || 0), 0),
      meetings: filteredDailyData.reduce((sum, item) => sum + (item.meetings || 0), 0),
      shows: filteredDailyData.reduce((sum, item) => sum + (item.shows || 0), 0),
      offersMade: filteredDailyData.reduce((sum, item) => sum + (item.offersMade || 0), 0),
      closes: filteredDailyData.reduce((sum, item) => sum + (item.closes || 0), 0),
      cashCollected: filteredDailyData.reduce((sum, item) => sum + (item.cashCollected || 0), 0),
      recurringRevenue: filteredDailyData.reduce((sum, item) => sum + (item.recurringRevenue || 0), 0),
      newRevenue: filteredDailyData.reduce((sum, item) => sum + (item.newRevenue || 0), 0),
      totalRevenue: filteredDailyData.reduce((sum, item) => sum + (item.totalRevenue || 0), 0),
      impressions: hasNewFormat
        ? filteredDailyData.reduce((sum, item) => sum + (item.allImpressions || 0), 0)
        : filteredDailyData.reduce((sum, item) => sum + (item.impressions || 0), 0),
      clicks: hasNewFormat
        ? filteredDailyData.reduce((sum, item) => sum + (item.allClicks || 0), 0)
        : filteredDailyData.reduce((sum, item) => sum + (item.clicks || 0), 0),
      reach: hasNewFormat
        ? Math.max(...(filteredDailyData.map(item => item.allReach || 0).concat([0])))
        : Math.max(...(filteredDailyData.map(item => item.reach || 0).concat([0])))
    };

    // Calculate active campaigns metrics
    const activeCampaignsFiltered = hasNewFormat ? {
      totalSpend: filteredDailyData.reduce((sum, item) => sum + (item.activeSpend || 0), 0),
      inboundDMs: filteredDailyData.reduce((sum, item) => sum + (item.activeDMs || 0), 0),
      meetings: filteredDailyData.reduce((sum, item) => sum + (item.meetings || 0), 0),
      shows: filteredDailyData.reduce((sum, item) => sum + (item.shows || 0), 0),
      offersMade: filteredDailyData.reduce((sum, item) => sum + (item.offersMade || 0), 0),
      closes: filteredDailyData.reduce((sum, item) => sum + (item.closes || 0), 0),
      cashCollected: filteredDailyData.reduce((sum, item) => sum + (item.cashCollected || 0), 0),
      recurringRevenue: filteredDailyData.reduce((sum, item) => sum + (item.recurringRevenue || 0), 0),
      newRevenue: filteredDailyData.reduce((sum, item) => sum + (item.newRevenue || 0), 0),
      totalRevenue: filteredDailyData.reduce((sum, item) => sum + (item.totalRevenue || 0), 0),
      impressions: filteredDailyData.reduce((sum, item) => sum + (item.activeImpressions || 0), 0),
      clicks: filteredDailyData.reduce((sum, item) => sum + (item.activeClicks || 0), 0),
      reach: Math.max(...(filteredDailyData.map(item => item.activeReach || 0).concat([0])))
    } : { ...allCampaignsFiltered };

    // Add calculated metrics to both
    [allCampaignsFiltered, activeCampaignsFiltered].forEach(metrics => {
      metrics.salesBooked = metrics.closes; // Keep for backward compatibility
      metrics.costPerDM = metrics.inboundDMs > 0 ? metrics.totalSpend / metrics.inboundDMs : 0;
      metrics.costPerAcquisition = metrics.closes > 0 ? metrics.totalSpend / metrics.closes : 0;
      metrics.costPerMeeting = metrics.meetings > 0 ? metrics.totalSpend / metrics.meetings : 0;
      metrics.ctr = metrics.impressions > 0 ? parseFloat(((metrics.clicks / metrics.impressions) * 100).toFixed(2)) : 0;
      metrics.meetingToCloseRate = metrics.meetings > 0 ? parseFloat(((metrics.closes / metrics.meetings) * 100).toFixed(2)) : 0;
      metrics.dmToMeetingRate = metrics.inboundDMs > 0 ? parseFloat(((metrics.meetings / metrics.inboundDMs) * 100).toFixed(2)) : 0;
    });

    // Data filtering completed for date range

    const result = {
      ...data,
      dailyData: filteredDailyData,
      campaigns: filteredCampaigns,
      allCampaigns: filteredAllCampaigns,
      currentMetrics: {
        ...data.currentMetrics,
        ...activeCampaignsFiltered
      },
      allCampaignsMetrics: {
        ...data.allCampaignsMetrics,
        ...allCampaignsFiltered
      }
    };

    return result;
  };

  // Save data using enhanced data manager
  const saveData = (newData) => {
    setData(prevData => ({
      ...prevData,
      ...newData
    }));
  };

  const handleDataSubmit = (newEntry) => {
    try {
      if (newEntry.isEdit) {
        // Edit mode: replace the values (or delete if isDelete is true)
        const { dailyData } = dataManager.saveManualEntry(newEntry.date, {
          meetings: newEntry.meetings,
          shows: newEntry.shows,
          offersMade: newEntry.offersMade,
          closes: newEntry.closes,
          cashCollected: newEntry.cashCollected,
          revenue: newEntry.revenue,
          recurringRevenue: newEntry.recurringRevenue || 0,
          newRevenue: newEntry.newRevenue,
          totalRevenue: newEntry.totalRevenue
        });

        // Update component state
        const updatedData = {
          dailyData: dailyData,
          currentMetrics: calculateMetricsFromDailyData(dailyData)
        };

        saveData(updatedData);
        setLastUpdated(new Date());
        
        // Manual entry updated successfully
      } else {
        // Add mode: add to existing values (additive behavior)
        const existingData = dataManager.getDailyData();
        const existingEntry = existingData.find(entry => entry.date === newEntry.date);
        
        const dataToSave = {
          meetings: (existingEntry?.meetings || 0) + (newEntry.meetings || 0),
          offersMade: (existingEntry?.offersMade || 0) + (newEntry.offersMade || 0),
          closes: (existingEntry?.closes || 0) + (newEntry.closes || 0),
          cashCollected: (existingEntry?.cashCollected || 0) + (newEntry.cashCollected || 0),
          revenue: (existingEntry?.revenue || existingEntry?.totalRevenue || 0) + (newEntry.revenue || 0),
          recurringRevenue: newEntry.recurringRevenue || 0,
          newRevenue: (existingEntry?.revenue || existingEntry?.totalRevenue || 0) + (newEntry.revenue || 0),
          totalRevenue: (existingEntry?.revenue || existingEntry?.totalRevenue || 0) + (newEntry.revenue || 0)
        };

        const { dailyData } = dataManager.saveManualEntry(newEntry.date, dataToSave);

        // Update component state
        const updatedData = {
          dailyData: dailyData,
          currentMetrics: calculateMetricsFromDailyData(dailyData)
        };

        saveData(updatedData);
        setLastUpdated(new Date());
        
        // Manual entry added successfully
      }
    } catch (error) {
      console.error('Error saving manual entry:', error);
    }
  };

  const handleRefresh = () => {
    // In a real app, this would fetch fresh data from Facebook API
    setLastUpdated(new Date());
  };

  const handleCSVImport = async (importedData) => {
    try {
      // Use data manager to bulk import daily data
      const updatedDailyData = dataManager.bulkImportDailyData(importedData.dailyData, true);
      
      // Update component state with all imported data
      const mergedData = {
        ...importedData,
        dailyData: updatedDailyData,
        currentMetrics: calculateMetricsFromDailyData(updatedDailyData),
        previousMetrics: data.previousMetrics, // Keep previous for comparison
      };

      // Update funnel data with recalculated metrics
      const currentMetrics = mergedData.currentMetrics;
      mergedData.funnelData = [
        { stage: "Impressions", value: currentMetrics.impressions, percentage: 100 },
        { 
          stage: "Clicks", 
          value: currentMetrics.clicks, 
          percentage: currentMetrics.impressions > 0 
            ? (currentMetrics.clicks / currentMetrics.impressions) * 100 
            : 0 
        },
        { 
          stage: "Inbound DMs", 
          value: currentMetrics.inboundDMs, 
          percentage: currentMetrics.clicks > 0 
            ? (currentMetrics.inboundDMs / currentMetrics.clicks) * 100 
            : 0 
        },
        { 
          stage: "Meetings", 
          value: currentMetrics.meetings, 
          percentage: currentMetrics.inboundDMs > 0 
            ? (currentMetrics.meetings / currentMetrics.inboundDMs) * 100 
            : 0 
        },
        { 
          stage: "Closes", 
          value: currentMetrics.closes, 
          percentage: currentMetrics.meetings > 0 
            ? (currentMetrics.closes / currentMetrics.meetings) * 100 
            : 0 
        }
      ];

      saveData(mergedData);
      setLastUpdated(new Date());
      
      // CSV data imported successfully
      
    } catch (error) {
      console.error('Error importing CSV data:', error);
      throw error;
    }
  };

  const handleExport = () => {
    // Export full backup using data manager
    dataManager.exportData();
  };

  const { 
    campaignDailyData
  } = data;

  // Get filtered data based on date range
  const filteredData = getFilteredData();
  
  // Choose metrics based on toggle
  const activeMetrics = showAllCampaigns ? (filteredData.allCampaignsMetrics || filteredData.currentMetrics) : filteredData.currentMetrics;
  const activeCampaigns = showAllCampaigns ? (filteredData.allCampaigns || filteredData.campaigns) : filteredData.campaigns;

  // Calculate derived metrics
  const dmToMeetingRate = activeMetrics.dmToMeetingRate || 0;
  const meetingToCloseRate = activeMetrics.meetingToCloseRate || 0;
  const overallConversionRate = activeMetrics.inboundDMs > 0 ? parseFloat(((activeMetrics.closes / activeMetrics.inboundDMs) * 100).toFixed(2)) : 0;

  // Show authentication screen if no user is logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-foreground">
              Instagram DM Ads Dashboard
            </h1>
            <p className="text-muted-foreground">
              Please login or create an account to access your personalized dashboard
            </p>
          </div>
          <UserAuth onAuthChange={handleAuthChange} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Instagram DM Ads Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your service-based business performance
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-1 border border-border rounded-md text-sm bg-background text-foreground"
            >
              <option value="last24hours">Last 24 Hours</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="monthToDate">Month to Date</option>
              <option value="last3months">Last 3 Months</option>
            </select>
            <ThemeToggle />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAllCampaigns(!showAllCampaigns)}
              className={showAllCampaigns ? "bg-blue-50 border-blue-200" : ""}
            >
              {showAllCampaigns ? <ToggleRight className="h-4 w-4 mr-1" /> : <ToggleLeft className="h-4 w-4 mr-1" />}
              {showAllCampaigns ? "All Campaigns" : "Active Only"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowCSVImport(true)}>
              <Upload className="h-4 w-4 mr-1" />
              Import CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />
              Backup
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  dataManager.importData(file).then(() => {
                    // Reload data after import
                    const persistentData = dataManager.loadData();
                    const mergedData = {
                      ...sampleData,
                      dailyData: persistentData.dailyData,
                      currentMetrics: calculateMetricsFromDailyData(persistentData.dailyData)
                    };
                    setData(mergedData);
                    setLastUpdated(new Date());
                    // Backup restored successfully
                  }).catch((error) => {
                    console.error('Error restoring backup:', error);
                  });
                }
                e.target.value = ''; // Reset file input
              }}
              style={{ display: 'none' }}
              id="backup-restore"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => document.getElementById('backup-restore')?.click()}
            >
              <Upload className="h-4 w-4 mr-1" />
              Restore
            </Button>
            <UserAuth onAuthChange={handleAuthChange} />
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-sm text-muted-foreground">
          Last updated: {lastUpdated.toLocaleString()}
        </div>

        {/* Primary Metric - Cost Per Acquisition */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-1">
            <MetricCard
              title="Cost Per Acquisition (CPA)"
              value={activeMetrics.costPerAcquisition || 0}
              format="currency"
              icon={Target}
              subtitle="The lifeblood of your ads"
              className="border-2 border-green-500 bg-green-50"
              large={true}
            />
          </div>
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <MetricCard
              title="Total Ad Spend"
              value={activeMetrics.totalSpend}
              format="currency"
              icon={DollarSign}
              subtitle={`${dateRange.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
            />
            <MetricCard
              title="Closes"
              value={activeMetrics.closes || 0}
              icon={TrendingUp}
              subtitle={`${overallConversionRate.toFixed(2)}% overall conversion rate`}
            />
          </div>
        </div>

        {/* Supporting Funnel Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <MetricCard
            title="Inbound DMs"
            value={activeMetrics.inboundDMs || 0}
            icon={MessageSquare}
            subtitle="Lead generation"
          />
          <MetricCard
            title="Meetings"
            value={activeMetrics.meetings || 0}
            icon={Users}
            subtitle={`${dmToMeetingRate.toFixed(2)}% booking ratio`}
          />
          <MetricCard
            title="Shows"
            value={activeMetrics.shows || 0}
            icon={Users}
            subtitle={`${activeMetrics.showRate ? activeMetrics.showRate.toFixed(2) : 0}% show rate`}
          />
          <MetricCard
            title="Offers Made"
            value={activeMetrics.offersMade || 0}
            icon={TrendingUp}
            subtitle={`${activeMetrics.meetings > 0 ? ((activeMetrics.offersMade / activeMetrics.meetings) * 100).toFixed(2) : 0}% offer rate`}
          />
          <MetricCard
            title="Close Rate"
            value={meetingToCloseRate}
            format="percentage"
            icon={Target}
            subtitle="Meeting to close %"
          />
          <MetricCard
            title="Cash Collected"
            value={activeMetrics.cashCollected || 0}
            format="currency"
            icon={DollarSign}
            subtitle="Total cash collected"
          />
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetricCard
            title="Total Revenue"
            value={activeMetrics.revenue || activeMetrics.totalRevenue || 0}
            format="currency"
            icon={DollarSign}
            subtitle="Full deal value"
          />
          <MetricCard
            title="ROAS (Return on Ad Spend)"
            value={activeMetrics.totalSpend > 0 ? (activeMetrics.revenue || activeMetrics.totalRevenue || 0) / activeMetrics.totalSpend : 0}
            format="decimal"
            icon={TrendingUp}
            subtitle={`${activeMetrics.totalSpend > 0 ? ((activeMetrics.revenue || activeMetrics.totalRevenue || 0) / activeMetrics.totalSpend).toFixed(1) : 0}x return`}
          />
        </div>


        {/* Manual Data Entry - Full Width */}
        <div className="w-full">
          <DataInput onDataSubmit={handleDataSubmit} />
        </div>

        {/* Campaign Performance Table - Full Width */}
        <div className="w-full">
          <CampaignTable 
            campaigns={activeCampaigns} 
            onCampaignClick={(campaign) => setSelectedCampaign(campaign)}
            showAllCampaigns={showAllCampaigns}
          />
        </div>

        {/* Editable Data Table */}
        <div className="w-full">
          <EditableDataTable 
            data={filteredData.dailyData} 
            onDataUpdate={handleDataSubmit}
            title={`Editable Manual Entry Data - ${dateRange.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
          />
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-4">
          <p>
            This dashboard tracks Instagram DM ad performance for service-based businesses.
            <br />
            Import your Facebook Ads CSV data to replace sample data with real metrics.
          </p>
        </div>
      </div>

      {/* CSV Import Modal */}
      {showCSVImport && (
        <CSVImport 
          onDataImport={handleCSVImport}
          onClose={() => setShowCSVImport(false)}
        />
      )}

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <CampaignDetail 
          campaign={selectedCampaign}
          campaignDailyData={campaignDailyData ? campaignDailyData[selectedCampaign.name] || [] : []}
          onClose={() => setSelectedCampaign(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;

