package auction.controllers;


import java.util.Base64;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import auction.entities.DTO.ItemDTO;
import auction.entities.Item;
import auction.entities.RO.ItemRO;
import auction.entities.enums.ItemStatus;
import auction.entities.utils.MessageUtils;
import auction.entities.utils.ResponseUtils;
import auction.exceptions.ServiceException;
import auction.services.CategoryService;
import auction.services.ItemService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/item")
@RequiredArgsConstructor
public class ItemController {


    private final ItemService itemService;
    private final CategoryService categoryService;


    @GetMapping
    public ResponseEntity<?> getAllItems() {
        return ResponseEntity.ok(ResponseUtils.buildSuccessResponse(
                HttpStatus.OK, MessageUtils.retrieveSuccess("Items"), itemService.getAll()
        ));
    }


    @GetMapping("/{id}")
    public ResponseEntity<?> getItemById(@PathVariable Long id) {
        try {
            // Get item with all relationships loaded
            Item item = itemService.getItemById(id);
           
            // Convert to DTO for proper data transformation
            ItemDTO itemDTO = new ItemDTO(item);
           
            // For debugging to check if startingPrice is included
            System.out.println("Returning item with startingPrice: " + itemDTO.getStartingPrice());
           
            return ResponseEntity.ok(ResponseUtils.buildSuccessResponse(
                    HttpStatus.OK, MessageUtils.retrieveSuccess("Item"), itemDTO
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ResponseUtils.buildErrorResponse(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Error retrieving item: " + e.getMessage()
            ));
        }
    }


    @GetMapping("/filter")
    public ResponseEntity<?> getItemsByFilter(
            @RequestParam(required = false) ItemStatus status,
            @RequestParam(required = false) Long categoryId) {


        if (categoryId != null && categoryService.getById(categoryId) == null) {
            return ResponseEntity.badRequest().body(ResponseUtils.buildErrorResponse(
                    HttpStatus.BAD_REQUEST, "Invalid category ID"
            ));
        }


        List<Item> items = itemService.getAllByFilter(status, categoryId);


        return ResponseEntity.ok(ResponseUtils.buildSuccessResponse(
                HttpStatus.OK, "Filtered items retrieved successfully", items
        ));
    }


    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<?> createItem(
            @Valid @ModelAttribute ItemRO itemRO,
            @RequestParam("image") MultipartFile image,
            BindingResult bindingResult,
            HttpSession session) {
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(ResponseUtils.buildErrorResponse(
                    HttpStatus.BAD_REQUEST, MessageUtils.validationErrors(bindingResult)
            ));
        }


        try {
            if (!image.isEmpty()) {
                String mimeType = image.getContentType();
                String base64Image = "data:" + mimeType + ";base64," +
                        Base64.getEncoder().encodeToString(image.getBytes());
                itemRO.setImageBase64(base64Image);
            }


            itemService.save(itemRO, session);
            return ResponseEntity.status(HttpStatus.CREATED).body(ResponseUtils.buildSuccessResponse(
                    HttpStatus.CREATED, MessageUtils.saveSuccess("Item")
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ResponseUtils.buildErrorResponse(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Failed to upload image"
            ));
        }
    }




    @PutMapping("/{id}")
    public ResponseEntity<?> updateItem(
            @PathVariable Long id,
            @Valid @RequestBody ItemRO itemRO,
            BindingResult bindingResult,
            HttpSession session) {
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(ResponseUtils.buildErrorResponse(
                    HttpStatus.BAD_REQUEST, MessageUtils.validationErrors(bindingResult)
            ));
        }
        itemService.update(id, itemRO, session);
        return ResponseEntity.ok(ResponseUtils.buildSuccessResponse(
                HttpStatus.OK, MessageUtils.updateSuccess("Item")
        ));
    }


    @PutMapping("/{itemId}/status")
    public ResponseEntity<ItemDTO> updateItemStatus(
            @PathVariable Long itemId,
            @RequestParam Long adminId,
            @RequestParam ItemStatus status,
            HttpSession session) {
        ItemDTO updatedItem = itemService.updateItemStatus(itemId, adminId, status, session);
        return ResponseEntity.ok(updatedItem);
    }


    @PutMapping("/auction/status")
    public ResponseEntity<?> updateAuctionStatus(HttpSession session) {
        try {
            itemService.updateAuctionStatus(session);
            return ResponseEntity.ok(ResponseUtils.buildSuccessResponse(
                    HttpStatus.OK, "Auction status updated successfully"
            ));
        } catch (ServiceException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ResponseUtils.buildErrorResponse(
                    HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage()
            ));
        }
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteItem(@PathVariable Long id) {
        itemService.delete(id);
        return ResponseEntity.ok(ResponseUtils.buildSuccessResponse(
                HttpStatus.OK, MessageUtils.deleteSuccess("Item")
        ));
    }
}