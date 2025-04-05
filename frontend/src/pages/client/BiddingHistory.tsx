import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ClientLayout from "@/components/ClientLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, DollarSign } from "lucide-react";

export default function BiddingHistory() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetch(`http://localhost:8080/api/bid/user/${user.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch bidding history");
          }
          return res.json();
        })
        .then((data) => {
          console.log('Bid data:', data);
          setTransactions(data);
        })
        .catch((error) => {
          console.error(error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [user]);

  if (!user) {
    return (
      <ClientLayout>
        <div className="container py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Not Logged In</h1>
            <p className="mb-4">Please log in to view your bidding history</p>
            <Button className="bg-[#AA8F66] hover:bg-[#AA8F66]/90 text-white" asChild>
              <a href="/login">Log In</a>
            </Button>
          </div>
        </div>
      </ClientLayout>
    );
  }

  if (loading) {
    return (
      <ClientLayout>
        <div className="container py-8 text-center">
          <p>Loading your bidding history...</p>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div>
        {/* Header Section with Background Image */}
        <div 
          className="h-60 w-full relative overflow-hidden"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?q=80&w=2000')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#5A3A31]/60 to-[#AA8F66]/40"></div>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl text-white font-medium drop-shadow-md">
                Transaction History
              </h1>
              <p className="text-white/90 mt-3 text-base">
                View your complete bidding and payment history
              </p>
            </div>
          </div>
        </div>
        
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center py-12 bg-[#AA8F66]/5 rounded-xl border border-[#AA8F66]/10">
                <Clock className="mx-auto h-12 w-12 text-[#AA8F66]/40" />
                <h3 className="mt-4 text-xl font-semibold text-[#5A3A31]">No bids found</h3>
                <p className="mt-2 text-[#5A3A31]/60">Your bidding history will appear here</p>
                <Button className="mt-6 bg-[#AA8F66] hover:bg-[#AA8F66]/90" asChild>
                  <a href="/auctions">Browse Auctions</a>
                </Button>
              </div>
            ) : (
              transactions.map((transaction) => {
                const item = transaction.item || {};
                const imageUrl = item.image || "https://placehold.co/200x200/e9e3dd/aa8f66?text=Artwork";
                
                return (
                  <Card
                    key={transaction.id}
                    className="overflow-hidden border border-[#AA8F66]/20 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-48 h-48 bg-[#AA8F66]/10 flex-shrink-0">
                        <img
                          src={imageUrl}
                          alt={item.name || "Artwork"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://placehold.co/200x200/e9e3dd/aa8f66?text=Artwork";
                          }}
                        />
                      </div>
                      <div className="flex-1 p-4 md:p-6">
                        <div className="flex flex-col md:flex-row justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-[#5A3A31]">
                              {item.name || "Unknown Item"}
                            </h3>
                            <p className="text-[#5A3A31]/60">
                              by {transaction.sellerName || "Unknown Seller"}
                            </p>

                            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-[#5A3A31]/60">Transaction Date</p>
                                <p className="font-medium text-[#5A3A31]">
                                  {transaction.bidTime
                                    ? new Date(transaction.bidTime).toLocaleDateString()
                                    : "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-[#5A3A31]/60">Transaction ID</p>
                                <p className="font-medium text-[#5A3A31]">
                                  {transaction.transactionId || "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-[#5A3A31]/60">Bid Time</p>
                                <p className="font-medium text-[#5A3A31]">
                                  {transaction.bidTime
                                    ? new Date(transaction.bidTime).toLocaleTimeString()
                                    : "N/A"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 md:mt-0 text-right">
                            <div>
                              <p className="text-[#5A3A31]/60 text-sm">Final Price</p>
                              <div className="flex items-center justify-end">
                                <DollarSign className="w-4 h-4 text-[#AA8F66]" />
                                <span className="text-xl font-bold text-[#5A3A31]">
                                  {transaction.finalPrice
                                    ? transaction.finalPrice.toLocaleString()
                                    : "N/A"}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2">
                              <p className="text-[#5A3A31]/60 text-sm">Your Bid</p>
                              <div className="flex items-center justify-end">
                                <DollarSign className="w-4 h-4 text-[#AA8F66]" />
                                <span className="text-lg text-[#5A3A31]">
                                  {transaction.bidAmount
                                    ? transaction.bidAmount.toLocaleString()
                                    : "N/A"}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              className="mt-4 border-[#AA8F66] text-[#AA8F66] hover:bg-[#AA8F66]/10"
                              asChild
                            >
                              <a href={`/artwork/${item.id || "#"}`}>View Details</a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}