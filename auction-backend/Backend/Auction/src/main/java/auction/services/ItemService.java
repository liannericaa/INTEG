package auction.services;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import auction.entities.Category;
import auction.entities.DTO.ItemDTO;
import auction.entities.Item;
import auction.entities.RO.ItemRO;
import auction.entities.User;
import auction.entities.enums.AuctionStatus;
import auction.entities.enums.ItemStatus;
import auction.entities.enums.Role;
import auction.entities.utils.MessageUtils;
import auction.exceptions.ServiceException;
import auction.repositories.CategoryRepository;
import auction.repositories.ItemRepository;
import auction.repositories.UserRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    public List<Item> getAll() {
        try {
            return itemRepository.findAll();
        } catch (Exception e) {
            throw new ServiceException(MessageUtils.retrieveError("Items"), e);
        }
    }

    public List<Item> getAllByFilter(ItemStatus status, Long categoryId) {
        try {
            return itemRepository.findAllByOptionalFilters(status, categoryId);
        } catch (Exception e) {
            throw new ServiceException(MessageUtils.retrieveError("Filtered Items"), e);
        }
    }

    public Item getItemById(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new ServiceException(MessageUtils.notFound("Item"), new RuntimeException("Item not found")));
    }

    @Transactional
    public void save(ItemRO itemRO, HttpSession session) {
        try {
            User loggedInUser = (User) session.getAttribute("loggedInUser");
            if (loggedInUser == null || loggedInUser.getRole() != Role.SELLER) {
                throw new ServiceException("Only sellers can add items", new RuntimeException());
            }

            Category category = categoryRepository.findById(itemRO.getCategoryId())
                    .orElseThrow(() -> new ServiceException("Category not found", new RuntimeException()));

            Item item = itemRO.toEntity(loggedInUser, category);
            item.setImageBase64(itemRO.getImageBase64());

            item.setStatus(ItemStatus.PENDING);
            item.setAuctionStatus(AuctionStatus.NOT_STARTED);

            itemRepository.save(item);
            log.info(MessageUtils.saveSuccess("Item"));
        } catch (Exception e) {
            throw new ServiceException(MessageUtils.saveError("Item"), e);
        }
    }

    @Transactional
    public void update(Long id, ItemRO itemRO, HttpSession session) {
        try {
            User loggedInUser = (User) session.getAttribute("loggedInUser");
            if (loggedInUser == null || loggedInUser.getRole() != Role.SELLER) {
                throw new ServiceException("Only sellers can update items", new RuntimeException());
            }

            Item existingItem = getItemById(id);
            if (!existingItem.getSeller().getId().equals(loggedInUser.getId())) {
                throw new ServiceException("You can only update your own items", new RuntimeException());
            }

            existingItem.updateFromRO(itemRO);

            // Only update auction status if the item is APPROVED
            if (existingItem.getStartTime() != null
                    && existingItem.getStartTime().isBefore(LocalDateTime.now())
                    && existingItem.getStatus() == ItemStatus.APPROVED) {
                existingItem.setAuctionStatus(AuctionStatus.ACTIVE);
            } else {
                existingItem.setAuctionStatus(AuctionStatus.NOT_STARTED);
            }

            itemRepository.save(existingItem);
            log.info(MessageUtils.updateSuccess("Item"));
        } catch (Exception e) {
            throw new ServiceException(MessageUtils.updateError("Item"), e);
        }
    }

    @Transactional
    public ItemDTO updateItemStatus(Long itemId, Long adminId, ItemStatus status, HttpSession session) {
        try {
            User loggedInAdmin = (User) session.getAttribute("loggedInUser");
            if (loggedInAdmin == null || loggedInAdmin.getRole() != Role.ADMIN) {
                throw new ServiceException("Only admins can change item status", new RuntimeException());
            }

            Item item = itemRepository.findById(itemId)
                    .orElseThrow(() -> new ServiceException("Item not found", new RuntimeException()));

            User admin = userRepository.findById(adminId)
                    .orElseThrow(() -> new ServiceException("Admin not found", new RuntimeException()));

            item.setStatus(status);
            item.setApprovedAt(status == ItemStatus.APPROVED ? LocalDateTime.now() : null);
            item.setAdmin(status == ItemStatus.APPROVED ? admin : null);

            // If item is approved and start time has already passed, activate auction
            if (status == ItemStatus.APPROVED
                    && item.getStartTime() != null
                    && item.getStartTime().isBefore(LocalDateTime.now())) {
                item.setAuctionStatus(AuctionStatus.ACTIVE);
            } else {
                item.setAuctionStatus(AuctionStatus.NOT_STARTED);
            }

            itemRepository.save(item);
            return new ItemDTO(item);
        } catch (Exception e) {
            throw new ServiceException("Failed to change item status", e);
        }
    }

    @Transactional
    public void updateAuctionStatus(HttpSession session) {
        try {
            // Ensure that only an admin can update auction status
            User loggedInUser = (User) session.getAttribute("loggedInUser");
            if (loggedInUser == null || loggedInUser.getRole() != Role.ADMIN) {
                throw new ServiceException("Only admins can update auction status", new RuntimeException());
            }

            LocalDateTime now = LocalDateTime.now();
            List<Item> items = itemRepository.findAll();

            for (Item item : items) {
                if (item.getAuctionStatus() == AuctionStatus.NOT_STARTED
                        && item.getStartTime() != null
                        && item.getStartTime().isBefore(now)
                        && item.getStatus() == ItemStatus.APPROVED) {

                    item.setAuctionStatus(AuctionStatus.ACTIVE);
                    itemRepository.save(item);
                }
            }
            log.info("Auction status updated successfully for eligible items.");
        } catch (Exception e) {
            throw new ServiceException("Error updating auction status", e);
        }
    }


    @Transactional
    public void delete(Long id) {
        try {
            Item item = getItemById(id);
            itemRepository.delete(item);
            log.info(MessageUtils.deleteSuccess("Item"));
        } catch (Exception e) {
            throw new ServiceException(MessageUtils.deleteError("Item"), e);
        }
    }

    public List<Item> getItemsBySeller(Long sellerId) {
        try {
            return itemRepository.findBySellerId(sellerId);
        } catch (Exception e) {
            throw new ServiceException(MessageUtils.retrieveError("Seller Items"), e);
        }
    }

}
