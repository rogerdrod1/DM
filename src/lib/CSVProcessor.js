/**
 * CSV Processor - Cleans and transforms Facebook Ads CSV data
 * for the Instagram DM Ads Dashboard
 */

export class CSVProcessor {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.stats = {
      totalRows: 0,
      validRows: 0,
      summaryRowsRemoved: 0,
      boostedPostsRemoved: 0,
      invalidRowsRemoved: 0
    };
  }

  /**
   * Main processing function
   * @param {string} csvText - Raw CSV content
   * @returns {Object} - Processed data ready for dashboard
   */
  async processCsv(csvText) {
    try {
      // Reset state
      this.errors = [];
      this.warnings = [];
      this.stats = {
        totalRows: 0,
        validRows: 0,
        summaryRowsRemoved: 0,
        boostedPostsRemoved: 0,
        invalidRowsRemoved: 0
      };

      // Starting CSV processing

      // Step 1: Parse CSV
      const { headers, rows } = this.parseCSV(csvText);
      this.stats.totalRows = rows.length;

      // Step 2: Validate required columns
      this.validateColumns(headers);

      // Step 3: Clean and filter rows
      const cleanRows = this.cleanRows(rows, headers);

      // Step 4: Transform data
      const processedData = this.transformData(cleanRows, headers);

      // CSV processing complete
      
      return {
        success: true,
        data: processedData,
        stats: this.stats,
        errors: this.errors,
        warnings: this.warnings
      };

    } catch (error) {
      console.error('❌ CSV processing failed:', error);
      return {
        success: false,
        error: error.message,
        stats: this.stats,
        errors: this.errors,
        warnings: this.warnings
      };
    }
  }

  /**
   * Parse CSV text into headers and rows
   */
  parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    // Parse CSV with proper quote handling
    const parseCSVLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"';
            i++; // Skip next quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, '').trim());
    const rows = lines.slice(1).map(line => {
      const values = parseCSVLine(line);
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] ? values[index].replace(/"/g, '').trim() : '';
      });
      return row;
    });

    return { headers, rows };
  }

  /**
   * Validate that required columns exist
   */
  validateColumns(headers) {
    const requiredColumns = [
      'Reporting starts',
      'Campaign name', 
      'Campaign Delivery',
      'Amount spent (USD)',
      'Results',
      'Result indicator'
    ];

    const missingColumns = requiredColumns.filter(col => 
      !headers.some(header => header.toLowerCase().includes(col.toLowerCase()))
    );

    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    // Column validation passed
  }

  /**
   * Clean and filter rows
   */
  cleanRows(rows, headers) {
    const cleanRows = [];

    for (const row of rows) {
      const campaignName = row['Campaign name'] || '';
      const campaignDelivery = row['Campaign Delivery'] || '';
      const attributionSetting = row['Attribution setting'] || '';
      const date = row['Reporting starts'] || '';
      const spend = row['Amount spent (USD)'] || '';

      // Skip invalid rows
      if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        this.stats.invalidRowsRemoved++;
        this.warnings.push(`Skipped row with invalid date: ${date}`);
        continue;
      }

      // Skip summary rows
      if (!campaignName || 
          campaignName.trim() === '' || 
          campaignDelivery === '0' || 
          attributionSetting === 'Multiple attribution settings') {
        this.stats.summaryRowsRemoved++;
        continue;
      }

      // Skip boosted posts
      if (campaignName.startsWith('Instagram post:')) {
        this.stats.boostedPostsRemoved++;
        continue;
      }

      // Validate spend
      const spendFloat = parseFloat(spend);
      if (isNaN(spendFloat) || spendFloat < 0) {
        row['Amount spent (USD)'] = '0';
      }

      cleanRows.push(row);
    }

    this.stats.validRows = cleanRows.length;
    // Data cleaning completed
    
    return cleanRows;
  }

  /**
   * Transform cleaned data into dashboard format
   */
  transformData(cleanRows, headers) {
    // Create maps for aggregation
    const dailyDataMap = new Map();
    const activeCampaignMap = new Map();
    const allCampaignMap = new Map();

    // Column mappings
    const getColumn = (row, patterns) => {
      for (const pattern of patterns) {
        const col = headers.find(h => h.toLowerCase().includes(pattern.toLowerCase()));
        if (col && row[col]) return row[col];
      }
      return '';
    };

    // Process each row
    for (const row of cleanRows) {
      const date = row['Reporting starts'];
      const campaignName = row['Campaign name'];
      const campaignDelivery = row['Campaign Delivery'] || '';
      const spend = parseFloat(row['Amount spent (USD)'] || 0);
      const results = parseInt(row['Results'] || 0);
      const resultIndicator = row['Result indicator'] || '';
      const impressions = parseInt(getColumn(row, ['Impressions']) || 0);
      const clicks = parseInt(getColumn(row, ['Link clicks', 'Clicks']) || 0);
      const reach = parseInt(getColumn(row, ['Reach']) || 0);

      // Calculate inbound DMs (messaging conversations only)
      let inboundDMs = 0;
      if (resultIndicator.includes('messaging_conversation_started') && 
          !resultIndicator.includes('link_click')) {
        inboundDMs = results;
      }

      const isActive = campaignDelivery.toLowerCase() === 'active';
      const status = isActive ? 'Active' : 
                   campaignDelivery.toLowerCase() === 'inactive' ? 'Inactive' : 
                   campaignDelivery || 'Unknown';

      // Aggregate daily data
      if (!dailyDataMap.has(date)) {
        dailyDataMap.set(date, {
          date,
          activeSpend: 0,
          allSpend: 0,
          activeDMs: 0,
          allDMs: 0,
          activeImpressions: 0,
          allImpressions: 0,
          activeClicks: 0,
          allClicks: 0,
          activeReach: 0,
          allReach: 0,
          // Manual data preserved
          meetings: 0,
          closes: 0,
          cashCollected: 0,
          recurringRevenue: 0,
          newRevenue: 0,
          totalRevenue: 0
        });
      }

      const daily = dailyDataMap.get(date);
      daily.allSpend += spend;
      daily.allDMs += inboundDMs;
      daily.allImpressions += impressions;
      daily.allClicks += clicks;
      daily.allReach = Math.max(daily.allReach, reach);

      if (isActive) {
        daily.activeSpend += spend;
        daily.activeDMs += inboundDMs;
        daily.activeImpressions += impressions;
        daily.activeClicks += clicks;
        daily.activeReach = Math.max(daily.activeReach, reach);
      }

      // Processing daily data

      // Track campaigns
      if (!allCampaignMap.has(campaignName)) {
        allCampaignMap.set(campaignName, {
          id: allCampaignMap.size + 1,
          name: campaignName,
          status,
          spend: 0,
          inboundDMs: 0,
          impressions: 0,
          reach: 0,
          clicks: 0
        });
      }

      const campaign = allCampaignMap.get(campaignName);
      campaign.spend += spend;
      campaign.inboundDMs += inboundDMs;
      campaign.impressions += impressions;
      campaign.reach = Math.max(campaign.reach, reach);
      campaign.clicks += clicks;

      if (isActive) {
        if (!activeCampaignMap.has(campaignName)) {
          activeCampaignMap.set(campaignName, { ...campaign, spend: 0, inboundDMs: 0, impressions: 0, clicks: 0, reach: 0 });
        }
        const activeCampaign = activeCampaignMap.get(campaignName);
        activeCampaign.spend += spend;
        activeCampaign.inboundDMs += inboundDMs;
        activeCampaign.impressions += impressions;
        activeCampaign.reach = Math.max(activeCampaign.reach, reach);
        activeCampaign.clicks += clicks;
      }
    }

    // Convert to arrays and sort
    const dailyData = Array.from(dailyDataMap.values())
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const activeCampaigns = Array.from(activeCampaignMap.values());
    const allCampaigns = Array.from(allCampaignMap.values());

    // Calculate totals
    const totals = this.calculateTotals(dailyData, activeCampaigns, allCampaigns);

    // Data transformation complete

    return {
      dailyData,
      campaigns: activeCampaigns,
      allCampaigns,
      currentMetrics: totals.active,
      allCampaignsMetrics: totals.all,
      summary: {
        dateRange: {
          start: dailyData[0]?.date || null,
          end: dailyData[dailyData.length - 1]?.date || null
        },
        totalSpend: {
          active: totals.active.totalSpend,
          all: totals.all.totalSpend
        },
        totalDMs: {
          active: totals.active.inboundDMs,
          all: totals.all.inboundDMs
        }
      }
    };
  }

  /**
   * Calculate total metrics
   */
  calculateTotals(dailyData, activeCampaigns, allCampaigns) {
    const activeMetrics = {
      totalSpend: dailyData.reduce((sum, d) => sum + d.activeSpend, 0),
      inboundDMs: dailyData.reduce((sum, d) => sum + d.activeDMs, 0),
      impressions: dailyData.reduce((sum, d) => sum + d.activeImpressions, 0),
      clicks: dailyData.reduce((sum, d) => sum + d.activeClicks, 0),
      reach: Math.max(...dailyData.map(d => d.activeReach).concat([0])),
      meetings: dailyData.reduce((sum, d) => sum + d.meetings, 0),
      closes: dailyData.reduce((sum, d) => sum + d.closes, 0),
      newCloses: dailyData.reduce((sum, d) => sum + (d.newCloses || 0), 0),
      recurringCloses: dailyData.reduce((sum, d) => sum + (d.recurringCloses || 0), 0),
      cashCollected: dailyData.reduce((sum, d) => sum + d.cashCollected, 0),
      recurringRevenue: dailyData.reduce((sum, d) => sum + d.recurringRevenue, 0),
      newRevenue: dailyData.reduce((sum, d) => sum + d.newRevenue, 0),
      totalRevenue: dailyData.reduce((sum, d) => sum + d.totalRevenue, 0)
    };

    const allMetrics = {
      totalSpend: dailyData.reduce((sum, d) => sum + d.allSpend, 0),
      inboundDMs: dailyData.reduce((sum, d) => sum + d.allDMs, 0),
      impressions: dailyData.reduce((sum, d) => sum + d.allImpressions, 0),
      clicks: dailyData.reduce((sum, d) => sum + d.allClicks, 0),
      reach: Math.max(...dailyData.map(d => d.allReach).concat([0])),
      meetings: dailyData.reduce((sum, d) => sum + d.meetings, 0),
      closes: dailyData.reduce((sum, d) => sum + d.closes, 0),
      newCloses: dailyData.reduce((sum, d) => sum + (d.newCloses || 0), 0),
      recurringCloses: dailyData.reduce((sum, d) => sum + (d.recurringCloses || 0), 0),
      cashCollected: dailyData.reduce((sum, d) => sum + d.cashCollected, 0),
      recurringRevenue: dailyData.reduce((sum, d) => sum + d.recurringRevenue, 0),
      newRevenue: dailyData.reduce((sum, d) => sum + d.newRevenue, 0),
      totalRevenue: dailyData.reduce((sum, d) => sum + d.totalRevenue, 0)
    };

    // Add calculated metrics
    [activeMetrics, allMetrics].forEach(metrics => {
      metrics.salesBooked = metrics.closes;
      metrics.costPerDM = metrics.inboundDMs > 0 ? metrics.totalSpend / metrics.inboundDMs : 0;
      // Use newCloses if available, otherwise fall back to all closes for legacy CSV data
      metrics.costPerAcquisition = metrics.newCloses > 0 ? metrics.totalSpend / metrics.newCloses : 
                                   (metrics.closes > 0 ? metrics.totalSpend / metrics.closes : 0);
      metrics.costPerMeeting = metrics.meetings > 0 ? metrics.totalSpend / metrics.meetings : 0;
      metrics.ctr = metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0;
      metrics.meetingToCloseRate = metrics.meetings > 0 ? (metrics.closes / metrics.meetings) * 100 : 0;
      metrics.dmToMeetingRate = metrics.inboundDMs > 0 ? (metrics.meetings / metrics.inboundDMs) * 100 : 0;
    });

    return { active: activeMetrics, all: allMetrics };
  }
}

export default CSVProcessor;