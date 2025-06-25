import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ArrowUpDown, ExternalLink, Eye } from 'lucide-react';
import { useState } from 'react';

const CampaignTable = ({ campaigns, onCampaignClick, showAllCampaigns }) => {
  const [sortField, setSortField] = useState('spend');
  const [sortDirection, setSortDirection] = useState('desc');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-US').format(number);
  };

  // Calculate cost per DM dynamically
  const calculateCostPerDM = (spend, inboundDMs) => {
    return inboundDMs > 0 ? spend / inboundDMs : 0;
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedCampaigns = [...campaigns].sort((a, b) => {
    let aValue, bValue;
    
    if (sortField === 'costPerDM') {
      // Use calculated cost per DM for sorting
      aValue = calculateCostPerDM(a.spend, a.inboundDMs);
      bValue = calculateCostPerDM(b.spend, b.inboundDMs);
    } else {
      aValue = a[sortField];
      bValue = b[sortField];
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Active': { variant: 'default', className: 'bg-green-100 text-green-800 border-green-200' },
      'Inactive': { variant: 'secondary', className: 'bg-red-100 text-red-800 border-red-200' },
      'Paused': { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      'Ended': { variant: 'outline', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      'recently_completed': { variant: 'outline', className: 'bg-blue-100 text-blue-800 border-blue-200' }
    };

    const config = statusConfig[status] || statusConfig['Active'];
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    );
  };

  const SortableHeader = ({ field, children }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="h-3 w-3" />
      </div>
    </TableHead>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Campaign Performance {showAllCampaigns ? '(All Campaigns)' : '(Active Only)'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Status</TableHead>
                <SortableHeader field="spend">Spend</SortableHeader>
                <SortableHeader field="inboundDMs">Inbound DMs</SortableHeader>
                <SortableHeader field="costPerDM">Cost/DM</SortableHeader>
                <SortableHeader field="impressions">Impressions</SortableHeader>
                <SortableHeader field="reach">Reach</SortableHeader>
                <SortableHeader field="clicks">Clicks</SortableHeader>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCampaigns.map((campaign) => (
                <TableRow 
                  key={campaign.id} 
                  className="hover:bg-muted/50 cursor-pointer" 
                  onClick={() => onCampaignClick && onCampaignClick(campaign)}
                >
                  <TableCell className="font-medium max-w-xs">
                    <div className="truncate" title={campaign.name}>
                      {campaign.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(campaign.status)}
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatCurrency(campaign.spend)}
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    {campaign.inboundDMs}
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatCurrency(calculateCostPerDM(campaign.spend, campaign.inboundDMs))}
                  </TableCell>
                  <TableCell>
                    {formatNumber(campaign.impressions)}
                  </TableCell>
                  <TableCell>
                    {formatNumber(campaign.reach)}
                  </TableCell>
                  <TableCell>
                    {formatNumber(campaign.clicks)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
          <div>
            Showing {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
          </div>
          <div className="flex gap-4">
            <div>
              Total Spend: <span className="font-semibold">
                {formatCurrency(campaigns.reduce((sum, c) => sum + c.spend, 0))}
              </span>
            </div>
            <div>
              Total DMs: <span className="font-semibold">
                {campaigns.reduce((sum, c) => sum + c.inboundDMs, 0)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignTable;

