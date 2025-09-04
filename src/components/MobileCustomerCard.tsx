import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  total_eggs: number;
  total_spent: number;
  total_paid: number;
  total_due: number;
}

interface MobileCustomerCardProps {
  customer: Customer;
}

const MobileCustomerCard = ({ customer }: MobileCustomerCardProps) => {
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg">{customer.name}</h3>
          <Button asChild variant="ghost" size="sm">
            <Link to={`/customer/${customer.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Total Eggs:</span>
            <div className="font-medium">{customer.total_eggs.toLocaleString()}</div>
          </div>
          
          <div>
            <span className="text-muted-foreground">Total Spent:</span>
            <div className="font-medium">₹{customer.total_spent.toFixed(2)}</div>
          </div>
          
          <div>
            <span className="text-muted-foreground">Total Paid:</span>
            <div className="font-medium">₹{customer.total_paid.toFixed(2)}</div>
          </div>
          
          <div>
            <span className="text-muted-foreground">Pending Due:</span>
            <div className={`font-medium ${customer.total_due > 0 ? 'text-destructive' : ''}`}>
              ₹{customer.total_due.toFixed(2)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileCustomerCard;