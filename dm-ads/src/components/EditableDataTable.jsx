import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from '@/components/ui/table';
import { Edit, Save, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

const EditableDataTable = ({ data, onDataUpdate, title = "Manual Entry Data" }) => {
  const [editingRows, setEditingRows] = useState(new Set());
  const [editValues, setEditValues] = useState({});
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const tableRef = useRef(null);

  // Click outside to cancel editing
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tableRef.current && !tableRef.current.contains(event.target) && editingRows.size > 0) {
        // Cancel all editing
        setEditingRows(new Set());
        setEditValues({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingRows.size]);

  // Filter data to only show entries with manual data (meetings, shows, offersMade, closes, cashCollected, revenue)
  const manualDataEntries = data.filter(entry => 
    entry.meetings > 0 || entry.shows > 0 || entry.offersMade > 0 || 
    entry.closes > 0 || entry.cashCollected > 0 || entry.revenue > 0
  );

  // Sort the data
  const sortedData = [...manualDataEntries].sort((a, b) => {
    const aVal = a[sortBy] || 0;
    const bVal = b[sortBy] || 0;
    
    if (sortBy === 'date') {
      return sortOrder === 'asc' 
        ? new Date(aVal) - new Date(bVal)
        : new Date(bVal) - new Date(aVal);
    }
    
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const startEdit = (date) => {
    const entry = data.find(item => item.date === date);
    if (entry) {
      setEditingRows(prev => new Set([...prev, date]));
      setEditValues(prev => ({
        ...prev,
        [date]: {
          meetings: entry.meetings || 0,
          shows: entry.shows || 0,
          offersMade: entry.offersMade || 0,
          closes: entry.closes || 0,
          cashCollected: entry.cashCollected || 0,
          revenue: entry.revenue || entry.totalRevenue || 0
        }
      }));
    }
  };

  const cancelEdit = (date) => {
    setEditingRows(prev => {
      const newSet = new Set(prev);
      newSet.delete(date);
      return newSet;
    });
    setEditValues(prev => {
      const newValues = { ...prev };
      delete newValues[date];
      return newValues;
    });
  };

  const handleDeleteRecord = (date) => {
    setDeleteConfirm(date);
  };

  const confirmDelete = () => {
    const dateToDelete = deleteConfirm;
    if (!dateToDelete) return;

    // Create a delete update with all fields set to 0
    const deleteData = {
      date: dateToDelete,
      meetings: 0,
      shows: 0,
      offersMade: 0,
      closes: 0,
      cashCollected: 0,
      revenue: 0,
      totalRevenue: 0,
      newRevenue: 0,
      recurringRevenue: 0,
      isEdit: true,
      isDelete: true
    };

    if (onDataUpdate) {
      onDataUpdate(deleteData);
    }

    setDeleteConfirm(null);
    toast.success('Record deleted successfully!');
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const saveEdit = (date) => {
    const editedValues = editValues[date];
    if (!editedValues) return;

    // Validate the data
    const cashCollected = parseFloat(editedValues.cashCollected) || 0;
    const revenue = parseFloat(editedValues.revenue) || 0;
    if (cashCollected > revenue && revenue > 0) {
      toast.error('Cash collected cannot exceed total revenue');
      return;
    }

    // Prepare the data for update
    const updateData = {
      date,
      meetings: parseInt(editedValues.meetings) || 0,
      shows: parseInt(editedValues.shows) || 0,
      offersMade: parseInt(editedValues.offersMade) || 0,
      closes: parseInt(editedValues.closes) || 0,
      cashCollected: parseFloat(editedValues.cashCollected) || 0,
      revenue: parseFloat(editedValues.revenue) || 0,
      totalRevenue: parseFloat(editedValues.revenue) || 0,
      newRevenue: parseFloat(editedValues.revenue) || 0,
      recurringRevenue: 0,
      isEdit: true
    };

    if (onDataUpdate) {
      onDataUpdate(updateData);
    }

    // Clear editing state
    cancelEdit(date);
    toast.success('Data updated successfully!');
  };

  const updateEditValue = (date, field, value) => {
    setEditValues(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        [field]: value
      }
    }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return '';
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  const renderCell = (entry, field, isEditing) => {
    if (isEditing) {
      const value = editValues[entry.date]?.[field] || '';
      const isCurrency = field === 'cashCollected' || field === 'revenue';
      
      return (
        <Input
          type="number"
          min="0"
          step={isCurrency ? "0.01" : "1"}
          value={value}
          onChange={(e) => updateEditValue(entry.date, field, e.target.value)}
          className="w-20 h-8 text-xs"
        />
      );
    }

    const value = entry[field] || 0;
    if (field === 'cashCollected' || field === 'revenue') {
      return formatCurrency(value);
    }
    return value;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit className="h-5 w-5 text-muted-foreground" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Editable table showing all manual data entries. Click Edit to modify values.
        </p>
      </CardHeader>
      <CardContent>
        {sortedData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No manual data entries found.</p>
            <p className="text-xs mt-1">Add data using the Manual Data Entry section above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto" ref={tableRef}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 min-w-[100px]"
                    onClick={() => handleSort('date')}
                  >
                    Date {getSortIcon('date')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-center"
                    onClick={() => handleSort('meetings')}
                  >
                    Meetings {getSortIcon('meetings')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-center"
                    onClick={() => handleSort('shows')}
                  >
                    Shows {getSortIcon('shows')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-center"
                    onClick={() => handleSort('offersMade')}
                  >
                    Offers {getSortIcon('offersMade')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-center"
                    onClick={() => handleSort('closes')}
                  >
                    Closes {getSortIcon('closes')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-center"
                    onClick={() => handleSort('cashCollected')}
                  >
                    Cash Collected {getSortIcon('cashCollected')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-center"
                    onClick={() => handleSort('revenue')}
                  >
                    Revenue {getSortIcon('revenue')}
                  </TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((entry) => {
                  const isEditing = editingRows.has(entry.date);
                  return (
                    <TableRow key={entry.date}>
                      <TableCell className="font-medium">
                        {formatDate(entry.date)}
                      </TableCell>
                      <TableCell className="text-center">
                        {renderCell(entry, 'meetings', isEditing)}
                      </TableCell>
                      <TableCell className="text-center">
                        {renderCell(entry, 'shows', isEditing)}
                      </TableCell>
                      <TableCell className="text-center">
                        {renderCell(entry, 'offersMade', isEditing)}
                      </TableCell>
                      <TableCell className="text-center">
                        {renderCell(entry, 'closes', isEditing)}
                      </TableCell>
                      <TableCell className="text-center">
                        {renderCell(entry, 'cashCollected', isEditing)}
                      </TableCell>
                      <TableCell className="text-center">
                        {renderCell(entry, 'revenue', isEditing)}
                      </TableCell>
                      <TableCell className="text-center">
                        {isEditing ? (
                          <div className="flex gap-1 justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => saveEdit(entry.date)}
                              className="h-8 w-8 p-0"
                            >
                              <Save className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteRecord(entry.date)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(entry.date)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background border rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Delete Record
              </h3>
              <p className="text-muted-foreground mb-6">
                Are you sure you want to delete the record for {new Date(deleteConfirm).toLocaleDateString()}? 
                This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={cancelDelete}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDelete}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EditableDataTable;