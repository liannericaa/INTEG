import React, { useState, useEffect } from 'react';
import { Artwork, formatCurrency } from '../data/artworks';
import { Clock, TrendingUp } from 'lucide-react';
import BidPaymentDialog from './BidPaymentDialog';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';

interface BiddingInterfaceProps {
  artwork: Artwork;
  onPlaceBid: (amount: number) => void;
}

const BiddingInterface: React.FC<BiddingInterfaceProps> = ({ artwork, onPlaceBid }) => {
  const { user } = useAuth();
  const [currentBid, setCurrentBid] = useState(artwork.currentBid);
  const [bidAmount, setBidAmount] = useState(artwork.currentBid + 1);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  
  // Fetch latest bid every 1 second
  useEffect(() => {
    const fetchLatestBid = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/bid/item/${artwork.id}`);
        if (!response.ok) throw new Error('Failed to fetch latest bid');
        
        const bids = await response.json();
        if (bids && bids.length > 0) {
          const latestBid = Math.max(...bids.map((bid: any) => bid.bidAmount));
          if (latestBid > currentBid) {
            setCurrentBid(latestBid);
            setBidAmount(latestBid + 1);
          }
        }
      } catch (error) {
        console.error('Error fetching latest bid:', error);
      }
    };

    const interval = setInterval(fetchLatestBid, 0); // Poll every 1 seconds
    return () => clearInterval(interval);
  }, [artwork.id, currentBid]);

  const minBid = currentBid + Math.ceil(currentBid * 0.05); // Minimum 5% increase
  
  const handleBidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setBidAmount(isNaN(value) ? minBid : value);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bidAmount >= minBid) {
      setIsPaymentDialogOpen(true);
    }
  };

  const handlePaymentComplete = async () => {
    if (!user) {
      toast.error('Please log in to place a bid');
      return;
    }

    try {
      const bidData = {
        itemId: artwork.id,
        bidAmount: bidAmount,
        customerId: user.id,
        imageBase64: artwork.image,
        item: {
          id: artwork.id,
          name: artwork.title,
          description: artwork.description,
          startingPrice: artwork.startingBid,
          currentBid: currentBid
        },
        customer: {
          id: user.id,
          username: user.username
        }
      };

      const response = await fetch('http://localhost:8080/api/bid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bidData),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to place bid');
      }

      const responseData = await response.json();
      
      // Update local state with the new bid
      setCurrentBid(bidAmount);
      onPlaceBid(bidAmount);
      setIsPaymentDialogOpen(false);
      
      toast.success('Bid placed successfully!');
    } catch (error) {
      console.error('Error placing bid:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to place bid. Please try again.');
    }
  };

  const getBidIncrements = () => {
    return [
      minBid,
      minBid + Math.ceil(currentBid * 0.1),
      minBid + Math.ceil(currentBid * 0.2)
    ];
  };

  const incrementOptions = getBidIncrements();
  
  const timeRemaining = () => {
    const now = new Date();
    const endTime = new Date(artwork.auctionEnds);
    const diff = endTime.getTime() - now.getTime();
    
    // If auction has ended
    if (diff <= 0) return { ended: true, display: "Auction ended" };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return {
      ended: false,
      days,
      hours,
      minutes,
      seconds,
      display: `${days}d ${hours}h ${minutes}m ${seconds}s`
    };
  };
  
  const remaining = timeRemaining();

  return (
    <>
      <div className="border border-gray-200 rounded-lg bg-white shadow-md p-5">
        <h3 className="font-display text-xl font-medium mb-5 text-[#5D4037]">Place Your Bid</h3>
        
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center pb-3 border-b border-gray-200">
            <span className="text-sm text-[#5D4037]/80">Starting Price</span>
            <span className="font-medium text-[#3E2723]">{formatCurrency(artwork.startingBid)}</span>
          </div>
          
          <div className="flex justify-between items-center pb-3 border-b border-gray-200">
            <span className="text-sm text-[#5D4037]/80">Current Bid</span>
            <span className="font-semibold text-[#5D4037]">{formatCurrency(currentBid)}</span>
          </div>
          
          <div className="flex justify-between items-center pb-3 border-b border-gray-200">
            <span className="text-sm text-[#5D4037]/80">Bid Increment</span>
            <span className="font-medium text-[#3E2723]">{formatCurrency(minBid - currentBid)}</span>
          </div>
          
          <div className="flex items-center gap-2 py-2">
            <Clock size={16} className="text-[#5D4037]/70" />
            <span className="text-sm font-medium text-[#3E2723]">
              {remaining.ended ? "Auction ended" : "Time Remaining:"}
            </span>
            {!remaining.ended && (
              <span className="text-sm font-semibold text-[#5D4037] bg-[#EFEBE9] px-2 py-0.5 rounded">
                {remaining.display}
              </span>
            )}
          </div>
        </div>
        
        {!remaining.ended && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="bid-amount" className="block text-sm font-medium mb-2 text-[#5D4037]">
                Your Bid
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="bid-amount"
                  min={minBid}
                  value={bidAmount}
                  onChange={handleBidChange}
                  className="block w-full rounded-md border border-gray-300 py-2 pl-7 pr-3 focus:outline-none focus:ring-1 focus:ring-[#795548] focus:border-[#795548]"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {incrementOptions.map((amount, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setBidAmount(amount)}
                  className="py-2 px-2 text-sm rounded border border-gray-200 hover:bg-[#EFEBE9] transition-colors text-center text-[#5D4037]"
                >
                  {formatCurrency(amount)}
                </button>
              ))}
            </div>
            
            <button
              type="submit"
              disabled={bidAmount < minBid}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md text-white font-medium transition-colors ${
                bidAmount >= minBid
                  ? "bg-[#5D4037] hover:bg-[#4E342E]"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              <TrendingUp size={18} />
              Place Bid
            </button>
          </form>
        )}
        
        {remaining.ended && (
          <div className="bg-[#EFEBE9] rounded-md p-4 text-center">
            <p className="text-sm text-[#5D4037]/70">This auction has ended.</p>
          </div>
        )}
      </div>

      {/* Payment Dialog */}
      <BidPaymentDialog 
        isOpen={isPaymentDialogOpen}
        onClose={() => setIsPaymentDialogOpen(false)}
        onConfirm={handlePaymentComplete}
        bidAmount={bidAmount}
        artworkTitle={artwork.title}
      />
    </>
  );
};

export default BiddingInterface;