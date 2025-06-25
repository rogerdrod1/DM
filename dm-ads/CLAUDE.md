# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Instagram DM Ads Dashboard for service-based businesses. It tracks performance metrics from Instagram DM advertising campaigns including inbound DMs, ad spend, conversions, and sales. The app is built with React and uses sample data with manual input capabilities for conversations and sales tracking.

## Key Components Architecture

### Main Dashboard Structure
- **Dashboard.jsx** - Main container component that manages state and data flow
- **App.jsx** - Simple wrapper that renders the Dashboard component
- **main.jsx** - React app entry point with Toaster component

### Data Management
- **sampleData.js** - Contains all sample data structures and utility functions
- Data is persisted to localStorage for manual entries (conversations, salesBooked)
- Real Facebook Ads API integration is documented but not implemented

### Component Architecture
- **MetricCard** - Displays individual KPI metrics with trend indicators
- **ConversionFunnel** - Visualizes the customer journey from impressions to sales
- **PerformanceChart** - Time series chart for daily performance trends
- **DataInput** - Form for manual entry of conversations and sales data
- **CampaignTable** - Sortable table showing campaign-level performance

### Data Flow Pattern
1. Dashboard loads sample data on mount
2. localStorage data merged with sample data for persistence
3. Manual entries update both localStorage and component state
4. All components receive data via props from Dashboard

## Development Commands

Since there's no package.json in the root directory, this appears to be a standalone React application. Based on the imports using `@/components/ui/*`, this likely uses:
- Vite as the build tool
- shadcn/ui component library
- Tailwind CSS for styling

Standard React development commands would apply:
- `npm run dev` or `yarn dev` - Start development server
- `npm run build` or `yarn build` - Build for production
- `npm run preview` or `yarn preview` - Preview production build

## Key Data Structures

### currentMetrics
Contains primary KPIs: inboundDMs, totalSpend, costPerDM, salesBooked, conversations, impressions, reach, clicks, ctr

### dailyData
Array of daily performance objects with: date, inboundDMs, conversations, salesBooked, spend, impressions, clicks

### campaigns
Array of campaign objects with: id, name, status, spend, inboundDMs, costPerDM, impressions, reach, clicks

### funnelData
Conversion funnel stages: Impressions → Clicks → Inbound DMs → Conversations → Sales Booked

## Manual Data Entry System

The app includes a DataInput component for tracking:
- **Conversations** - Meaningful conversations from inbound DMs
- **Sales Booked** - Actual sales/appointments closed

This data is crucial as it cannot be automatically obtained from Facebook Ads API and represents the bottom-funnel conversion metrics.

## Future Facebook Ads API Integration

Comprehensive documentation exists in "Facebook Ads API Integration Guide.md" for connecting real Facebook Ads data. The integration would replace sample data for automated metrics while preserving manual entry for conversations and sales.