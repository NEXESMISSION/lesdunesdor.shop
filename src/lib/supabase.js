import { createClient } from '@supabase/supabase-js'

// Replace with your actual Supabase URL and anon key
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// =====================================================
// AUTHENTICATION FUNCTIONS
// =====================================================
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  } catch (error) {
    console.error('Sign in error:', error)
    throw error
  }
}

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    console.error('Sign out error:', error)
    throw error
  }
}

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Get current user error:', error)
    throw error
  }
}

// =====================================================
// PRODUCTS FUNCTIONS
// =====================================================
export const getProducts = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(
          id, 
          name, 
          parent_id
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching products:', error)
      throw error
    }
    return data || []
  } catch (error) {
    console.error('getProducts error:', error)
    return []
  }
}

export const getProduct = async (id) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(
          id, 
          name, 
          parent_id
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching product:', error)
      throw error
    }
    return data
  } catch (error) {
    console.error('getProduct error:', error)
    throw error
  }
}

export const createProduct = async (productData) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating product:', error)
      throw error
    }
    return data
  } catch (error) {
    console.error('createProduct error:', error)
    throw error
  }
}

export const updateProduct = async (id, productData) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating product:', error)
      throw error
    }
    return data
  } catch (error) {
    console.error('updateProduct error:', error)
    throw error
  }
}

export const deleteProduct = async (id) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting product:', error)
      throw error
    }
  } catch (error) {
    console.error('deleteProduct error:', error)
    throw error
  }
}

// =====================================================
// CATEGORIES FUNCTIONS (WITH SUBCATEGORIES)
// =====================================================
export const getCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) {
      console.error('Error fetching categories:', error)
      throw error
    }
    return data || []
  } catch (error) {
    console.error('getCategories error:', error)
    return []
  }
}

export const getMainCategories = async () => {
  try {
    // First get main categories
    const { data: mainCategories, error: mainError } = await supabase
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .order('name', { ascending: true })
    
    if (mainError) {
      console.error('Error fetching main categories:', mainError)
      throw mainError
    }

    // Then get subcategories for each main category
    const categoriesWithSubs = await Promise.all(
      (mainCategories || []).map(async (mainCategory) => {
        const { data: subcategories, error: subError } = await supabase
          .from('categories')
          .select('*')
          .eq('parent_id', mainCategory.id)
          .order('name', { ascending: true })
        
        if (subError) {
          console.error('Error fetching subcategories for', mainCategory.name, ':', subError)
        }
        
        return {
          ...mainCategory,
          subcategories: subcategories || []
        }
      })
    )
    
    return categoriesWithSubs
  } catch (error) {
    console.error('getMainCategories error:', error)
    return []
  }
}

export const getSubcategories = async (parentId) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', parentId)
      .order('name', { ascending: true })
    
    if (error) {
      console.error('Error fetching subcategories:', error)
      throw error
    }
    return data || []
  } catch (error) {
    console.error('getSubcategories error:', error)
    return []
  }
}

export const createCategory = async (categoryData) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert([categoryData])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating category:', error)
      throw error
    }
    return data
  } catch (error) {
    console.error('createCategory error:', error)
    throw error
  }
}

export const updateCategory = async (id, categoryData) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update(categoryData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating category:', error)
      throw error
    }
    return data
  } catch (error) {
    console.error('updateCategory error:', error)
    throw error
  }
}

export const deleteCategory = async (id) => {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting category:', error)
      throw error
    }
  } catch (error) {
    console.error('deleteCategory error:', error)
    throw error
  }
}

// =====================================================
// ORDERS FUNCTIONS
// =====================================================
export const getOrders = async () => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching orders:', error)
      throw error
    }
    return data || []
  } catch (error) {
    console.error('getOrders error:', error)
    return []
  }
}

export const getOrder = async (id) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching order:', error)
      throw error
    }
    return data
  } catch (error) {
    console.error('getOrder error:', error)
    throw error
  }
}

export const createOrder = async (orderData) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating order:', error)
      throw error
    }
    return data
  } catch (error) {
    console.error('createOrder error:', error)
    throw error
  }
}

export const updateOrder = async (id, orderData) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update(orderData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating order:', error)
      throw error
    }
    return data
  } catch (error) {
    console.error('updateOrder error:', error)
    throw error
  }
}

export const deleteOrder = async (id) => {
  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting order:', error)
      throw error
    }
  } catch (error) {
    console.error('deleteOrder error:', error)
    throw error
  }
}

export const updateOrderStatus = async (id, status) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating order status:', error)
      throw error
    }
    return data
  } catch (error) {
    console.error('updateOrderStatus error:', error)
    throw error
  }
}

// =====================================================
// REALTIME SUBSCRIPTIONS
// =====================================================
export const subscribeToProducts = (callback) => {
  return supabase
    .channel('products-changes')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'products' 
      }, 
      callback
    )
    .subscribe()
}

export const subscribeToOrders = (callback) => {
  return supabase
    .channel('orders-changes')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'orders' 
      }, 
      callback
    )
    .subscribe()
}

export const subscribeToCategories = (callback) => {
  return supabase
    .channel('categories-changes')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'categories' 
      }, 
      callback
    )
    .subscribe()
}

// =====================================================
// DASHBOARD ANALYTICS
// =====================================================
export const getDashboardStats = async () => {
  try {
    // Get all orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('total_amount, created_at, status')

    if (ordersError) {
      console.error('Error fetching orders for stats:', ordersError)
    }

    // Get all products count
    const { count: productsCount, error: productsError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    if (productsError) {
      console.error('Error fetching products count:', productsError)
    }

    // Calculate stats
    const totalSales = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
    const totalOrders = orders?.length || 0
    
    // Recent orders (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentOrders = orders?.filter(order => {
      const orderDate = new Date(order.created_at)
      return orderDate >= thirtyDaysAgo
    }) || []

    return {
      totalSales,
      totalOrders,
      newCustomers: recentOrders.length,
      totalProducts: productsCount || 0,
      recentOrdersCount: recentOrders.length
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return {
      totalSales: 0,
      totalOrders: 0,
      newCustomers: 0,
      totalProducts: 0,
      recentOrdersCount: 0
    }
  }
}

// =====================================================
// FILE UPLOAD HELPER (For product images)
// =====================================================
export const uploadProductImage = async (file, productId) => {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `product-${productId}-${Date.now()}.${fileExt}`
    const filePath = `products/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    return data.publicUrl
  } catch (error) {
    console.error('uploadProductImage error:', error)
    throw error
  }
} 