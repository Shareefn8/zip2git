import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, RefreshCw, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface SheetData {
  slot: string;
  position: string;
  html_code: string;
}

const GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/1GZPs1TQ5EfPYuOhiN7NBieH30MQOlFoMSVSzIhrKros/export?format=csv';

export const GoogleSheetsIntegration = () => {
  const { toast } = useToast();
  const [data, setData] = useState<SheetData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(GOOGLE_SHEETS_URL);
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const csv = await response.text();
      const lines = csv.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const parsedData: SheetData[] = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        return {
          slot: values[0] || '',
          position: values[1] || '',
          html_code: values[2] || '',
        };
      }).filter(row => row.slot); // Filter empty rows

      setData(parsedData);
      setLastUpdated(new Date());
      toast({
        title: '✅ Data Loaded',
        description: `Successfully loaded ${parsedData.length} records from Google Sheets.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast({
        title: '❌ Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const exportAsJSON = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sheets-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: '✅ Exported',
      description: 'Data exported as JSON file.',
    });
  };

  return (
    <section className="border-t border-border/40 py-6 sm:py-8 px-4 sm:px-6">
      <div className="container mx-auto max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="space-y-3">
            <h2 className="section-heading text-2xl sm:text-4xl">📊 Google Sheets Integration</h2>
            <p className="section-subtext text-sm sm:text-base">
              Real-time data sync from your Google Sheets. View, manage, and export data directly from your spreadsheet.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={fetchData} 
              disabled={loading}
              className="gap-2 flex-1 sm:flex-none"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Refresh Data
                </>
              )}
            </Button>
            {data.length > 0 && (
              <Button 
                onClick={exportAsJSON}
                variant="outline"
                className="gap-2 flex-1 sm:flex-none"
                size="lg"
              >
                <Download className="h-4 w-4" />
                Export JSON
              </Button>
            )}
          </div>

          {/* Status */}
          {lastUpdated && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Last updated: {lastUpdated.toLocaleString()}
            </div>
          )}

          {/* Error State */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex gap-3"
            >
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-destructive">Error Loading Data</p>
                <p className="text-xs sm:text-sm text-destructive/80 mt-1">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Data Table */}
          {data.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="border-b border-border/50 bg-secondary/30">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 text-left font-semibold text-muted-foreground">Slot</th>
                      <th className="px-3 sm:px-4 py-3 text-left font-semibold text-muted-foreground">Position</th>
                      <th className="px-3 sm:px-4 py-3 text-left font-semibold text-muted-foreground">HTML Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, idx) => (
                      <motion.tr 
                        key={idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="border-b border-border/30 hover:bg-secondary/20 transition-colors"
                      >
                        <td className="px-3 sm:px-4 py-3 text-foreground font-medium">{row.slot}</td>
                        <td className="px-3 sm:px-4 py-3 text-muted-foreground">{row.position}</td>
                        <td className="px-3 sm:px-4 py-3 text-muted-foreground break-all font-mono text-xs">
                          {row.html_code.substring(0, 50)}...
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-border/30 bg-secondary/10 text-xs sm:text-sm text-muted-foreground">
                Total Records: <span className="font-semibold text-foreground">{data.length}</span>
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {!loading && data.length === 0 && !error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-8 sm:p-12 text-center space-y-4"
            >
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Download className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground">
                Click "Refresh Data" to load data from Google Sheets
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
};
