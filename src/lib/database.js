// ============================================================
// BoutiKonect Database Helper Functions
// ============================================================

import { supabase } from './supabase';

// -------------------------------------------------------------------
// Error handler wrapper
// -------------------------------------------------------------------
function handleError(error, context) {
  if (error) {
    console.error(`[DB] ${context}:`, error.message, error.details, error.hint);
    throw new Error(`${context}: ${error.message}`);
  }
}

// -------------------------------------------------------------------
// Shared utilities for pagination and entity queries
// -------------------------------------------------------------------

/**
 * Apply offset/limit pagination to a Supabase query.
 * Every list function should use this instead of manually calling .range().
 *
 * @param {object} query - Supabase query builder
 * @param {number} offset - Number of records to skip
 * @param {number} limit - Max records to return
 * @returns {object} Query builder with range applied
 */
function paginate(query, offset = 0, limit = 20) {
  return query.range(offset, offset + limit - 1);
}

/**
 * Get aggregate rating for any entity type (product or service).
 * Replaces the duplicated getProductRating / getServiceRating pattern.
 *
 * @param {string} entityType - 'product' or 'service'
 * @param {string} entityId - Entity UUID
 * @returns {Promise<{average: number, count: number, distribution: object}>}
 */
async function getEntityRating(entityType, entityId) {
  if (!entityId || !entityType) {
    return { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  }

  const column = entityType === 'service' ? 'service_id' : 'product_id';

  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq(column, entityId)
    .eq('status', 'approved');

  if (error) {
    console.error(`[DB] getEntityRating (${entityType}):`, error.message);
    return { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  }

  if (!data || data.length === 0) {
    return { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  }

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;

  data.forEach((r) => {
    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    sum += r.rating;
  });

  return {
    average: Math.round((sum / data.length) * 100) / 100,
    count: data.length,
    distribution,
  };
}

// -------------------------------------------------------------------
// 1. PROFILE HELPERS
// -------------------------------------------------------------------

/**
 * Get a single profile by user ID.
 * @param {string} id - User UUID
 * @returns {Promise<object|null>} Profile data or null
 */
export async function getProfile(id) {
  if (!id) throw new Error('getProfile: id is required');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    handleError(error, 'getProfile');
  }
  return data || null;
}

/**
 * Update a profile. Only the authenticated user can update their own profile
 * (enforced by RLS).
 * @param {string} id - User UUID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated profile
 */
export async function updateProfile(id, updates) {
  if (!id) throw new Error('updateProfile: id is required');
  if (!updates || typeof updates !== 'object') {
    throw new Error('updateProfile: updates object is required');
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  handleError(error, 'updateProfile');
  return data;
}

/**
 * Get all profiles (admin function).
 * @param {object} options - { limit, offset, role, search }
 * @returns {Promise<Array>} Array of profiles
 */
export async function getAllProfiles(options = {}) {
  const { limit = 50, offset = 0, role, search } = options;

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' });

  if (role) {
    query = query.eq('role', role);
  }

  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,store_name.ilike.%${search}%`
    );
  }

  query = query.order('created_at', { ascending: false });
  query = paginate(query, offset, limit);

  const { data, error, count } = await query;

  handleError(error, 'getAllProfiles');
  return { data: data || [], count: count || 0 };
}

/**
 * Search profiles by name, store, or city.
 * @param {string} query - Search term
 * @param {object} options - { limit, offset, role }
 * @returns {Promise<Array>} Matching profiles
 */
export async function searchProfiles(query, options = {}) {
  const { limit = 20, offset = 0, role } = options;

  if (!query || typeof query !== 'string') {
    return { data: [], count: 0 };
  }

  let dbQuery = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .or(
      `full_name.ilike.%${query}%,store_name.ilike.%${query}%,city.ilike.%${query}%,bio.ilike.%${query}%`
    );

  if (role) {
    dbQuery = dbQuery.eq('role', role);
  }

  dbQuery = dbQuery.order('rating', { ascending: false });
  dbQuery = paginate(dbQuery, offset, limit);

  const { data, error, count } = await dbQuery;

  handleError(error, 'searchProfiles');
  return { data: data || [], count: count || 0 };
}

// -------------------------------------------------------------------
// 2. PRODUCT HELPERS
// -------------------------------------------------------------------

/**
 * Get products with optional filters.
 * @param {object} filters
 * @param {string} filters.category - Product category
 * @param {string} filters.sellerId - Filter by seller
 * @param {string} filters.status - Product status
 * @param {string} filters.search - Text search in title/description
 * @param {number} filters.minPrice - Minimum price
 * @param {number} filters.maxPrice - Maximum price
 * @param {string} filters.department - Filter by department
 * @param {string} filters.city - Filter by city
 * @param {boolean} filters.promoted - Only promoted items
 * @param {boolean} filters.featured - Only featured items
 * @param {string} filters.sortBy - Sort field (price, created_at, rating)
 * @param {string} filters.sortOrder - 'asc' or 'desc'
 * @param {number} filters.limit - Results per page
 * @param {number} filters.offset - Pagination offset
 * @returns {Promise<{data: Array, count: number}>}
 */
export async function getProducts(filters = {}) {
  const {
    category,
    sellerId,
    status,
    search,
    minPrice,
    maxPrice,
    department,
    city,
    promoted,
    featured,
    sortBy = 'created_at',
    sortOrder = 'desc',
    limit = 20,
    offset = 0,
  } = filters;

  let query = supabase
    .from('products')
    .select(
      `
      *,
      seller:profiles!products_seller_id_fkey(full_name, store_name, avatar_url, is_verified, city)
    `,
      { count: 'exact' }
    );

  // Filters
  if (category) {
    query = query.eq('category', category);
  }

  if (sellerId) {
    query = query.eq('seller_id', sellerId);
  }

  if (status) {
    query = query.eq('status', status);
  } else {
    // By default, only show active products for non-seller views
    query = query.eq('status', 'active');
  }

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,description.ilike.%${search}%,short_description.ilike.%${search}%`
    );
  }

  if (minPrice != null) {
    query = query.gte('price', minPrice);
  }

  if (maxPrice != null) {
    query = query.lte('price', maxPrice);
  }

  if (department) {
    query = query.eq('department', department);
  }

  if (city) {
    query = query.ilike('city', `%${city}%`);
  }

  if (promoted) {
    query = query.eq('is_promoted', true).gte('promoted_until', new Date().toISOString());
  }

  if (featured) {
    query = query.eq('is_featured', true);
  }

  // Sorting
  const allowedSortFields = ['price', 'created_at', 'rating', 'title', 'view_count', 'saved_count'];
  const field = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
  const order = sortOrder === 'asc' ? { ascending: true } : { ascending: false };
  query = query.order(field, order);

  // Pagination
  query = paginate(query, offset, limit);

  const { data, error, count } = await query;

  handleError(error, 'getProducts');
  return { data: data || [], count: count || 0 };
}

/**
 * Get a single product by ID with seller info.
 * @param {string} id - Product UUID
 * @returns {Promise<object|null>}
 */
export async function getProductById(id) {
  if (!id) throw new Error('getProductById: id is required');

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      seller:profiles!products_seller_id_fkey(*)
    `
    )
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    handleError(error, 'getProductById');
  }

  // Increment view count (fire-and-forget)
  if (data) {
    supabase
      .from('products')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', id)
      .then(({ error: updateError }) => {
        if (updateError) {
          console.warn('[DB] Failed to increment view count:', updateError.message);
        }
      });
  }

  return data || null;
}

/**
 * Create a new product.
 * @param {object} product - Product data
 * @returns {Promise<object>} Created product
 */
export async function createProduct(product) {
  if (!product || !product.title || product.price == null) {
    throw new Error('createProduct: title and price are required');
  }

  // Generate a URL-safe slug from the title
  const slug = product.title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '') + '-' + Date.now().toString(36);

  const { data, error } = await supabase
    .from('products')
    .insert({
      ...product,
      slug,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  handleError(error, 'createProduct');
  return data;
}

/**
 * Update a product.
 * @param {string} id - Product UUID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated product
 */
export async function updateProduct(id, updates) {
  if (!id) throw new Error('updateProduct: id is required');
  if (!updates || typeof updates !== 'object') {
    throw new Error('updateProduct: updates object is required');
  }

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  handleError(error, 'updateProduct');
  return data;
}

/**
 * Delete a product.
 * @param {string} id - Product UUID
 * @returns {Promise<void>}
 */
export async function deleteProduct(id) {
  if (!id) throw new Error('deleteProduct: id is required');

  const { error } = await supabase.from('products').delete().eq('id', id);

  handleError(error, 'deleteProduct');
}

// -------------------------------------------------------------------
// 3. SERVICE HELPERS
// -------------------------------------------------------------------

/**
 * Get services with optional filters.
 * @param {object} filters - Same structure as getProducts filters
 * @returns {Promise<{data: Array, count: number}>}
 */
export async function getServices(filters = {}) {
  const {
    category,
    sellerId,
    status,
    search,
    minPrice,
    maxPrice,
    department,
    city,
    promoted,
    featured,
    remoteAvailable,
    sortBy = 'created_at',
    sortOrder = 'desc',
    limit = 20,
    offset = 0,
  } = filters;

  let query = supabase
    .from('services')
    .select(
      `
      *,
      seller:profiles!services_seller_id_fkey(full_name, store_name, avatar_url, is_verified, city)
    `,
      { count: 'exact' }
    );

  if (category) {
    query = query.eq('category', category);
  }

  if (sellerId) {
    query = query.eq('seller_id', sellerId);
  }

  if (status) {
    query = query.eq('status', status);
  } else {
    query = query.eq('status', 'active');
  }

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  if (minPrice != null) {
    query = query.gte('price', minPrice);
  }

  if (maxPrice != null) {
    query = query.lte('price', maxPrice);
  }

  if (department) {
    query = query.eq('department', department);
  }

  if (city) {
    query = query.ilike('city', `%${city}%`);
  }

  if (promoted) {
    query = query.eq('is_promoted', true).gte('promoted_until', new Date().toISOString());
  }

  if (featured) {
    query = query.eq('is_featured', true);
  }

  if (remoteAvailable) {
    query = query.eq('is_remote_available', true);
  }

  const allowedSortFields = ['price', 'created_at', 'rating', 'title', 'view_count'];
  const field = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
  const order = sortOrder === 'asc' ? { ascending: true } : { ascending: false };
  query = query.order(field, order);
  query = paginate(query, offset, limit);

  const { data, error, count } = await query;

  handleError(error, 'getServices');
  return { data: data || [], count: count || 0 };
}

/**
 * Get a single service by ID with seller info.
 * @param {string} id - Service UUID
 * @returns {Promise<object|null>}
 */
export async function getServiceById(id) {
  if (!id) throw new Error('getServiceById: id is required');

  const { data, error } = await supabase
    .from('services')
    .select(
      `
      *,
      seller:profiles!services_seller_id_fkey(*)
    `
    )
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    handleError(error, 'getServiceById');
  }

  // Increment view count (fire-and-forget)
  if (data) {
    supabase
      .from('services')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', id)
      .then(({ error: updateError }) => {
        if (updateError) {
          console.warn('[DB] Failed to increment service view count:', updateError.message);
        }
      });
  }

  return data || null;
}

/**
 * Create a new service.
 * @param {object} service - Service data
 * @returns {Promise<object>} Created service
 */
export async function createService(service) {
  if (!service || !service.title) {
    throw new Error('createService: title is required');
  }
  if (service.price == null && service.pricing_type !== 'custom_quote') {
    throw new Error('createService: price is required');
  }

  const slug =
    service.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '') +
    '-' +
    Date.now().toString(36);

  const { data, error } = await supabase
    .from('services')
    .insert({
      ...service,
      slug,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  handleError(error, 'createService');
  return data;
}

/**
 * Update a service.
 * @param {string} id - Service UUID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated service
 */
export async function updateService(id, updates) {
  if (!id) throw new Error('updateService: id is required');
  if (!updates || typeof updates !== 'object') {
    throw new Error('updateService: updates object is required');
  }

  const { data, error } = await supabase
    .from('services')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  handleError(error, 'updateService');
  return data;
}

/**
 * Delete a service.
 * @param {string} id - Service UUID
 * @returns {Promise<void>}
 */
export async function deleteService(id) {
  if (!id) throw new Error('deleteService: id is required');

  const { error } = await supabase.from('services').delete().eq('id', id);

  handleError(error, 'deleteService');
}

// -------------------------------------------------------------------
// 4. ORDER HELPERS
// -------------------------------------------------------------------

/**
 * Get orders with optional filters.
 * @param {object} filters
 * @param {string} filters.buyerId - Filter by buyer
 * @param {string} filters.sellerId - Filter by seller
 * @param {string} filters.status - Order status
 * @param {string} filters.search - Search by order number
 * @param {boolean} filters.isPaid - Filter by payment status
 * @param {string} filters.sortBy - Sort field
 * @param {string} filters.sortOrder - 'asc' or 'desc'
 * @param {number} filters.limit - Results per page
 * @param {number} filters.offset - Pagination offset
 * @returns {Promise<{data: Array, count: number}>}
 */
export async function getOrders(filters = {}) {
  const {
    buyerId,
    sellerId,
    status,
    search,
    isPaid,
    sortBy = 'created_at',
    sortOrder = 'desc',
    limit = 20,
    offset = 0,
  } = filters;

  let query = supabase
    .from('orders')
    .select(
      `
      *,
      buyer:profiles!orders_buyer_id_fkey(full_name, email, phone, avatar_url),
      seller:profiles!orders_seller_id_fkey(full_name, store_name, email, phone, avatar_url),
      product:products!orders_product_id_fkey(title, slug, cover_image, price),
      service:services!orders_service_id_fkey(title, slug, cover_image, price)
    `,
      { count: 'exact' }
    );

  if (buyerId) {
    query = query.eq('buyer_id', buyerId);
  }

  if (sellerId) {
    query = query.eq('seller_id', sellerId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (isPaid != null) {
    query = query.eq('is_paid', isPaid);
  }

  if (search) {
    query = query.ilike('order_number', `%${search}%`);
  }

  const allowedSortFields = ['created_at', 'total_amount', 'status', 'updated_at'];
  const field = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
  const order = sortOrder === 'asc' ? { ascending: true } : { ascending: false };
  query = query.order(field, order);
  query = paginate(query, offset, limit);

  const { data, error, count } = await query;

  handleError(error, 'getOrders');
  return { data: data || [], count: count || 0 };
}

/**
 * Create a new order.
 * @param {object} orderData - Order data
 * @returns {Promise<object>} Created order
 */
export async function createOrder(orderData) {
  if (!orderData) {
    throw new Error('createOrder: order data is required');
  }

  if (!orderData.buyer_id) {
    throw new Error('createOrder: buyer_id is required');
  }

  if (!orderData.seller_id) {
    throw new Error('createOrder: seller_id is required');
  }

  if (orderData.total_amount == null || orderData.total_amount < 0) {
    throw new Error('createOrder: valid total_amount is required');
  }

  // Validate quantity: must be a positive integer
  const quantity = orderData.quantity != null ? orderData.quantity : 1;
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error('createOrder: quantity must be a positive integer');
  }

  // Generate unique order number
  const orderNumber = `BK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  // Determine item_type from product_id or service_id
  const itemType = orderData.product_id ? 'product' : orderData.service_id ? 'service' : 'product';

  // Calculate unit_price and subtotal if not provided
  const unitPrice = orderData.unit_price ?? (orderData.total_amount / quantity);
  const subtotal = orderData.subtotal ?? orderData.total_amount;

  const { data, error } = await supabase
    .from('orders')
    .insert({
      ...orderData,
      order_number: orderNumber,
      item_type: itemType,
      quantity,
      unit_price: unitPrice,
      subtotal,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  handleError(error, 'createOrder');
  return data;
}

/**
 * Delete an order by ID (used for rollback on partial batch failure).
 * @param {string} id - Order UUID
 * @returns {Promise<void>}
 */
export async function deleteOrder(id) {
  if (!id) throw new Error('deleteOrder: id is required');

  const { error } = await supabase.from('orders').delete().eq('id', id);

  handleError(error, 'deleteOrder');
}

/**
 * Update an order's status.
 * @param {string} id - Order UUID
 * @param {string} status - New status
 * @param {object} additionalUpdates - Any other fields to update (e.g., tracking info)
 * @returns {Promise<object>} Updated order
 */
export async function updateOrderStatus(id, status, additionalUpdates = {}) {
  if (!id) throw new Error('updateOrderStatus: id is required');
  if (!status) throw new Error('updateOrderStatus: status is required');

  const validStatuses = [
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ];

  if (!validStatuses.includes(status)) {
    throw new Error(
      `updateOrderStatus: invalid status "${status}". Must be one of: ${validStatuses.join(', ')}`
    );
  }

  const updates = {
    status,
    ...additionalUpdates,
    updated_at: new Date().toISOString(),
  };

  // Auto-set timestamps for terminal statuses
  if (status === 'delivered') {
    updates.delivered_at = new Date().toISOString();
    updates.is_paid = true;
    updates.paid_at = new Date().toISOString();
  }

  if (status === 'cancelled') {
    updates.cancelled_at = new Date().toISOString();
  }

  if (status === 'refunded') {
    updates.refunded_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  handleError(error, 'updateOrderStatus');
  return data;
}

/**
 * Get all orders (admin function).
 * @param {object} options - { limit, offset, status, startDate, endDate }
 * @returns {Promise<{data: Array, count: number}>}
 */
export async function getAllOrders(options = {}) {
  const { limit = 50, offset = 0, status, startDate, endDate } = options;

  let query = supabase
    .from('orders')
    .select(
      `
      *,
      buyer:profiles!orders_buyer_id_fkey(full_name, email, phone),
      seller:profiles!orders_seller_id_fkey(full_name, store_name, email)
    `,
      { count: 'exact' }
    );

  if (status) {
    query = query.eq('status', status);
  }

  if (startDate) {
    query = query.gte('created_at', startDate);
  }

  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  query = query.order('created_at', { ascending: false });
  query = paginate(query, offset, limit);

  const { data, error, count } = await query;

  handleError(error, 'getAllOrders');
  return { data: data || [], count: count || 0 };
}

// -------------------------------------------------------------------
// 5. REVIEW HELPERS
// -------------------------------------------------------------------

/**
 * Get reviews for a product.
 * @param {string} productId - Product UUID
 * @param {object} options - { limit, offset, status, sortBy }
 * @returns {Promise<{data: Array, count: number}>}
 */
export async function getProductReviews(productId, options = {}) {
  if (!productId) throw new Error('getProductReviews: productId is required');

  const { limit = 20, offset = 0, status = 'approved', sortBy = 'created_at' } = options;

  let query = supabase
    .from('reviews')
    .select(
      `
      *,
      reviewer:profiles!reviews_reviewer_id_fkey(full_name, avatar_url, is_verified)
    `,
      { count: 'exact' }
    )
    .eq('product_id', productId);

  if (status) {
    query = query.eq('status', status);
  }

  const allowedSort = ['created_at', 'rating', 'helpful_count'];
  const field = allowedSort.includes(sortBy) ? sortBy : 'created_at';
  query = query.order(field, { ascending: false });
  query = paginate(query, offset, limit);

  const { data, error, count } = await query;

  handleError(error, 'getProductReviews');
  return { data: data || [], count: count || 0 };
}

/**
 * Get reviews for a service.
 * @param {string} serviceId - Service UUID
 * @param {object} options - { limit, offset, status, sortBy }
 * @returns {Promise<{data: Array, count: number}>}
 */
export async function getServiceReviews(serviceId, options = {}) {
  if (!serviceId) throw new Error('getServiceReviews: serviceId is required');

  const { limit = 20, offset = 0, status = 'approved', sortBy = 'created_at' } = options;

  let query = supabase
    .from('reviews')
    .select(
      `
      *,
      reviewer:profiles!reviews_reviewer_id_fkey(full_name, avatar_url, is_verified)
    `,
      { count: 'exact' }
    )
    .eq('service_id', serviceId);

  if (status) {
    query = query.eq('status', status);
  }

  const allowedSort = ['created_at', 'rating', 'helpful_count'];
  const field = allowedSort.includes(sortBy) ? sortBy : 'created_at';
  query = query.order(field, { ascending: false });
  query = paginate(query, offset, limit);

  const { data, error, count } = await query;

  handleError(error, 'getServiceReviews');
  return { data: data || [], count: count || 0 };
}

/**
 * Create a review for a product or service.
 * @param {object} review - { reviewer_id, product_id or service_id, rating, title, comment, images }
 * @returns {Promise<object>} Created review
 */
export async function createReview(review) {
  if (!review) throw new Error('createReview: review data is required');
  if (!review.reviewer_id) throw new Error('createReview: reviewer_id is required');
  if (!review.rating || review.rating < 1 || review.rating > 5) {
    throw new Error('createReview: rating must be between 1 and 5');
  }
  if (!review.product_id && !review.service_id) {
    throw new Error('createReview: either product_id or service_id is required');
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      ...review,
      status: review.status || 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  handleError(error, 'createReview');
  return data;
}

/**
 * Get aggregate rating for a product.
 * @param {string} productId - Product UUID
 * @returns {Promise<{average: number, count: number, distribution: object}>}
 */
export async function getProductRating(productId) {
  return getEntityRating('product', productId);
}

export async function getServiceRating(serviceId) {
  return getEntityRating('service', serviceId);
}

// -------------------------------------------------------------------
// 6. REPORT HELPERS
// -------------------------------------------------------------------

/**
 * Create a report.
 * @param {object} report - { reporter_id, reported_user_id?, product_id?, service_id?, review_id?, reason, description }
 * @returns {Promise<object>} Created report
 */
export async function createReport(report) {
  if (!report) throw new Error('createReport: report data is required');
  if (!report.reporter_id) throw new Error('createReport: reporter_id is required');
  if (!report.reason) throw new Error('createReport: reason is required');

  const validReasons = ['spam', 'inappropriate', 'fake', 'offensive', 'other'];
  if (!validReasons.includes(report.reason)) {
    throw new Error(
      `createReport: invalid reason "${report.reason}". Must be one of: ${validReasons.join(', ')}`
    );
  }

  const { data, error } = await supabase
    .from('reports')
    .insert({
      ...report,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  handleError(error, 'createReport');
  return data;
}

/**
 * Get pending reports (admin function).
 * @param {object} options - { limit, offset, status, reason }
 * @returns {Promise<{data: Array, count: number}>}
 */
export async function getPendingReports(options = {}) {
  const { limit = 20, offset = 0, status = 'pending', reason } = options;

  let query = supabase
    .from('reports')
    .select(
      `
      *,
      reporter:profiles!reports_reporter_id_fkey(full_name, email),
      reported_user:profiles!reports_reported_user_id_fkey(full_name, email),
      product:products!reports_product_id_fkey(title, slug),
      service:services!reports_service_id_fkey(title, slug),
      review:reviews!reports_review_id_fkey(rating, comment)
    `,
      { count: 'exact' }
    );

  if (status) {
    query = query.eq('status', status);
  }

  if (reason) {
    query = query.eq('reason', reason);
  }

  query = query.order('created_at', { ascending: false });
  query = paginate(query, offset, limit);

  const { data, error, count } = await query;

  handleError(error, 'getPendingReports');
  return { data: data || [], count: count || 0 };
}

/**
 * Resolve a report (admin function).
 * @param {string} id - Report UUID
 * @param {string} resolution - 'resolved' or 'dismissed'
 * @param {string} note - Resolution note
 * @param {string} resolvedBy - Admin user ID
 * @returns {Promise<object>} Updated report
 */
export async function resolveReport(id, resolution, note, resolvedBy) {
  if (!id) throw new Error('resolveReport: id is required');
  if (!resolution) throw new Error('resolveReport: resolution status is required');

  if (!['resolved', 'dismissed'].includes(resolution)) {
    throw new Error('resolveReport: resolution must be "resolved" or "dismissed"');
  }

  const { data, error } = await supabase
    .from('reports')
    .update({
      status: resolution,
      resolution_note: note || null,
      resolved_by: resolvedBy || null,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  handleError(error, 'resolveReport');
  return data;
}

// -------------------------------------------------------------------
// 7. IMAGE UPLOAD HELPERS
// -------------------------------------------------------------------

/**
 * Upload a single image to a Supabase storage bucket.
 * @param {File} file - File object to upload
 * @param {string} bucket - Storage bucket name ('avatars', 'products', 'services', 'reviews', 'banners', 'logos')
 * @param {string} path - Optional path prefix (e.g., userId)
 * @returns {Promise<string>} Public URL of the uploaded image
 */
export async function uploadImage(file, bucket = 'products', path = '') {
  if (!file) throw new Error('uploadImage: file is required');

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      `uploadImage: invalid file type "${file.type}". Allowed: ${allowedTypes.join(', ')}`
    );
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('uploadImage: file size must be less than 5MB');
  }

  // Generate a unique file path
  const ext = file.name.split('.').pop();
  const timestamp = Date.now();
  const uniqueName = `${timestamp}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const filePath = path ? `${path}/${uniqueName}` : uniqueName;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  handleError(error, 'uploadImage');

  // Get the public URL
  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

  return publicUrlData?.publicUrl || null;
}

/**
 * Upload multiple images to a Supabase storage bucket.
 * @param {File[]} files - Array of File objects
 * @param {string} bucket - Storage bucket name
 * @param {string} path - Optional path prefix
 * @returns {Promise<string[]>} Array of public URLs
 */
export async function uploadMultipleImages(files, bucket = 'products', path = '') {
  if (!files || !Array.isArray(files) || files.length === 0) {
    throw new Error('uploadMultipleImages: files array is required');
  }

  if (files.length > 10) {
    throw new Error('uploadMultipleImages: maximum 10 files at a time');
  }

  const uploadPromises = files.map((file) => uploadImage(file, bucket, path));
  const results = await Promise.allSettled(uploadPromises);

  const urls = [];
  const errors = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      urls.push(result.value);
    } else {
      errors.push({ index, error: result.reason?.message || 'Upload failed' });
    }
  });

  if (errors.length > 0) {
    console.warn('[DB] Some images failed to upload:', errors);
  }

  return urls;
}

/**
 * Delete an image from storage.
 * @param {string} url - Public URL of the image to delete
 * @param {string} bucket - Storage bucket name
 * @returns {Promise<boolean>} Whether deletion was successful
 */
export async function deleteImage(url, bucket = 'products') {
  if (!url) throw new Error('deleteImage: url is required');

  // Extract file path from URL
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    // The path is everything after the bucket name in the URL
    const bucketIndex = pathParts.findIndex((p) => p === bucket);
    if (bucketIndex === -1) {
      throw new Error('Could not determine file path from URL');
    }
    const filePath = pathParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      console.warn('[DB] deleteImage:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('[DB] deleteImage: failed to parse URL', err.message);
    return false;
  }
}

// -------------------------------------------------------------------
// 8. STATS HELPERS
// -------------------------------------------------------------------

/**
 * Get admin dashboard statistics.
 * @returns {Promise<object>} Stats object
 */
export async function getAdminStats() {
  const { data, error } = await supabase.rpc('get_admin_dashboard_stats');

  if (error) {
    // Fallback: aggregate manually
    console.warn('[DB] getAdminStats RPC failed, falling back to manual aggregation');

    const [
      { count: totalUsers },
      { count: buyerCount },
      { count: sellerCount },
      { count: activeProducts },
      { count: activeServices },
      { count: totalOrders },
      { count: pendingOrders },
      { count: pendingReviews },
      { count: pendingReports },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'buyer'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'seller'),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('services').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ]);

    // Get revenue
    const { data: revenueData } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('status', 'delivered');

    const totalRevenue =
      revenueData?.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0) || 0;

    return {
      total_users: totalUsers || 0,
      total_buyers: buyerCount || 0,
      total_sellers: sellerCount || 0,
      total_products: activeProducts || 0,
      total_services: activeServices || 0,
      total_orders: totalOrders || 0,
      total_revenue: totalRevenue,
      pending_orders: pendingOrders || 0,
      pending_reviews: pendingReviews || 0,
      pending_reports: pendingReports || 0,
    };
  }

  return data;
}

/**
 * Get seller dashboard statistics.
 * @param {string} sellerId - Seller UUID
 * @returns {Promise<object>} Stats object
 */
export async function getSellerStats(sellerId) {
  if (!sellerId) throw new Error('getSellerStats: sellerId is required');

  const { data, error } = await supabase.rpc('get_seller_dashboard_stats', {
    p_seller_id: sellerId,
  });

  if (error) {
    // Fallback: aggregate manually
    console.warn('[DB] getSellerStats RPC failed, falling back to manual aggregation');

    const [
      { count: totalProducts },
      { count: activeProducts },
      { count: totalServices },
      { count: activeServices },
      { count: totalOrders },
      { count: pendingOrders },
      { count: processingOrders },
      { count: deliveredOrders },
      { count: cancelledOrders },
    ] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('seller_id', sellerId),
      supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', sellerId)
        .eq('status', 'active'),
      supabase.from('services').select('*', { count: 'exact', head: true }).eq('seller_id', sellerId),
      supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', sellerId)
        .eq('status', 'active'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('seller_id', sellerId),
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', sellerId)
        .eq('status', 'pending'),
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', sellerId)
        .eq('status', 'processing'),
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', sellerId)
        .eq('status', 'delivered'),
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', sellerId)
        .eq('status', 'cancelled'),
    ]);

    // Revenue
    const { data: revenueData } = await supabase
      .from('orders')
      .select('total_amount, created_at')
      .eq('seller_id', sellerId)
      .eq('status', 'delivered');

    const totalRevenue =
      revenueData?.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0) || 0;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthlyRevenue =
      revenueData
        ?.filter((o) => o.created_at >= monthStart)
        .reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0) || 0;

    // Average rating
    const { data: productRatings } = await supabase
      .from('products')
      .select('rating')
      .eq('seller_id', sellerId)
      .gt('review_count', 0);

    const avgRating =
      productRatings && productRatings.length > 0
        ? productRatings.reduce((sum, p) => sum + (parseFloat(p.rating) || 0), 0) /
          productRatings.length
        : 0;

    return {
      total_products: totalProducts || 0,
      active_products: activeProducts || 0,
      total_services: totalServices || 0,
      active_services: activeServices || 0,
      total_orders: totalOrders || 0,
      pending_orders: pendingOrders || 0,
      processing_orders: processingOrders || 0,
      delivered_orders: deliveredOrders || 0,
      cancelled_orders: cancelledOrders || 0,
      total_revenue: totalRevenue,
      monthly_revenue: monthlyRevenue,
      average_rating: Math.round(avgRating * 100) / 100,
    };
  }

  return data;
}

// -------------------------------------------------------------------
// 9. SAVED ITEMS (WISHLIST) HELPERS
// -------------------------------------------------------------------

/**
 * Toggle a saved item (add or remove).
 * @param {string} userId - User UUID
 * @param {string} productId - Product UUID (optional if serviceId provided)
 * @param {string} serviceId - Service UUID (optional if productId provided)
 * @returns {Promise<{saved: boolean}>} Whether the item is now saved
 */
export async function toggleSavedItem(userId, productId, serviceId) {
  if (!userId) throw new Error('toggleSavedItem: userId is required');
  if (!productId && !serviceId) {
    throw new Error('toggleSavedItem: either productId or serviceId is required');
  }

  // Determine which item we're toggling
  const itemId = productId || serviceId;

  // Check if already saved
  let query = supabase
    .from('saved_items')
    .select('id');

  if (productId) {
    query = query.eq('user_id', userId).eq('product_id', productId);
  } else {
    query = query.eq('user_id', userId).eq('service_id', serviceId);
  }

  const { data: existing } = await query;

  if (existing && existing.length > 0) {
    // Remove
    const { error } = await supabase
      .from('saved_items')
      .delete()
      .eq('id', existing[0].id);

    handleError(error, 'toggleSavedItem (remove)');

    // Decrement saved_count atomically via RPC
    const { error: rpcErr } = await supabase.rpc('increment_saved_count', {
      p_item_id: itemId,
      p_amount: -1,
    });
    if (rpcErr) console.warn('[DB] Failed to decrement saved_count:', rpcErr.message);

    return { saved: false };
  } else {
    // Add
    const { error } = await supabase.from('saved_items').insert({
      user_id: userId,
      product_id: productId || null,
      service_id: serviceId || null,
      created_at: new Date().toISOString(),
    });

    handleError(error, 'toggleSavedItem (add)');

    // Increment saved_count atomically via RPC
    const { error: rpcErr } = await supabase.rpc('increment_saved_count', {
      p_item_id: itemId,
      p_amount: 1,
    });
    if (rpcErr) console.warn('[DB] Failed to increment saved_count:', rpcErr.message);

    return { saved: true };
  }
}

/**
 * Get saved items for a user.
 * @param {string} userId - User UUID
 * @param {object} options - { limit, offset, type } where type is 'product' or 'service'
 * @returns {Promise<{data: Array, count: number}>}
 */
export async function getSavedItems(userId, options = {}) {
  if (!userId) throw new Error('getSavedItems: userId is required');

  const { limit = 20, offset = 0, type } = options;

  let query = supabase
    .from('saved_items')
    .select(
      `
      *,
      product:products!saved_items_product_id_fkey(*),
      service:services!saved_items_service_id_fkey(*)
    `,
      { count: 'exact' }
    )
    .eq('user_id', userId);

  if (type === 'product') {
    query = query.not('product_id', 'is', null);
  } else if (type === 'service') {
    query = query.not('service_id', 'is', null);
  }

  query = query.order('created_at', { ascending: false });
  query = paginate(query, offset, limit);

  const { data, error, count } = await query;

  handleError(error, 'getSavedItems');
  return { data: data || [], count: count || 0 };
}

/**
 * Check if an item is saved by the user.
 * @param {string} userId - User UUID
 * @param {string} productId - Product UUID
 * @returns {Promise<boolean>}
 */
export async function isItemSaved(userId, productId) {
  if (!userId || !productId) return false;

  const { data } = await supabase
    .from('saved_items')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();

  return !!data;
}

// -------------------------------------------------------------------
// 10. CONVERSATION / MESSAGING HELPERS
// -------------------------------------------------------------------

/**
 * Get or create a conversation between buyer and seller.
 * @param {string} buyerId - Buyer UUID
 * @param {string} sellerId - Seller UUID
 * @param {string} productId - Optional product UUID
 * @param {string} serviceId - Optional service UUID
 * @returns {Promise<object>} Conversation
 */
export async function getOrCreateConversation(buyerId, sellerId, productId, serviceId) {
  if (!buyerId || !sellerId) {
    throw new Error('getOrCreateConversation: buyerId and sellerId are required');
  }

  // Try to find existing conversation
  let query = supabase
    .from('conversations')
    .select('*')
    .eq('buyer_id', buyerId)
    .eq('seller_id', sellerId);

  if (productId) {
    query = query.eq('product_id', productId);
  } else if (serviceId) {
    query = query.eq('service_id', serviceId);
  }

  const { data: existing } = await query.maybeSingle();

  if (existing) {
    return existing;
  }

  // Create new conversation
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      buyer_id: buyerId,
      seller_id: sellerId,
      product_id: productId || null,
      service_id: serviceId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  handleError(error, 'getOrCreateConversation');
  return data;
}

/**
 * Send a message in a conversation.
 * @param {string} conversationId - Conversation UUID
 * @param {string} senderId - Sender UUID
 * @param {string} content - Message text
 * @param {string[]} attachments - Array of attachment URLs
 * @returns {Promise<object>} Created message
 */
export async function sendMessage(conversationId, senderId, content, attachments = []) {
  if (!conversationId || !senderId || !content) {
    throw new Error('sendMessage: conversationId, senderId, and content are required');
  }

  // 1. Insert the message
  const { data: message, error: msgError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      attachments,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (msgError) {
    console.error('[DB] sendMessage insert failed:', msgError.message, msgError.details, msgError.hint);
    throw new Error("Impossible d'envoyer le message: " + msgError.message);
  }

  // 2. Update conversation metadata (fire & forget — ne pas bloquer l'envoi)
  supabase
    .from('conversations')
    .update({
      last_message_at: new Date().toISOString(),
      last_message_preview: content.substring(0, 100),
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)
    .then(({ error: updateErr }) => {
      if (updateErr) console.warn('[DB] Failed to update conversation:', updateErr.message);
    });

  // 3. Increment unread count atomically via RPC (fire & forget)
  supabase
    .from('conversations')
    .select('buyer_id, seller_id')
    .eq('id', conversationId)
    .single()
    .then(({ data: conv, error: convErr }) => {
      if (convErr || !conv) return;
      const isBuyer = senderId === conv.buyer_id;
      const unreadField = isBuyer ? 'seller_unread_count' : 'buyer_unread_count';
      supabase.rpc('increment_conversation_unread', {
        p_conversation_id: conversationId,
        p_column: unreadField,
      }).then(({ error: rpcErr }) => {
        if (rpcErr) console.warn('[DB] Failed to increment unread count:', rpcErr.message);
      });
    });

  return message;
}

/**
 * Get messages for a conversation.
 * @param {string} conversationId - Conversation UUID
 * @param {object} options - { limit, offset }
 * @returns {Promise<Array>} Messages
 */
export async function getMessages(conversationId, options = {}) {
  if (!conversationId) throw new Error('getMessages: conversationId is required');

  const { limit = 50, offset = 0 } = options;

  let query = supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(full_name, avatar_url)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  const { data, error } = await paginate(query, offset, limit);

  handleError(error, 'getMessages');
  return data || [];
}

/**
 * Mark messages as read in a conversation.
 * @param {string} conversationId - Conversation UUID
 * @param {string} userId - The user who read the messages
 * @returns {Promise<void>}
 */
export async function markMessagesAsRead(conversationId, userId) {
  if (!conversationId || !userId) return;

  // Mark individual messages as read
  await supabase
    .from('messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .eq('is_read', false);

  // Reset unread count for this user
  const { data: conv } = await supabase
    .from('conversations')
    .select('buyer_id, seller_id')
    .eq('id', conversationId)
    .single();

  if (conv) {
    if (userId === conv.buyer_id) {
      await supabase
        .from('conversations')
        .update({ buyer_unread_count: 0 })
        .eq('id', conversationId);
    } else if (userId === conv.seller_id) {
      await supabase
        .from('conversations')
        .update({ seller_unread_count: 0 })
        .eq('id', conversationId);
    }
  }
}

/**
 * Get conversations for a user.
 * @param {string} userId - User UUID
 * @param {object} options - { limit, offset }
 * @returns {Promise<{data: Array, count: number}>}
 */
export async function getUserConversations(userId, options = {}) {
  if (!userId) throw new Error('getUserConversations: userId is required');

  const { limit = 20, offset = 0 } = options;

  let query = supabase
    .from('conversations')
    .select(
      `
      *,
      buyer:profiles!conversations_buyer_id_fkey(full_name, avatar_url, is_verified),
      seller:profiles!conversations_seller_id_fkey(full_name, avatar_url, store_name, is_verified),
      product:products!conversations_product_id_fkey(title, slug, cover_image, price),
      service:services!conversations_service_id_fkey(title, slug, cover_image, price)
    `,
      { count: 'exact' }
    )
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .or(`is_buyer_deleted.eq.false,is_seller_deleted.eq.false`)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  const { data, error, count } = await paginate(query, offset, limit);

  handleError(error, 'getUserConversations');
  return { data: data || [], count: count || 0 };
}

// -------------------------------------------------------------------
// 11. NOTIFICATION HELPERS
// -------------------------------------------------------------------

/**
 * Get notifications for a user.
 * @param {string} userId - User UUID
 * @param {object} options - { limit, offset, unreadOnly }
 * @returns {Promise<{data: Array, count: number}>}
 */
export async function getNotifications(userId, options = {}) {
  if (!userId) throw new Error('getNotifications: userId is required');

  const { limit = 20, offset = 0, unreadOnly = false } = options;

  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  query = query.order('created_at', { ascending: false });
  query = paginate(query, offset, limit);

  const { data, error, count } = await query;

  handleError(error, 'getNotifications');
  return { data: data || [], count: count || 0 };
}

/**
 * Mark a notification as read.
 * @param {string} id - Notification UUID
 * @returns {Promise<void>}
 */
export async function markNotificationRead(id) {
  if (!id) return;

  await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id);
}

/**
 * Mark all notifications as read for a user.
 * @param {string} userId - User UUID
 * @returns {Promise<void>}
 */
export async function markAllNotificationsRead(userId) {
  if (!userId) return;

  await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_read', false);
}

/**
 * Get unread notification count.
 * @param {string} userId - User UUID
 * @returns {Promise<number>}
 */
export async function getUnreadNotificationCount(userId) {
  if (!userId) return 0;

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) return 0;
  return count || 0;
}

// -------------------------------------------------------------------
// 12. PROMOTION HELPERS
// -------------------------------------------------------------------

/**
 * Create a promotion for a product or service.
 * @param {object} promotion - Promotion data
 * @returns {Promise<object>}
 */
export async function createPromotion(promotion) {
  if (!promotion) throw new Error('createPromotion: promotion data is required');
  if (!promotion.seller_id) throw new Error('createPromotion: seller_id is required');
  if (!promotion.product_id && !promotion.service_id) {
    throw new Error('createPromotion: either product_id or service_id is required');
  }

  const { data, error } = await supabase
    .from('promotions')
    .insert(promotion)
    .select()
    .single();

  handleError(error, 'createPromotion');

  // Mark the item as promoted
  if (promotion.product_id) {
    await supabase
      .from('products')
      .update({
        is_promoted: true,
        promoted_until: promotion.end_date,
      })
      .eq('id', promotion.product_id);
  } else if (promotion.service_id) {
    await supabase
      .from('services')
      .update({
        is_promoted: true,
        promoted_until: promotion.end_date,
      })
      .eq('id', promotion.service_id);
  }

  return data;
}

// -------------------------------------------------------------------
// 13. UTILITY HELPERS
// -------------------------------------------------------------------

/**
 * Format a number as FCFA price string.
 * @param {number} price - The price to format
 * @returns {string} Formatted price like "1 500 FCFA"
 */
export function formatPrice(price) {
  if (price == null) return 'Prix sur devis';
  return Number(price).toLocaleString('fr-FR') + ' FCFA';
}

/**
 * Validate a Benin phone number.
 * Accepted formats: +229 XX XX XX XX or 01 XX XX XX XX (8 digits after prefix).
 * @param {string} phone - The phone number to validate
 * @returns {boolean} Whether the phone is valid
 */
export function validateBeninPhone(phone) {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-\.]/g, '');
  return /^(\+229\d{8})$/.test(cleaned) || /^01\d{8}$/.test(cleaned);
}

// -------------------------------------------------------------------
// 14. PROMOTED / LATEST PRODUCT HELPERS
// -------------------------------------------------------------------

/**
 * Get promoted products (is_promoted = true), ordered by promotion end date.
 * @param {object|number} options - Limit number or { limit }
 * @returns {Promise<{products: Array, error: string|null}>}
 */
export async function getPromotedProducts(options = {}) {
  const limit = typeof options === 'number' ? options : (options.limit || 20);

  try {
    const { data, error } = await supabase
      .from('products')
      .select(
        `
        *,
        seller:profiles!products_seller_id_fkey(full_name, store_name, avatar_url, is_verified, city)
      `
      )
      .eq('is_promoted', true)
      .eq('status', 'active')
      .gte('promoted_until', new Date().toISOString())
      .order('promoted_until', { ascending: false })
      .limit(limit);

    if (error) return { products: [], error: error.message };
    return { products: data || [], error: null };
  } catch (err) {
    return { products: [], error: err.message };
  }
}

/**
 * Get the most recent products, ordered by created_at.
 * @param {object|number} options - Limit number or { limit }
 * @returns {Promise<{products: Array, error: string|null}>}
 */
export async function getLatestProducts(options = {}) {
  const limit = typeof options === 'number' ? options : (options.limit || 20);

  try {
    const { data, error } = await supabase
      .from('products')
      .select(
        `
        *,
        seller:profiles!products_seller_id_fkey(full_name, store_name, avatar_url, is_verified, city)
      `
      )
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return { products: [], error: error.message };
    return { products: data || [], error: null };
  } catch (err) {
    return { products: [], error: err.message };
  }
}

/**
 * Get promoted services (is_promoted = true, active, not expired).
 * @param {number|object} options - Limit number or options object
 * @returns {Promise<{services: Array, error: string|null}>}
 */
export async function getPromotedServices(options = {}) {
  const limit = typeof options === 'number' ? options : (options.limit || 20);

  try {
    const { data, error } = await supabase
      .from('services')
      .select(
        `
        *,
        seller:profiles!services_seller_id_fkey(full_name, store_name, avatar_url, is_verified, city)
      `
      )
      .eq('is_promoted', true)
      .eq('status', 'active')
      .gte('promoted_until', new Date().toISOString())
      .order('promoted_until', { ascending: false })
      .limit(limit);

    if (error) return { services: [], error: error.message };
    return { services: data || [], error: null };
  } catch (err) {
    return { services: [], error: err.message };
  }
}

/**
 * Get the latest active services.
 * @param {number|object} options - Limit number or options object
 * @returns {Promise<{services: Array, error: string|null}>}
 */
export async function getLatestServices(options = {}) {
  const limit = typeof options === 'number' ? options : (options.limit || 20);

  try {
    const { data, error } = await supabase
      .from('services')
      .select(
        `
        *,
        seller:profiles!services_seller_id_fkey(full_name, store_name, avatar_url, is_verified, city)
      `
      )
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return { services: [], error: error.message };
    return { services: data || [], error: null };
  } catch (err) {
    return { services: [], error: err.message };
  }
}

// -------------------------------------------------------------------
// 15. FULL DETAIL HELPERS (product / service with seller profile)
// -------------------------------------------------------------------

/**
 * Get a product by ID with full seller profile included.
 * Returns { product, error } format.
 * @param {string} id - Product UUID
 * @returns {Promise<{product: object|null, error: string|null}>}
 */
export async function getFullProductById(id) {
  if (!id) return { product: null, error: 'ID requis' };

  try {
    const product = await getProductById(id);
    if (!product) return { product: null, error: 'Produit introuvable' };
    return { product, error: null };
  } catch (err) {
    return { product: null, error: err.message };
  }
}

/**
 * Get a service by ID with full seller profile included.
 * Returns { service, error } format.
 * @param {string} id - Service UUID
 * @returns {Promise<{service: object|null, error: string|null}>}
 */
export async function getFullServiceById(id) {
  if (!id) return { service: null, error: 'ID requis' };

  try {
    const service = await getServiceById(id);
    if (!service) return { service: null, error: 'Service introuvable' };
    return { service, error: null };
  } catch (err) {
    return { service: null, error: err.message };
  }
}

// -------------------------------------------------------------------
// 16. ADMIN HELPERS
// -------------------------------------------------------------------

/**
 * Search users/profiles for admin panel.
 * @param {string} query - Search text (name, email, phone, city)
 * @returns {Promise<Array>} Array of matching profiles
 */
export async function searchUsers(query = '') {
  try {
    let dbQuery = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (query && typeof query === 'string' && query.trim()) {
      dbQuery = supabase
        .from('profiles')
        .select('*')
        .or(
          `full_name.ilike.%${query.trim()}%,email.ilike.%${query.trim()}%,phone.ilike.%${query.trim()}%,city.ilike.%${query.trim()}%`
        )
        .order('created_at', { ascending: false })
        .limit(50);
    }

    const { data, error } = await dbQuery;
    if (error) throw new Error(error.message);
    return data || [];
  } catch (err) {
    throw new Error(err.message);
  }
}

/**
 * Delete a user and their associated data (admin function).
 * @param {string} id - User UUID
 * @returns {Promise<void>}
 */
export async function deleteUser(id) {
  if (!id) throw new Error('deleteUser: id is required');

  // Clean up related data
  const { error: productErr } = await supabase
    .from('products')
    .delete()
    .eq('seller_id', id);
  if (productErr) console.warn('[DB] deleteUser products cleanup:', productErr.message);

  const { error: serviceErr } = await supabase
    .from('services')
    .delete()
    .eq('seller_id', id);
  if (serviceErr) console.warn('[DB] deleteUser services cleanup:', serviceErr.message);

  const { error: profileErr } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);
  if (profileErr) throw new Error(profileErr.message);
}

/**
 * Get all orders for a specific seller.
 * @param {string} sellerId - Seller UUID
 * @returns {Promise<Array>} Array of orders with buyer and product info
 */
export async function getSellerOrders(sellerId) {
  if (!sellerId) throw new Error('getSellerOrders: sellerId is required');

  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      buyer:profiles!orders_buyer_id_fkey(full_name, email, phone, avatar_url),
      product:products!orders_product_id_fkey(title, slug, cover_image, price)
    `
    )
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Get products or services for a specific user.
 * @param {string} userId - User UUID
 * @param {string} type - 'product' or 'service'
 * @returns {Promise<Array>} Array of items with a type field
 */
export async function getUserProducts(userId, type = 'product') {
  if (!userId) throw new Error('getUserProducts: userId is required');

  try {
    if (type === 'service') {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data || []).map((s) => ({ ...s, type: 'service' }));
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map((p) => ({ ...p, type: 'product' }));
  } catch (err) {
    throw new Error(err.message);
  }
}

// -------------------------------------------------------------------
// 17. PROMOTION HELPERS
// -------------------------------------------------------------------

/**
 * Promote a product for a given duration.
 * @param {string} productId - Product UUID
 * @param {number} durationDays - Number of days for the promotion
 * @param {number} price - Price paid for the promotion
 * @returns {Promise<object>} Updated product
 */
export async function promoteProduct(productId, durationDays, price) {
  if (!productId) throw new Error('promoteProduct: productId is required');
  if (!durationDays || durationDays < 1) throw new Error('promoteProduct: valid durationDays is required');

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + durationDays);

  const { data, error } = await supabase
    .from('products')
    .update({
      is_promoted: true,
      promoted_until: endDate.toISOString(),
    })
    .eq('id', productId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// -------------------------------------------------------------------
// 13. SEARCH HELPERS
// -------------------------------------------------------------------

/**
 * Full-text search across products and services.
 * @param {string} query - Search text
 * @param {object} options - { limit, offset, type, category, minPrice, maxPrice, department }
 * @returns {Promise<{products: Array, services: Array}>}
 */
export async function fullTextSearch(query, options = {}) {
  if (!query || typeof query !== 'string') {
    return { products: [], services: [] };
  }

  const { limit = 10, category, minPrice, maxPrice, department } = options;

  const results = { products: [], services: [] };

  // Search products
  let productQuery = supabase
    .from('products')
    .select(
      `
      *,
      seller:profiles!products_seller_id_fkey(full_name, store_name, avatar_url)
    `
    )
    .eq('status', 'active')
    .or(
      `title.ilike.%${query}%,description.ilike.%${query}%,short_description.ilike.%${query}%`
    );

  if (category) productQuery = productQuery.eq('category', category);
  if (minPrice != null) productQuery = productQuery.gte('price', minPrice);
  if (maxPrice != null) productQuery = productQuery.lte('price', maxPrice);
  if (department) productQuery = productQuery.eq('department', department);

  productQuery = productQuery.order('rating', { ascending: false }).limit(limit);

  // Search services
  let serviceQuery = supabase
    .from('services')
    .select(
      `
      *,
      seller:profiles!services_seller_id_fkey(full_name, store_name, avatar_url)
    `
    )
    .eq('status', 'active')
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`);

  if (category) serviceQuery = serviceQuery.eq('category', category);
  if (minPrice != null) serviceQuery = serviceQuery.gte('price', minPrice);
  if (maxPrice != null) serviceQuery = serviceQuery.lte('price', maxPrice);
  if (department) serviceQuery = serviceQuery.eq('department', department);

  serviceQuery = serviceQuery.order('rating', { ascending: false }).limit(limit);

  // Run both queries in parallel — they are fully independent
  const [{ data: products }, { data: services }] = await Promise.all([productQuery, serviceQuery]);
  results.products = products || [];
  results.services = services || [];

  return results;
}

// -------------------------------------------------------------------
// ADDITIONAL HELPERS (pages)
// -------------------------------------------------------------------

/**
 * Get orders for a user (buyer).
 * @param {string} userId - User UUID
 * @returns {Promise<Array>}
 */
export async function getUserOrders(userId) {
  if (!userId) throw new Error('getUserOrders: userId is required');
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('buyer_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Get a single order by ID.
 * @param {string} orderId - Order UUID
 * @returns {Promise<object|null>}
 */
export async function getOrderById(orderId) {
  if (!orderId) throw new Error('getOrderById: orderId is required');
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      product:products!orders_product_id_fkey(title, price, images, seller_id, category, description),
      buyer:profiles!orders_buyer_id_fkey(full_name, phone, avatar_url, city),
      seller:profiles!orders_seller_id_fkey(full_name, phone, avatar_url, city, whatsapp)
    `)
    .eq('id', orderId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return data;
}

/**
 * Get favorites for a user.
 * @param {string} userId - User UUID
 * @returns {Promise<Array>}
 */
export async function getUserFavorites(userId) {
  if (!userId) throw new Error('getUserFavorites: userId is required');

  const { data, error } = await supabase
    .from('favorites')
    .select(`
      *,
      product:products(*),
      service:services(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Remove a favorite.
 * @param {string} favId - Favorite UUID
 * @returns {Promise<void>}
 */
export async function removeFavorite(favId) {
  if (!favId) throw new Error('removeFavorite: favId is required');
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('id', favId);

  if (error) throw new Error(error.message);
}

/**
 * Get all products/services for a seller.
 * @param {string} sellerId - Seller UUID
 * @returns {Promise<Array>}
 */
export async function getSellerProducts(sellerId) {
  if (!sellerId) throw new Error('getSellerProducts: sellerId is required');

  try {
    const [products, services] = await Promise.all([
      supabase.from('products').select('*').eq('seller_id', sellerId).order('created_at', { ascending: false }),
      supabase.from('services').select('*').eq('seller_id', sellerId).order('created_at', { ascending: false }),
    ]);

    const mappedProducts = (products.data || []).map((p) => ({ ...p, type: 'product' }));
    const mappedServices = (services.data || []).map((s) => ({ ...s, type: 'service' }));

    return [...mappedProducts, ...mappedServices].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
  } catch (err) {
    throw new Error(err.message);
  }
}

/**
 * Simple keyword search for products.
 * @param {string} query
 * @returns {Promise<Array>}
 */
export async function searchProducts(query) {
  if (!query) return [];
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .or(
      `title.ilike.%${query}%,description.ilike.%${query}%,short_description.ilike.%${query}%`
    )
    .order('rating', { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Simple keyword search for services.
 * @param {string} query
 * @returns {Promise<Array>}
 */
export async function searchServices(query) {
  if (!query) return [];
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('status', 'active')
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order('rating', { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);
  return data || [];
}

// -------------------------------------------------------------------
// 17. RECOMMENDATIONS (user_events)
// -------------------------------------------------------------------

/**
 * Get recommended products for a logged-in user based on their behavior.
 * Calls the get_recommended_products RPC function.
 *
 * @param {string} userId - User UUID
 * @param {number} [limit=8] - Max products to return
 * @returns {Promise<{products: Array, error: string|null}>}
 */
export async function getRecommendedProducts(userId, limit = 8) {
  if (!userId) {
    // Fallback: trending products for non-logged-in users
    return getTrendingProducts(limit);
  }

  try {
    const { data, error } = await supabase.rpc('get_recommended_products', {
      p_user_id: userId,
      p_limit: limit,
    });

    if (error) {
      // Fallback: si la RPC n'existe pas encore, retourner les tendances
      console.warn('[Reco] RPC failed, falling back to trending:', error.message);
      return getTrendingProducts(limit);
    }

    // Normaliser le format seller pour ProductCard
    const products = (data || []).map((item) => ({
      ...item,
      seller: {
        name: item.seller_full_name,
        full_name: item.seller_full_name,
        store_name: item.seller_store_name,
        avatar_url: item.seller_avatar_url,
        city: item.seller_city,
      },
    }));

    return { products, error: null };
  } catch (err) {
    return getTrendingProducts(limit);
  }
}

/**
 * Get trending products (for non-logged-in users or as fallback).
 * Uses view_count, rating and recency to determine popularity.
 *
 * @param {number} [limit=8]
 * @returns {Promise<{products: Array, error: string|null}>}
 */
export async function getTrendingProducts(limit = 8) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(
        `
        *,
        seller:profiles!products_seller_id_fkey(full_name, store_name, avatar_url, is_verified, city)
      `
      )
      .eq('status', 'active')
      .order('view_count', { ascending: false })
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) return { products: [], error: error.message };
    return { products: data || [], error: null };
  } catch (err) {
    return { products: [], error: err.message };
  }
}
