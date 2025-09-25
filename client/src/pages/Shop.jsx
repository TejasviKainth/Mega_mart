import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Shop() {
  const location = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)

  const searchParams = new URLSearchParams(location.search)
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '')
  const [categories, setCategories] = useState([])
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest')
  const [page, setPage] = useState(Number(searchParams.get('page') || 1))
  const [limit, setLimit] = useState(Number(searchParams.get('limit') || 12))

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sort, page, limit])

  async function fetchCategories() {
    try {
      const { data } = await api.get('/products/categories/list')
      setCategories(data)
    } catch {}
  }

  async function fetchProducts(customPage = page) {
    setLoading(true)
    const params = new URLSearchParams({
      keyword,
      category,
      sort,
      page: String(customPage),
      limit: String(limit)
    })
    // keep URL in sync
    navigate({ pathname: '/shop', search: params.toString() }, { replace: true })
    const { data } = await api.get(`/products?${params.toString()}`)
    setProducts(data.items)
    setTotal(data.total)
    setPages(data.pages)
    setPage(data.page)
    setLoading(false)
  }

  function submitSearch(e) {
    e?.preventDefault()
    setPage(1)
    fetchProducts(1)
  }

  const showingText = useMemo(() => {
    const start = (page - 1) * limit + 1
    const end = Math.min(page * limit, total)
    if (total === 0) return 'No products found'
    return `Showing ${start}-${end} of ${total}`
  }, [page, limit, total])

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 16, padding: 16 }}>
        <form className="toolbar" onSubmit={submitSearch}>
          <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Search products..." />
          <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
            <option value="">All categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating_desc">Top Rated</option>
          </select>
          <button className="btn" type="submit">Search</button>
        </form>
        <div className="row between" style={{ marginTop: 8 }}>
          <span className="muted">{showingText}</span>
          <div className="row">
            <span className="muted">Per page</span>
            <select value={limit} onChange={e => { setLimit(+e.target.value); setPage(1) }}>
              {[12, 24, 36].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? <p>Loading...</p> : (
        products.length === 0 ? (
          <div className="card" style={{ padding: 16 }}>
            <p>No products found. Try adjusting filters.</p>
          </div>
        ) : (
          <>
            <div className="grid">
              {products.map(p => (
                <div key={p._id} className="card">
                  <Link to={`/product/${p._id}`}>
                    <img src={p.image || 'https://via.placeholder.com/400x300?text=Product'} alt={p.name} />
                    <h3>{p.name}</h3>
                  </Link>
                  <p className="muted">{p.brand} • {p.category}</p>
                  <p className="price">₹{p.price}</p>
                  <div className="row between">
                    <span className="muted">★ {p.rating?.toFixed?.(1) ?? p.rating}</span>
                    <Link to={`/product/${p._id}`} className="btn primary">View</Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="row" style={{ justifyContent: 'center', marginTop: 16, gap: 8 }}>
              <button className="btn" disabled={page <= 1} onClick={() => fetchProducts(page - 1)}>Prev</button>
              <span className="muted">Page {page} of {pages}</span>
              <button className="btn" disabled={page >= pages} onClick={() => fetchProducts(page + 1)}>Next</button>
            </div>
          </>
        )
      )}
    </div>
  )
}
