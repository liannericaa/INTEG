import { useState, useEffect } from 'react';
import axios from 'axios';
import SellerLayout from '@/components/Layout/SellerLayout';
import { Clock, CheckCircle, XCircle, DollarSign, CalendarX } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface Item {
  id: number;
  name: string;
  description: string;
  startingPrice: number;
  imageBase64: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SOLD' | 'EXPIRED';
  createdAt: string;
  sellerId?: number;
  seller?: {
    id: number;
  };
}

const ItemCard = ({ item }: { item: Item }) => {
  return (
    <div className="border p-4 rounded-lg">
      <img
        src={item.imageBase64 || 'https://via.placeholder.com/150'}
        alt={item.name}
        className="w-full h-32 object-cover rounded-md mb-2"
      />
      <h3 className="text-lg font-semibold">{item.name}</h3>
      <p className="text-sm text-gray-600">{item.description}</p>
      <p className="text-sm font-medium text-green-600">${item.startingPrice}</p>
    </div>
  );
};

const ItemStatus = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState("PENDING");
  const { user } = useAuth();

  useEffect(() => {
    const fetchItems = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:8080/api/item');
        
        let fetchedItems: Item[] = [];
        if (Array.isArray(response.data)) {
          fetchedItems = response.data;
        } else if (response.data && response.data.data) {
          fetchedItems = response.data.data;
        } else {
          console.error("Invalid API response:", response.data);
        }
        
        // Filter items to only show those belonging to the current seller
        const sellerItems = fetchedItems.filter(item => {
          // Check both possible formats for sellerId depending on API response structure
          const itemSellerId = item.sellerId || (item.seller && item.seller.id);
          return itemSellerId === parseInt(user.id);
        });
        
        setItems(sellerItems);
      } catch (error) {
        console.error("Failed to fetch items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [user]);

  const statusData = {
    PENDING: {
      title: "Pending Items",
      icon: Clock,
      items: items.filter(item => item.status === 'PENDING')
    },
    APPROVED: {
      title: "Approved Items",
      icon: CheckCircle,
      items: items.filter(item => item.status === 'APPROVED')
    },
    REJECTED: {
      title: "Rejected Items",
      icon: XCircle,
      items: items.filter(item => item.status === 'REJECTED')
    },
    SOLD: {
      title: "Sold Items",
      icon: DollarSign,
      items: items.filter(item => item.status === 'SOLD')
    },
    EXPIRED: {
      title: "Expired Items",
      icon: CalendarX,
      items: items.filter(item => item.status === 'EXPIRED')
    }
  };

  // Show a message if the user is not logged in
  if (!user) {
    return (
      <SellerLayout>
        <div className="py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Item Status</h1>
            <p className="mb-4">Please log in as a seller to view your items</p>
          </div>
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Item Status</h1>
        </div>

        {/* Tabs Navigation */}
        <div className="flex w-full border rounded-lg overflow-hidden mb-6">
          {Object.entries(statusData).map(([key, { title, icon: Icon }]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors
                ${activeTab === key 
                  ? 'bg-[#AA8F66] text-white' 
                  : 'bg-white text-[#5A3A31] hover:bg-[#AA8F66]/10'}`}
            >
              <Icon className="h-4 w-4" />
              {title}
            </button>
          ))}
        </div>

        {/* Active Tab Content */}
        <div className="bg-white rounded-lg border min-h-[200px]">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-[#5A3A31] mb-4">
              {statusData[activeTab as keyof typeof statusData].title}
            </h2>

            {loading ? (
              <div className="text-center py-12 text-[#5A3A31]/60">
                Loading items...
              </div>
            ) : statusData[activeTab as keyof typeof statusData].items.length === 0 ? (
              <div className="text-center py-12 text-[#5A3A31]/60">
                No items found in this status
              </div>
            ) : (
              <div className="grid gap-4">
                {statusData[activeTab as keyof typeof statusData].items.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </SellerLayout>
  );
};

export default ItemStatus;
