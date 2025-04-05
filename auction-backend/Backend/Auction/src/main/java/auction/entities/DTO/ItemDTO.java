package auction.entities.DTO;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import auction.entities.Item;
import auction.entities.enums.AuctionStatus;
import auction.entities.enums.ItemStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ItemDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private Long id;
    private String name;
    private String description;
    private BigDecimal startingPrice;
    private BigDecimal bidIncrement;
    private ItemStatus status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private AuctionStatus auctionStatus;

    public ItemDTO(Item item) {
        this.id = item.getId();
        this.name = item.getName();
        this.description = item.getDescription();
        this.startingPrice = item.getStartingPrice();
        this.bidIncrement = item.getBidIncrement();
        this.status = item.getStatus();
        this.startTime = item.getStartTime();
        this.endTime = item.getEndTime();
        this.auctionStatus = item.getAuctionStatus();
    }
}
