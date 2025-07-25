import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';

const DataInput = ({ onDataSubmit }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    meetings: '',
    shows: '',
    offersMade: '',
    closes: '',
    newCloses: '',
    recurringCloses: '',
    cashCollected: '',
    revenue: ''
  });
  

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check if at least one field has data
    const hasData = formData.meetings || formData.shows || formData.offersMade || formData.closes || 
                   formData.newCloses || formData.recurringCloses || formData.cashCollected || formData.revenue;
    
    if (!hasData) {
      toast.error('Please fill in at least one field');
      return;
    }

    // Validate cash collected doesn't exceed revenue
    const cashCollected = parseFloat(formData.cashCollected) || 0;
    const revenue = parseFloat(formData.revenue) || 0;
    if (cashCollected > revenue && revenue > 0) {
      toast.error('Cash collected cannot exceed total revenue');
      return;
    }

    // Validate that newCloses + recurringCloses = total closes (if both are specified)
    const newCloses = parseInt(formData.newCloses) || 0;
    const recurringCloses = parseInt(formData.recurringCloses) || 0;
    const totalCloses = parseInt(formData.closes) || 0;
    
    if (totalCloses > 0 && (newCloses + recurringCloses) > 0 && (newCloses + recurringCloses) !== totalCloses) {
      toast.error('New closes + recurring closes must equal total closes');
      return;
    }

    // Prepare data for submission
    const newData = {
      meetings: parseInt(formData.meetings) || 0,
      shows: parseInt(formData.shows) || 0,
      offersMade: parseInt(formData.offersMade) || 0,
      closes: parseInt(formData.closes) || 0,
      newCloses: parseInt(formData.newCloses) || 0,
      recurringCloses: parseInt(formData.recurringCloses) || 0,
      cashCollected: parseFloat(formData.cashCollected) || 0,
      revenue: parseFloat(formData.revenue) || 0
    };
    
    // Auto-calculate total closes if not specified but new/recurring are
    if (newData.closes === 0 && (newData.newCloses > 0 || newData.recurringCloses > 0)) {
      newData.closes = newData.newCloses + newData.recurringCloses;
    }
    
    // Auto-calculate new/recurring if total is specified but breakdown isn't
    if (newData.closes > 0 && newData.newCloses === 0 && newData.recurringCloses === 0) {
      // Default to all being new closes unless specified otherwise
      newData.newCloses = newData.closes;
      newData.recurringCloses = 0;
    }

    // Add mode: only include non-zero values to add
    const fieldsToAdd = {};
    Object.keys(newData).forEach(key => {
      if (newData[key] > 0) {
        fieldsToAdd[key] = newData[key];
      }
    });
    
    const dataToSubmit = {
      date: formData.date,
      ...fieldsToAdd,
      // Keep for backward compatibility
      totalRevenue: fieldsToAdd.revenue || 0,
      newRevenue: fieldsToAdd.revenue || 0,
      recurringRevenue: 0,
      isEdit: false
    };

    // Call the parent component's submit handler
    if (onDataSubmit) {
      onDataSubmit(dataToSubmit);
    }

    // Show success message
    toast.success('Data added successfully!');

    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      meetings: '',
      shows: '',
      offersMade: '',
      closes: '',
      newCloses: '',
      recurringCloses: '',
      cashCollected: '',
      revenue: ''
    });
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-muted-foreground" />
          Manual Data Entry
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Date
              </Label>
              <div className="w-fit">
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Main Metrics */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Sales Activity</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meetings">
                    Meetings
                  </Label>
                  <Input
                    id="meetings"
                    type="number"
                    min="0"
                    placeholder="# of meetings"
                    value={formData.meetings}
                    onChange={(e) => handleInputChange('meetings', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shows">
                    Shows
                  </Label>
                  <Input
                    id="shows"
                    type="number"
                    min="0"
                    placeholder="# of shows"
                    value={formData.shows}
                    onChange={(e) => handleInputChange('shows', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offersMade">
                    Offers Made
                  </Label>
                  <Input
                    id="offersMade"
                    type="number"
                    min="0"
                    placeholder="# of offers"
                    value={formData.offersMade}
                    onChange={(e) => handleInputChange('offersMade', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="closes">
                    Total Closes
                  </Label>
                  <Input
                    id="closes"
                    type="number"
                    min="0"
                    placeholder="# of total closes"
                    value={formData.closes}
                    onChange={(e) => handleInputChange('closes', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Close Type Breakdown */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Close Type Breakdown (Optional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newCloses">
                    New Client Closes
                  </Label>
                  <Input
                    id="newCloses"
                    type="number"
                    min="0"
                    placeholder="# of new clients"
                    value={formData.newCloses}
                    onChange={(e) => handleInputChange('newCloses', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    First-time customers (used for CPA calculation)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurringCloses">
                    Recurring Client Closes
                  </Label>
                  <Input
                    id="recurringCloses"
                    type="number"
                    min="0"
                    placeholder="# of existing clients"
                    value={formData.recurringCloses}
                    onChange={(e) => handleInputChange('recurringCloses', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Repeat customers or upsells
                  </p>
                </div>
              </div>
            </div>

            {/* Revenue Fields */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Revenue Tracking (Optional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="revenue">
                    Total Revenue
                  </Label>
                  <Input
                    id="revenue"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="$0.00"
                    value={formData.revenue}
                    onChange={(e) => handleInputChange('revenue', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Full deal value from all closes today
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cashCollected">
                    Cash Collected
                  </Label>
                  <Input
                    id="cashCollected"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="$0.00"
                    value={formData.cashCollected}
                    onChange={(e) => handleInputChange('cashCollected', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Amount actually received today
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Button type="submit" className="flex items-center gap-2 w-full sm:w-auto">
            <Save className="h-4 w-4" />
            Save Data
          </Button>
        </form>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="text-sm font-medium text-foreground mb-2">
            How to Use
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• <strong>All fields are optional</strong> - fill in only what you have data for</li>
            <li>• <strong>Adding:</strong> Blank fields = 0, data gets added to existing totals</li>
            <li>• <strong>Editing:</strong> Use the Editable Data Table below to modify existing entries</li>
            <li>• <strong>Meetings:</strong> Number of meetings/calls you had</li>
            <li>• <strong>Shows:</strong> Number of people who actually showed up to meetings</li>
            <li>• <strong>Offers Made:</strong> Number of formal offers/proposals presented</li>
            <li>• <strong>Total Closes:</strong> Total number of deals closed/signed</li>
            <li>• <strong>New Client Closes:</strong> First-time customers (affects CPA calculation)</li>
            <li>• <strong>Recurring Client Closes:</strong> Repeat customers or upsells</li>
            <li>• <strong>Total Revenue:</strong> Full value of all deals (e.g., $3,000 for a $3k deal)</li>
            <li>• <strong>Cash Collected:</strong> Actual money received (can be partial)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataInput;

