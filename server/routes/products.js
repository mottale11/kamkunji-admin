import express from 'express';
import { body, param, validationResult } from 'express-validator';

const router = express.Router();

// Get all products with optional filtering
router.get('/', async (req, res) => {
  try {
    const { category, status, search } = req.query;
    
    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters if provided
    if (category) {
      query = query.eq('category', category);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Product not found' });
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create new product (admin only)
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('price').isNumeric().withMessage('Valid price is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('stock').isInt({ min: 0 }).withMessage('Valid stock quantity is required'),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { data, error } = await supabase
        .from('products')
        .insert([
          {
            ...req.body,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      
      res.status(201).json(data);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  }
);

// Update product (admin only)
router.put(
  '/:id',
  [
    param('id').notEmpty().withMessage('Product ID is required'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('description').optional().notEmpty().withMessage('Description cannot be empty'),
    body('price').optional().isNumeric().withMessage('Valid price is required'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Valid stock quantity is required'),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      
      const { data: existingProduct, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !existingProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const { data, error } = await supabase
        .from('products')
        .update({
          ...req.body,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      res.json(data);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  }
);

// Delete product (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First check if product exists
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Soft delete by updating status
    const { data, error } = await supabase
      .from('products')
      .update({ 
        status: 'deleted',
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
