import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuctionForm from "./AuctionForm";
import AuctionWarning from "./AuctionWarning";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface CreateAuctionDialogProps {
  className?: string;
}

const CreateAuctionDialog: React.FC<CreateAuctionDialogProps> = ({ className }) => {
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [canEdit, setCanEdit] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleAuctionSubmit = () => {
    setIsSubmitted(true);
    setCanEdit(false);
  };

  const handleClose = () => {
    // Reset dialog state when closed
    if (!isSubmitted) {
      setIsOpen(false);
      setCanEdit(true);
    }
  };

  const handleFinish = () => {
    setIsOpen(false);
    setIsSubmitted(false);
    setCanEdit(true);
    // Optionally navigate to another page or refresh current page
    navigate("/seller/dashboard");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className={`bg-[#AA8F66] hover:bg-[#AA8F66]/90 text-white ${className}`}>
          <Plus size={20} className="mr-2" />
          Create New Auction
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {!isSubmitted ? (
          <div className="p-4">
            <div className="mt-6">
              <AuctionForm
                onSubmit={handleAuctionSubmit}
                isEditable={canEdit}
              />
            </div>
          </div>
        ) : (
          <div className="p-6">
            <AuctionWarning auctionId={""} onFinish={handleFinish} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateAuctionDialog; 