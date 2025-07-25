// Empty data structure for new Instagram DM Ads Dashboard users
export const emptyData = {
  // Current period metrics - all zeros for new users
  currentMetrics: {
    inboundDMs: 0,
    totalSpend: 0,
    costPerDM: 0,
    salesBooked: 0,
    conversations: 0,
    meetings: 0,
    offersMade: 0,
    closes: 0,
    newCloses: 0,
    recurringCloses: 0,
    cashCollected: 0,
    recurringRevenue: 0,
    newRevenue: 0,
    totalRevenue: 0,
    impressions: 0,
    reach: 0,
    clicks: 0,
    ctr: 0,
    costPerAcquisition: 0,
    costPerMeeting: 0,
    meetingToCloseRate: 0,
    newClientCloseRate: 0,
    dmToMeetingRate: 0
  },

  // Previous period for comparison - all zeros for new users
  previousMetrics: {
    inboundDMs: 0,
    totalSpend: 0,
    costPerDM: 0,
    salesBooked: 0,
    conversations: 0,
    impressions: 0,
    reach: 0,
    clicks: 0,
    ctr: 0
  },

  // Empty daily performance data
  dailyData: [],

  // Empty campaign performance data
  campaigns: [],

  // Empty conversion funnel data
  funnelData: [
    { stage: "Impressions", value: 0, percentage: 0 },
    { stage: "Clicks", value: 0, percentage: 0 },
    { stage: "Inbound DMs", value: 0, percentage: 0 },
    { stage: "Meetings", value: 0, percentage: 0 },
    { stage: "Closes", value: 0, percentage: 0 }
  ]
};

// Keep the original sample data for demo purposes (can be removed later)
export const sampleData = emptyData;

// Helper functions for data manipulation
export const calculateConversionRate = (conversions, total) => {
  return total > 0 ? ((conversions / total) * 100).toFixed(2) : 0;
};

export const calculatePercentageChange = (current, previous) => {
  return previous > 0 ? (((current - previous) / previous) * 100).toFixed(1) : 0;
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const formatNumber = (number) => {
  return new Intl.NumberFormat('en-US').format(number);
};

