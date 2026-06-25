import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  AlertTriangle, 
  SlidersHorizontal 
} from 'lucide-react';

const Products = () => {
  const { isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentId, setCurrentId] = useState(null);
  
  // Form states
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0.00');
  const [costPrice, setCostPrice] = useState('0.00');
  const [stockQuantity, setStockQuantity] = useState(0);
  const [minStockLevel, setMinStockLevel] = useState(5);
  const [categoryId, setCategoryId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [prodRes, catRes, supRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
        api.get('/suppliers')
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
      setSuppliers(supRes.data);
    } catch (err) {
      console.error('Error loading products list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Check if redirect filter exists
    const urlFilter = searchParams.get('filter');
    if (urlFilter === 'low') {
      setStockFilter('low');
    }
  }, [searchParams]);

  // Handle Search and Filtering locally for speed & responsiveness
  const filteredProducts = products.filter((prod) => {
    const matchesSearch = 
      prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prod.description && prod.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === '' || (prod.category && prod.category.id === Number(categoryFilter));

    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = prod.stockQuantity <= prod.minStockLevel && prod.stockQuantity > 0;
    } else if (stockFilter === 'out') {
      matchesStock = prod.stockQuantity <= 0;
    } else if (stockFilter === 'ok') {
      matchesStock = prod.stockQuantity > prod.minStockLevel;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  const openAddModal = () => {
    setModalMode('add');
    setError('');
    setSku('');
    setName('');
    setDescription('');
    setPrice('0.00');
    setCostPrice('0.00');
    setStockQuantity(0);
    setMinStockLevel(5);
    setCategoryId('');
    setSupplierId('');
    setImageUrl('');
    setModalOpen(true);
  };

  const openEditModal = (prod) => {
    setModalMode('edit');
    setError('');
    setCurrentId(prod.id);
    setSku(prod.sku);
    setName(prod.name);
    setDescription(prod.description || '');
    setPrice(prod.price.toString());
    setCostPrice(prod.costPrice.toString());
    setStockQuantity(prod.stockQuantity);
    setMinStockLevel(prod.minStockLevel);
    setCategoryId(prod.category ? prod.category.id : '');
    setSupplierId(prod.supplier ? prod.supplier.id : '');
    setImageUrl(prod.imageUrl || '');
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sku || !name || !price || !costPrice) {
      setError('Please fill in all required fields');
      return;
    }
    setError('');

    const payload = {
      sku,
      name,
      description,
      price: parseFloat(price),
      costPrice: parseFloat(costPrice),
      stockQuantity: parseInt(stockQuantity),
      minStockLevel: parseInt(minStockLevel),
      categoryId: categoryId ? Number(categoryId) : null,
      supplierId: supplierId ? Number(supplierId) : null,
      imageUrl
    };

    try {
      if (modalMode === 'add') {
        const res = await api.post('/products', payload);
        setProducts([...products, res.data]);
      } else {
        const res = await api.put(`/products/${currentId}`, payload);
        setProducts(products.map(p => p.id === currentId ? res.data : p));
      }
      setModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while saving the product.');
    }
  };

  if (loading) {
    return <div className="loader-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="products-container">
      {/* Search & Actions Bar */}
      <div className="actions-bar glass-panel">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by SKU, name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <SlidersHorizontal size={14} className="filter-icon" />
          
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
            <option value="">All Stock Levels</option>
            <option value="ok">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        )}
      </div>

      {/* Products Table Card */}
      <div className="products-card glass-panel">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Category</th>
                <th>Supplier</th>
                <th>Price</th>
                <th>Cost Price</th>
                <th>Stock</th>
                <th>Status</th>
                {isAdmin && <th className="actions-header">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((prod) => {
                const isOut = prod.stockQuantity <= 0;
                const isLow = prod.stockQuantity <= prod.minStockLevel && prod.stockQuantity > 0;
                
                return (
                  <tr key={prod.id}>
                    <td className="sku-cell">{prod.sku}</td>
                    <td className="name-cell">
                      <div className="name-wrapper">
                        {prod.imageUrl && <img src={prod.imageUrl} alt="" className="table-thumbnail" />}
                        <div>
                          <div className="prod-name">{prod.name}</div>
                          {prod.description && <div className="prod-desc">{prod.description.substring(0, 50)}...</div>}
                        </div>
                      </div>
                    </td>
                    <td>{prod.category ? prod.category.name : 'N/A'}</td>
                    <td>{prod.supplier ? prod.supplier.name : 'N/A'}</td>
                    <td className="price-txt">${prod.price.toFixed(2)}</td>
                    <td className="cost-txt">${prod.costPrice.toFixed(2)}</td>
                    <td className="qty-txt">
                      <span>{prod.stockQuantity}</span>
                      <span className="min-label">/ Min: {prod.minStockLevel}</span>
                    </td>
                    <td>
                      <span className={`badge ${
                        isOut ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'
                      }`}>
                        {isOut ? 'Out of stock' : isLow ? 'Low stock' : 'In stock'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="actions-cell">
                        <button className="icon-btn edit-icon" onClick={() => openEditModal(prod)} title="Edit">
                          <Edit size={14} />
                        </button>
                        <button className="icon-btn delete-icon" onClick={() => handleDelete(prod.id)} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="empty-cell">No products found matching criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h3>{modalMode === 'add' ? 'Add New Product' : 'Edit Product'}</h3>
              <button className="close-btn" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            {error && (
              <div className="modal-error">
                <AlertTriangle size={14} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="modal-body-scroll">
                <div className="form-row">
                  <div className="form-group flex-1">
                    <label className="form-label">SKU *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="e.g. ELEC-LAP-001"
                      required
                    />
                  </div>

                  <div className="form-group flex-2">
                    <label className="form-label">Product Name *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Wireless Mouse"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea 
                    className="form-control" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter product description details"
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label className="form-label">Cost Price *</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="form-control" 
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group flex-1">
                    <label className="form-label">Sale Price *</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="form-control" 
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label className="form-label">Initial Quantity *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      disabled={modalMode === 'edit'} // Force manual adjustments for inventory transparency
                      required
                    />
                    {modalMode === 'edit' && (
                      <span className="input-hint">Use Inventory adjustment panel to change stock.</span>
                    )}
                  </div>

                  <div className="form-group flex-1">
                    <label className="form-label">Min Stock Threshold *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={minStockLevel}
                      onChange={(e) => setMinStockLevel(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label className="form-label">Category</label>
                    <select 
                      className="form-control"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group flex-1">
                    <label className="form-label">Supplier</label>
                    <select 
                      className="form-control"
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value)}
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Image URL</label>
                  <input 
                    type="url" 
                    className="form-control" 
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.png"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .products-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .actions-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1.5;
          min-width: 250px;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
        }

        .search-box input {
          width: 100%;
          padding: 10px 14px 10px 42px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
        }

        .search-box input:focus {
          border-color: var(--accent-brand);
        }

        .filter-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          justify-content: flex-end;
          min-width: 280px;
        }

        .filter-icon {
          color: var(--text-secondary);
        }

        .filter-controls select {
          padding: 10px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-primary);
          outline: none;
          font-size: 13px;
        }

        .products-card {
          padding: 0;
          overflow: hidden;
        }

        .sku-cell {
          font-family: monospace;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .name-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .table-thumbnail {
          width: 40px;
          height: 40px;
          border-radius: 6px;
          object-fit: cover;
          border: 1px solid var(--border-color);
        }

        .prod-name {
          font-weight: 600;
        }

        .prod-desc {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .price-txt {
          font-weight: 600;
        }

        .cost-txt {
          color: var(--text-secondary);
        }

        .min-label {
          font-size: 10px;
          color: var(--text-muted);
        }

        .actions-header, .actions-cell {
          text-align: right;
        }

        .actions-cell {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .icon-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-color);
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .icon-btn:hover {
          color: #ffffff;
        }

        .edit-icon:hover {
          background: var(--accent-brand);
          border-color: var(--accent-brand);
        }

        .delete-icon:hover {
          background: var(--accent-danger);
          border-color: var(--accent-danger);
        }

        /* Modal backdrop styles */
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
          padding: 20px;
        }

        .modal-content {
          width: 100%;
          max-width: 600px;
          background: var(--bg-sidebar);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          max-height: 90vh;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color);
        }

        .close-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
        }

        .modal-body-scroll {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }

        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid var(--border-color);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .form-row {
          display: flex;
          gap: 16px;
        }

        .flex-1 { flex: 1; }
        .flex-2 { flex: 2; }

        .input-hint {
          display: block;
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .modal-error {
          margin: 16px 24px 0 24px;
          padding: 12px;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: var(--accent-danger);
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
    </div>
  );
};

export default Products;
