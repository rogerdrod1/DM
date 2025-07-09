import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown } from 'lucide-react';

const ConversionFunnel = ({ data }) => {
  const maxValue = Math.max(...data.map(item => item.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((stage, index) => {
            const width = (stage.value / maxValue) * 100;
            const isLast = index === data.length - 1;
            
            return (
              <div key={stage.stage} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{stage.stage}</span>
                  <div className="text-right">
                    <div className="text-sm font-bold">
                      {new Intl.NumberFormat('en-US').format(stage.value)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {stage.percentage}%
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-8">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium transition-all duration-500"
                      style={{ width: `${width}%` }}
                    >
                      {width > 20 && `${stage.percentage}%`}
                    </div>
                  </div>
                </div>
                
                {!isLast && (
                  <div className="flex justify-center">
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Key Insights</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Click-to-DM Rate:</span>
              <span className="ml-1 font-medium">
                {((data[2].value / data[1].value) * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">DM-to-Conversation:</span>
              <span className="ml-1 font-medium">
                {((data[3].value / data[2].value) * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Conversation-to-Sale:</span>
              <span className="ml-1 font-medium">
                {((data[4].value / data[3].value) * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Overall Conversion:</span>
              <span className="ml-1 font-medium">
                {((data[4].value / data[0].value) * 100).toFixed(3)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversionFunnel;

