import React, { useMemo, useState } from 'react'
import { ArrowLeft, Search, Download } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { mockProductPerformance } from '../data/mockDashboard'

const ProductPerformanceDetails: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'sales' | 'revenue' | 'stock'>('revenue')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = mockProductPerformance.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    )

    filtered.sort((a, b) => {
      let aValue: number | string = 0
      let bValue: number | string = 0

      switch (sortBy) {
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'sales':
          aValue = a.sales
          bValue = b.sales
          break
        case 'revenue':
          aValue = a.revenue
          bValue = b.revenue
          break
        case 'stock':
          aValue = a.stock
          bValue = b.stock
          break
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue as string) : (bValue as string).localeCompare(aValue)
      }

      return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number)
    })

    return filtered
  }, [searchTerm, sortBy, sortOrder])

  const handleExport = () => {
    const csv = [
      ['Product Name', 'Category', 'Sales', 'Revenue', 'Stock', 'Status'],
      ...filteredAndSortedProducts.map((p) => [p.name, p.category, p.sales, p.revenue, p.stock, p.status]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'product-performance.csv'
    a.click()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Performance</h1>
            <p className="text-gray-600">Complete product analytics and metrics</p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by product name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Sort Controls */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="revenue">Sort by Revenue</option>
                <option value="sales">Sort by Sales</option>
                <option value="stock">Sort by Stock</option>
                <option value="name">Sort by Name</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
              </button>

              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          {/* Results Count */}
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredAndSortedProducts.length}</span> of{' '}
            <span className="font-semibold">{mockProductPerformance.length}</span> products
          </p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Product Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Category</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Sales</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Revenue</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Stock</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAndSortedProducts.map((product) => (
                  <tr
                    key={product.name}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{product.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900 font-medium">
                      {product.sales.toLocaleString('en-US')}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900 font-medium">
                      THB {product.revenue.toLocaleString('en-US')}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900 font-medium">{product.stock}</td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                          product.status === 'BEST SELLER'
                            ? 'bg-emerald-100 text-emerald-700'
                            : product.status === 'TOP PRODUCT'
                            ? 'bg-blue-100 text-blue-700'
                            : product.status === 'PERFORMING'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAndSortedProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No products found matching your search.</p>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Total Products</p>
            <p className="text-2xl font-bold text-gray-900">{filteredAndSortedProducts.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Total Sales</p>
            <p className="text-2xl font-bold text-gray-900">
              {filteredAndSortedProducts.reduce((sum, p) => sum + p.sales, 0).toLocaleString('en-US')}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">
              THB {filteredAndSortedProducts.reduce((sum, p) => sum + p.revenue, 0).toLocaleString('en-US')}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Total Stock</p>
            <p className="text-2xl font-bold text-gray-900">
              {filteredAndSortedProducts.reduce((sum, p) => sum + p.stock, 0).toLocaleString('en-US')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductPerformanceDetails
