import { Card, CardContent } from "@/components/ui/card";

interface InventoryItem {
  id: string;
  purchase_date: string;
  eggs_in_stock: number;
  purchase_price_per_egg: number;
}

interface MobileInventoryCardProps {
  item: InventoryItem;
}

const MobileInventoryCard = ({ item }: MobileInventoryCardProps) => {
  const totalCost = item.eggs_in_stock * item.purchase_price_per_egg;
  
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg">
            {new Date(item.purchase_date).toLocaleDateString()}
          </h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Eggs:</span>
            <div className="font-medium">{item.eggs_in_stock.toLocaleString()}</div>
          </div>
          
          <div>
            <span className="text-muted-foreground">Price per Egg:</span>
            <div className="font-medium">₹{item.purchase_price_per_egg.toFixed(2)}</div>
          </div>
          
          <div className="col-span-2">
            <span className="text-muted-foreground">Total Cost:</span>
            <div className="font-medium text-primary">₹{totalCost.toFixed(2)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileInventoryCard;