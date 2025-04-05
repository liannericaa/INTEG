import { useState, useEffect } from 'react';
import axios from 'axios';
import SellerLayout from '@/components/Layout/SellerLayout';
import { Calendar, PlayCircle, StopCircle, Image, Clock, CreditCard } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface Auction {
  id: string;
  title: string;
  description: string;
  startingPrice: number;
  currentBid: number;
  imageUrl?: string; // Optional to handle missing images
  startDate: string;
  endDate: string;
  status: 'not-started' | 'active' | 'ended';
  bidCount: number;
  sellerId?: number;
  seller?: {
    id: number;
  };
  paymentDetails?: {
    transactionId: string;
    paymentMethod: string;
    paymentStatus: 'pending' | 'completed' | 'failed';
    paymentDate?: string;
    amount: number;
    buyerName?: string;
    commission: number;
    netAmount: number;
  };
}

const AuctionCard = ({ auction }: { auction: Auction }) => {
  const getStatusDisplay = () => {
    switch (auction.status) {
      case 'not-started':
        return {
          text: `Starts on ${new Date(auction.startDate).toLocaleDateString()}`,
          color: 'text-blue-600',
        };
      case 'active':
        return {
          text: `${getRemainingTime(auction.endDate)} left`,
          color: 'text-green-600',
        };
      case 'ended':
        return {
          text: `Ended on ${new Date(auction.endDate).toLocaleDateString()}`,
          color: 'text-gray-500',
        };
      default:
        return { text: 'Unknown status', color: 'text-gray-500' };
    }
  };

  const getRemainingTime = (endDate: string) => {
    const remaining = new Date(endDate).getTime() - new Date().getTime();
    if (remaining <= 0) return '0 days';
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  const status = getStatusDisplay();

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white border rounded-lg hover:shadow-md transition-shadow">
      {/* Auction Image */}
      <div className="relative h-20 w-20 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
        {auction.imageUrl ? (
          <img
            src={auction.imageUrl}
            alt={auction.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full">
            <Image className="h-8 w-8 text-gray-400" />
          </div>
        )}
      </div>

      {/* Auction Details */}
      <div className="flex-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-medium text-gray-800">{auction.title || 'Untitled Auction'}</h3>
            <p className="text-sm text-gray-600 line-clamp-1">
              {auction.description || 'No description available.'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-sm font-medium text-gray-700">
              {auction.status === 'not-started'
                ? `Starting bid: $${auction.startingPrice.toLocaleString()}`
                : `Current bid: $${(auction.currentBid || auction.startingPrice).toLocaleString()}`}
            </span>
            <div className="flex items-center gap-1 justify-end mt-1">
              <Clock className="h-4 w-4" />
              <span className={`text-xs ${status.color}`}>{status.text}</span>
            </div>
          </div>
        </div>

        {/* Bid Count */}
        {auction.bidCount > 0 ? (
          <div className="mt-2">
            <span className="text-xs text-gray-500">
              {auction.bidCount} bid{auction.bidCount !== 1 ? 's' : ''}
            </span>
          </div>
        ) : (
          <div className="mt-2">
            <span className="text-xs text-gray-500">No bids yet</span>
          </div>
        )}
      </div>
    </div>
  );
};

const AuctionStatus = () => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState("not-started");
  const { user } = useAuth();

  useEffect(() => {
    const fetchAuctions = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get('http://localhost:8080/api/item'); // Replace with your backend API endpoint
        if (response.data && response.data.status) {
          // Map backend data to match the Auction interface
          const mappedAuctions = response.data.data.map((item: any) => ({
            id: item.id.toString(),
            title: item.name,
            description: item.description,
            startingPrice: item.startingPrice,
            currentBid: 0, // Replace with actual current bid if available
            imageUrl: item.imageBase64, // Replace with actual image URL if available
            startDate: item.startTime,
            endDate: item.endTime,
            status: item.auctionStatus === 'NOT_STARTED' ? 'not-started' :
                    item.auctionStatus === 'ACTIVE' ? 'active' :
                    item.auctionStatus === 'ENDED' ? 'ended' : 'unknown',
            bidCount: 0, // Replace with actual bid count if available,
            sellerId: item.sellerId,
            seller: item.seller
          }));

          // Filter auctions to only show those belonging to the current seller
          const sellerAuctions = mappedAuctions.filter(auction => {
            const auctionSellerId = auction.sellerId || (auction.seller && auction.seller.id);
            return auctionSellerId === parseInt(user.id);
          });
          
          setAuctions(sellerAuctions);
        } else {
          console.error("Invalid API response:", response.data);
        }
      } catch (error) {
        console.error("Failed to fetch auctions:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchAuctions();
  }, [user]);

  const statusData = {
    "not-started": {
      title: "Not Started Auctions",
      icon: Calendar,
      items: auctions.filter(auction => auction.status === 'not-started')
    },
    active: {
      title: "Active Auctions",
      icon: PlayCircle,
      items: auctions.filter(auction => auction.status === 'active')
    },
    ended: {
      title: "Ended Auctions",
      icon: StopCircle,
      items: auctions.filter(auction => auction.status === 'ended')
    }
  };

  // Show a message if the user is not logged in
  if (!user) {
    return (
      <SellerLayout>
        <div className="py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Auction Status</h1>
            <p className="mb-4">Please log in as a seller to view your auctions</p>
          </div>
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div>
        <h1 className="text-2xl font-semibold mb-6">Auction Status</h1>
        
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
              <div className="text-center py-12 text-gray-500">Loading auctions...</div>
            ) : statusData[activeTab as keyof typeof statusData].items.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No auctions found in this status</div>
            ) : (
              <div className="grid gap-4">
                {statusData[activeTab as keyof typeof statusData].items.map((auction) => (
                  <AuctionCard key={auction.id} auction={auction} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </SellerLayout>
  );
};

export default AuctionStatus;
