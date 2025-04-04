package auction.entities.RO;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BidRO {
    private BigDecimal bidAmount;
    private ItemRO item;
    private UserRO customer;  // ✅ Updated "user" to "customer"
    private Long itemId;
    private Long customerId;  // ✅ Updated "userId" to "customerId"
    private String imageBase64;  // Added field for image data

    public auction.entities.Bid toEntity(auction.entities.Item item, auction.entities.User customer) {
        return auction.entities.Bid.builder()
                .bidAmount(this.bidAmount)
                .item(item)
                .customer(customer)  // ✅ Fix: Use "customer" instead of "user"
                .build();
    }
}
