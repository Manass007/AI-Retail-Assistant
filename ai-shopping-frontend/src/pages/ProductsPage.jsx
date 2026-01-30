import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Paper,
  Typography,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { productsAPI } from '../api/products';
import ProductGrid from '../components/product/ProductGrid';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { CATEGORIES } from '../utils/constants';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    inStock: '',
  });

  useEffect(() => {
    fetchProducts();
  }, [page, filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
      };

      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.minPrice) params.min_price = parseFloat(filters.minPrice);
      if (filters.maxPrice) params.max_price = parseFloat(filters.maxPrice);
      if (filters.inStock !== '') params.in_stock = filters.inStock === 'true';

      const response = await productsAPI.getProducts(params);
      if (response.success) {
        setProducts(response.products || []);
        setTotalPages(response.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page on filter change
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Products
      </Typography>

      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category}
                label="Category"
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Min Price"
              type="number"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Max Price"
              type="number"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Stock</InputLabel>
              <Select
                value={filters.inStock}
                label="Stock"
                onChange={(e) => handleFilterChange('inStock', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">In Stock</MenuItem>
                <MenuItem value="false">Out of Stock</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <ProductGrid products={products} />
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default ProductsPage;
