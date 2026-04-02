import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getDistributions } from '../../services/distributions'
import { getInventoryItems } from '../../services/inventory'

const LOW_STOCK_THRESHOLD = 10

function getInventoryHealthLabel(quantity) {
  if (quantity <= 0) {
    return 'Out of Stock'
  }

  if (quantity <= LOW_STOCK_THRESHOLD) {
    return 'Low Stock'
  }

  return 'Healthy'
}

function InventoryManagementPage() {
  const [searchParams] = useSearchParams()
  const [inventoryItems, setInventoryItems] = useState([])
  const [distributions, setDistributions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [inventoryFilter, setInventoryFilter] = useState('all')
  const [inventorySearchTerm, setInventorySearchTerm] = useState('')
  const [inventorySortKey, setInventorySortKey] = useState('quantity_asc')
  const [distributionFilter, setDistributionFilter] = useState('all')
  const [distributionSearchTerm, setDistributionSearchTerm] = useState('')
  const [distributionSortKey, setDistributionSortKey] = useState('date_desc')
  const [error, setError] = useState('')
  const [shareableLinkMessage, setShareableLinkMessage] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        setError('')

        const [inventoryData, distributionData] = await Promise.all([
          getInventoryItems(),
          getDistributions(),
        ])

        setInventoryItems(inventoryData)
        setDistributions(distributionData)
      } catch (requestError) {
        setError(
          requestError?.response?.data?.detail ||
            'Unable to load inventory management data.',
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    const nextInventoryFilter = (searchParams.get('inventory') || 'all')
      .trim()
      .toLowerCase()
    const nextDistributionFilter = (searchParams.get('distribution') || 'all')
      .trim()
      .toLowerCase()
    const nextInventorySearch = (searchParams.get('inventory_search') || '').trim()
    const nextDistributionSearch =
      (searchParams.get('distribution_search') || '').trim()
    const nextInventorySort = (searchParams.get('inventory_sort') || '')
      .trim()
      .toLowerCase()
    const nextDistributionSort = (searchParams.get('distribution_sort') || '')
      .trim()
      .toLowerCase()

    if (['all', 'low-stock', 'out-of-stock'].includes(nextInventoryFilter)) {
      setInventoryFilter(nextInventoryFilter)
    } else {
      setInventoryFilter('all')
    }

    if (['all', 'pending', 'released'].includes(nextDistributionFilter)) {
      setDistributionFilter(nextDistributionFilter)
    } else {
      setDistributionFilter('all')
    }

    setInventorySearchTerm(nextInventorySearch)
    setDistributionSearchTerm(nextDistributionSearch)

    if (
      ['quantity_asc', 'quantity_desc', 'expiry_asc', 'expiry_desc'].includes(
        nextInventorySort,
      )
    ) {
      setInventorySortKey(nextInventorySort)
    } else {
      setInventorySortKey('quantity_asc')
    }

    if (['date_desc', 'date_asc', 'quantity_desc', 'quantity_asc'].includes(nextDistributionSort)) {
      setDistributionSortKey(nextDistributionSort)
    } else {
      setDistributionSortKey('date_desc')
    }
  }, [searchParams])

  const filteredInventoryItems = useMemo(() => {
    const normalizedSearch = inventorySearchTerm.trim().toLowerCase()

    const byFilter = inventoryItems.filter((item) => {
      const quantity = Number(item.quantity_available)

      if (inventoryFilter === 'low-stock') {
        return quantity > 0 && quantity <= LOW_STOCK_THRESHOLD
      }

      if (inventoryFilter === 'out-of-stock') {
        return quantity <= 0
      }

      return true
    })

    const bySearch = byFilter.filter((item) => {
      if (!normalizedSearch) {
        return true
      }

      return [item.input_name, String(item.intervention || ''), String(item.id)]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch))
    })

    return [...bySearch].sort((left, right) => {
      if (inventorySortKey === 'quantity_desc') {
        return Number(right.quantity_available) - Number(left.quantity_available)
      }

      if (inventorySortKey === 'expiry_asc') {
        return new Date(left.expiry_date || '9999-12-31') - new Date(right.expiry_date || '9999-12-31')
      }

      if (inventorySortKey === 'expiry_desc') {
        return new Date(right.expiry_date || '0001-01-01') - new Date(left.expiry_date || '0001-01-01')
      }

      return Number(left.quantity_available) - Number(right.quantity_available)
    })
  }, [inventoryFilter, inventoryItems, inventorySearchTerm, inventorySortKey])

  const filteredDistributions = useMemo(() => {
    const normalizedSearch = distributionSearchTerm.trim().toLowerCase()

    const byFilter =
      distributionFilter === 'all'
        ? distributions
        : distributions.filter((item) => {
            const status = distributionFilter === 'released' ? 'Released' : 'Pending'
            return item.status === status
          })

    const bySearch = byFilter.filter((item) => {
      if (!normalizedSearch) {
        return true
      }

      return [
        item.farmer_name,
        item.input_name,
        item.assigned_distributor_name,
        String(item.id),
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch))
    })

    return [...bySearch].sort((left, right) => {
      if (distributionSortKey === 'date_asc') {
        return new Date(left.distribution_date || '9999-12-31') - new Date(right.distribution_date || '9999-12-31')
      }

      if (distributionSortKey === 'quantity_desc') {
        return Number(right.quantity_released) - Number(left.quantity_released)
      }

      if (distributionSortKey === 'quantity_asc') {
        return Number(left.quantity_released) - Number(right.quantity_released)
      }

      return new Date(right.distribution_date || '0001-01-01') - new Date(left.distribution_date || '0001-01-01')
    })
  }, [
    distributionFilter,
    distributionSearchTerm,
    distributionSortKey,
    distributions,
  ])

  const lowStockCount = useMemo(
    () =>
      inventoryItems.filter((item) => {
        const quantity = Number(item.quantity_available)
        return quantity > 0 && quantity <= LOW_STOCK_THRESHOLD
      }).length,
    [inventoryItems],
  )

  const outOfStockCount = useMemo(
    () => inventoryItems.filter((item) => Number(item.quantity_available) <= 0).length,
    [inventoryItems],
  )

  const pendingDistributionCount = useMemo(
    () => distributions.filter((item) => item.status === 'Pending').length,
    [distributions],
  )

  function buildShareableViewUrl() {
    const params = new URLSearchParams()

    if (inventoryFilter !== 'all') {
      params.set('inventory', inventoryFilter)
    }

    if (inventorySearchTerm.trim()) {
      params.set('inventory_search', inventorySearchTerm.trim())
    }

    if (inventorySortKey !== 'quantity_asc') {
      params.set('inventory_sort', inventorySortKey)
    }

    if (distributionFilter !== 'all') {
      params.set('distribution', distributionFilter)
    }

    if (distributionSearchTerm.trim()) {
      params.set('distribution_search', distributionSearchTerm.trim())
    }

    if (distributionSortKey !== 'date_desc') {
      params.set('distribution_sort', distributionSortKey)
    }

    const query = params.toString()
    return `${window.location.origin}${window.location.pathname}${
      query ? `?${query}` : ''
    }`
  }

  async function handleCopyShareableView() {
    try {
      await navigator.clipboard.writeText(buildShareableViewUrl())
      setError('')
      setShareableLinkMessage('Shareable link copied to clipboard.')
    } catch {
      setShareableLinkMessage('')
      setError('Unable to copy shareable link. Please check clipboard permissions.')
    }
  }

  const shareableViewUrl = buildShareableViewUrl()

  return (
    <section className="panel">
      <h3>Inventory Management</h3>
      <p>
        Track stock health and pending distribution workload with quick filters for
        urgent operations.
      </p>

      <div className="inline-actions">
        <button
          type="button"
          className="ghost-button small"
          onClick={handleCopyShareableView}
        >
          Copy Shareable View
        </button>
      </div>

      <div className="shareable-view-block">
        <label htmlFor="inventory-shareable-view-url">Shareable URL</label>
        <input
          id="inventory-shareable-view-url"
          className="shareable-url-preview"
          type="text"
          value={shareableViewUrl}
          readOnly
          onFocus={(event) => event.target.select()}
        />
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {shareableLinkMessage ? <p className="success-text">{shareableLinkMessage}</p> : null}

      <div className="dashboard-grid top-gap">
        <article className="metric-card">
          <p className="metric-card__title">Inventory Records</p>
          <p className="metric-card__value">{inventoryItems.length}</p>
          <p className="metric-card__hint">{lowStockCount} low stock alerts</p>
        </article>
        <article className="metric-card">
          <p className="metric-card__title">Out of Stock Items</p>
          <p className="metric-card__value">{outOfStockCount}</p>
          <p className="metric-card__hint">Needs immediate replenishment</p>
        </article>
        <article className="metric-card">
          <p className="metric-card__title">Pending Distributions</p>
          <p className="metric-card__value">{pendingDistributionCount}</p>
          <p className="metric-card__hint">Queued for release</p>
        </article>
      </div>

      <div className="top-gap">
        <h4>Stock Overview</h4>
        <div className="toolbar-row">
          <label htmlFor="inventory-filter">Inventory Filter</label>
          <select
            id="inventory-filter"
            value={inventoryFilter}
            onChange={(event) => setInventoryFilter(event.target.value)}
          >
            <option value="all">All Stock</option>
            <option value="low-stock">Low Stock (1-10)</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>

          <label htmlFor="inventory-search">Search</label>
          <input
            id="inventory-search"
            type="search"
            value={inventorySearchTerm}
            onChange={(event) => setInventorySearchTerm(event.target.value)}
            placeholder="Input, intervention, or ID"
          />

          <label htmlFor="inventory-sort">Sort</label>
          <select
            id="inventory-sort"
            value={inventorySortKey}
            onChange={(event) => setInventorySortKey(event.target.value)}
          >
            <option value="quantity_asc">Available Qty (Low to High)</option>
            <option value="quantity_desc">Available Qty (High to Low)</option>
            <option value="expiry_asc">Expiry Date (Soonest)</option>
            <option value="expiry_desc">Expiry Date (Latest)</option>
          </select>
        </div>

        {isLoading ? <p>Loading inventory records...</p> : null}

        {!isLoading && filteredInventoryItems.length === 0 ? (
          <p>No inventory records found for this filter.</p>
        ) : null}

        {!isLoading && filteredInventoryItems.length > 0 ? (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Input</th>
                  <th>Intervention</th>
                  <th>Received</th>
                  <th>Available</th>
                  <th>Health</th>
                  <th>Delivery Date</th>
                  <th>Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventoryItems.map((item) => {
                  const quantity = Number(item.quantity_available)
                  const health = getInventoryHealthLabel(quantity)

                  return (
                    <tr key={item.id}>
                      <td>{item.input_name}</td>
                      <td>{item.intervention ? `#${item.intervention}` : 'N/A'}</td>
                      <td>{item.quantity_received}</td>
                      <td>{item.quantity_available}</td>
                      <td>
                        <span
                          className={`status-pill ${
                            health === 'Healthy'
                              ? 'status-pill--active'
                              : health === 'Low Stock'
                                ? 'status-pill--warning'
                                : 'status-pill--inactive'
                          }`}
                        >
                          {health}
                        </span>
                      </td>
                      <td>{item.delivery_date || 'N/A'}</td>
                      <td>{item.expiry_date || 'N/A'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <div className="top-gap">
        <h4>Distribution Queue</h4>
        <div className="toolbar-row">
          <label htmlFor="distribution-filter">Distribution Filter</label>
          <select
            id="distribution-filter"
            value={distributionFilter}
            onChange={(event) => setDistributionFilter(event.target.value)}
          >
            <option value="all">All Records</option>
            <option value="pending">Pending</option>
            <option value="released">Released</option>
          </select>

          <label htmlFor="distribution-search">Search</label>
          <input
            id="distribution-search"
            type="search"
            value={distributionSearchTerm}
            onChange={(event) => setDistributionSearchTerm(event.target.value)}
            placeholder="Farmer, input, distributor, or ID"
          />

          <label htmlFor="distribution-sort">Sort</label>
          <select
            id="distribution-sort"
            value={distributionSortKey}
            onChange={(event) => setDistributionSortKey(event.target.value)}
          >
            <option value="date_desc">Date (Newest)</option>
            <option value="date_asc">Date (Oldest)</option>
            <option value="quantity_desc">Quantity (High to Low)</option>
            <option value="quantity_asc">Quantity (Low to High)</option>
          </select>
        </div>

        {isLoading ? <p>Loading distribution records...</p> : null}

        {!isLoading && filteredDistributions.length === 0 ? (
          <p>No distribution records found for this filter.</p>
        ) : null}

        {!isLoading && filteredDistributions.length > 0 ? (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Farmer</th>
                  <th>Input</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Assigned Distributor</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredDistributions.map((item) => (
                  <tr key={item.id}>
                    <td>#{item.id}</td>
                    <td>{item.farmer_name || `Farmer #${item.farmer}`}</td>
                    <td>{item.input_name || `Inventory #${item.input_inventory}`}</td>
                    <td>{item.quantity_released}</td>
                    <td>{item.status}</td>
                    <td>
                      {item.assigned_distributor_name ||
                        (item.assigned_distributor
                          ? `Distributor #${item.assigned_distributor}`
                          : 'N/A')}
                    </td>
                    <td>
                      {item.distribution_date
                        ? new Date(item.distribution_date).toLocaleDateString()
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default InventoryManagementPage
