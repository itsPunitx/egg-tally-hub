import { useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useCustomers } from "@/hooks/useCustomers";
import { useExport } from "@/hooks/useExport";
import { Loader2, Search, Eye, Download } from "lucide-react";

const CustomerRecords = () => {
  const { customers, loading } = useCustomers();
  const { exportCustomers, isExporting } = useExport();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <Navigation />
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <Navigation />
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span>👥</span>
                  Customer Records
                </CardTitle>
                <CardDescription>
                  View all customers and their transaction summaries
                </CardDescription>
              </div>
              <Button
                onClick={exportCustomers}
                disabled={isExporting || customers.length === 0}
                variant="outline"
                className="gap-2"
              >
                {isExporting && <Loader2 className="h-4 w-4 animate-spin" />}
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No customers found matching your search." : "No customers yet. Add a sale to get started!"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer Name</TableHead>
                      <TableHead className="text-right">Total Eggs</TableHead>
                      <TableHead className="text-right">Total Spent</TableHead>
                      <TableHead className="text-right">Total Paid</TableHead>
                      <TableHead className="text-right">Pending Due</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">
                          {customer.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {customer.total_eggs.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ${customer.total_spent.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ${customer.total_paid.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={customer.total_due > 0 ? "text-destructive font-medium" : ""}>
                            ${customer.total_due.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                          >
                            <Link to={`/customer/${customer.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerRecords;