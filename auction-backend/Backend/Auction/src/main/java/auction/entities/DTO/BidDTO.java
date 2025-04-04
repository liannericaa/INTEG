package auction.entities.DTO;


import java.math.BigDecimal;
import java.time.LocalDateTime;

import auction.entities.Bid;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Data Transfer Object for Bid entity
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BidDTO {
    private Long id;
    private BigDecimal bidAmount;
    private ItemDTO item; 
    private UserDTO customer;
    private String sellerName;
    private LocalDateTime bidTime;
    private String transactionId;
    private BigDecimal finalPrice;
    private String imageBase64;


   public BidDTO(Bid bid) {
    this.id = bid.getId();
    this.bidAmount = bid.getBidAmount();
    this.item = new ItemDTO(bid.getItem()); 
    this.customer = new UserDTO(bid.getCustomer());
    this.sellerName = bid.getSeller().getUsername();
    this.bidTime = bid.getBidTime();
    this.transactionId = "TRX-" + String.format("%03d", bid.getId());
    this.finalPrice = bid.getFinalPrice();
    this.imageBase64 = bid.getImageBase64();
   }
}
