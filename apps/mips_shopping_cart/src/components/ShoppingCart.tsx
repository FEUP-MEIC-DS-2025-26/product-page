import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Divider from "@mui/material/Divider";

// 1. Define the same interfaces as the host
export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  instanceId: string;
  product: Product;
}

// 2. The props interface is unchanged
interface ShoppingCartPageProps {
  items: CartItem[];
  onRemoveFromCart: (instanceId: string) => void;
}

// --- COMPONENT ---

const ShoppingCartPage = ({
  items = [],
  onRemoveFromCart = () => {},
}: ShoppingCartPageProps) => {
  // 3. Update total price calculation
  const totalPrice = items.reduce((sum, item) => sum + item.product.price, 0);

  return (
    <Box
      sx={{
        p: "1.5rem",
        border: "2px dashed",
        borderColor: "error.main",
        borderRadius: "8px",
        // --- FIXED ---
        // Replaced hard-coded "#1f1f1f" with theme-aware palette key
        bgcolor: "background.paper",
        // Removed hard-coded color: "#f1f1f1".
        // Typography components will now default to "text.primary".
        // ---
        maxWidth: "800px",
        my: "1rem",
        textAlign: "left",
      }}
    >
      <Typography
        variant="h4"
        component="h2"
        sx={{
          color: "error.main", // This was already theme-aware
          mt: 0,
          fontWeight: "bold",
        }}
      >
        🛒 Shopping Cart (Loaded from Remote)
      </Typography>

      <Typography variant="body1" sx={{ mb: 2 }}>
        Lists items from the host and calls `onRemoveFromCart`.
      </Typography>

      <Box>
        {items.length === 0 ? (
          <Typography variant="body1">Your cart is empty.</Typography>
        ) : (
          <List sx={{ padding: 0 }}>
            {items.map((item) => (
              <ListItem
                key={item.instanceId}
                sx={{
                  p: "1rem",
                  // --- FIXED ---
                  // Removed hard-coded 'bgcolor: "#2a2a2a"'.
                  // Item now sits on the parent's "background.paper".
                  // ---
                  borderRadius: "5px",
                  mb: "1rem",
                }}
                secondaryAction={
                  <Button
                    variant="contained"
                    color="error" // This was already theme-aware
                    onClick={() => onRemoveFromCart(item.instanceId)}
                    sx={{
                      fontWeight: "bold",
                    }}
                  >
                    Remove
                  </Button>
                }
              >
                <Box>
                  <Typography
                    variant="h6"
                    component="h4"
                    sx={{
                      margin: 0,
                      // --- FIXED ---
                      // Removed 'color: "inherit"' to allow
                      // default theme-aware text color.
                      // ---
                    }}
                  >
                    {item.product.name}
                  </Typography>
                  <Typography
                    variant="body1"
                    component="p"
                    sx={{
                      margin: "5px 0 0 0",
                      // --- FIXED ---
                      // Removed 'color: "inherit"'.
                      // ---
                    }}
                  >
                    ${item.product.price.toFixed(2)}
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {items.length > 0 && (
        <>
          {/* --- FIXED --- */}
          {/* Removed hard-coded 'borderColor: "#444"'. */}
          {/* Divider now correctly uses 'palette.divider'. */}
          {/* --- */}
          <Divider sx={{ my: 2 }} />
          <Typography
            variant="h5"
            component="h3"
            sx={{ textAlign: "right", fontWeight: "bold" }}
          >
            Total: ${totalPrice.toFixed(2)}
          </Typography>
        </>
      )}
    </Box>
  );
};

export default ShoppingCartPage;
