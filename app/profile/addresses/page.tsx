'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GET_MY_ADDRESSES, CREATE_ADDRESS, UPDATE_ADDRESS, DELETE_ADDRESS, SET_DEFAULT_ADDRESS } from '@/graphql/queries'
import { useAuth } from '@/contexts/AuthContext'

interface Address {
  id: string
  name: string
  phone: string
  country: string
  city: string
  district: string
  street: string
  zipCode: string
  isDefault: boolean
}

export default function AddressesPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    district: '',
    street: '',
    zipCode: '',
    isDefault: false,
  })

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, authLoading, router])

  const { data, loading, refetch } = useQuery(GET_MY_ADDRESSES, {
    skip: !isAuthenticated,
  })

  const [createAddress, { loading: creating }] = useMutation(CREATE_ADDRESS, {
    onCompleted: () => {
      alert('∞ûü')
      setShowForm(false)
      resetForm()
      refetch()
    },
  })

  const [updateAddress, { loading: updating }] = useMutation(UPDATE_ADDRESS, {
    onCompleted: () => {
      alert('Ù∞ü')
      setShowForm(false)
      setEditingId(null)
      resetForm()
      refetch()
    },
  })

  const [deleteAddress] = useMutation(DELETE_ADDRESS, {
    onCompleted: () => {
      alert('*dü')
      refetch()
    },
  })

  const [setDefaultAddress] = useMutation(SET_DEFAULT_ADDRESS, {
    onCompleted: () => {
      refetch()
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      city: '',
      district: '',
      street: '',
      zipCode: '',
      isDefault: false,
    })
  }

  const handleEdit = (address: Address) => {
    setEditingId(address.id)
    setFormData({
      name: address.name,
      phone: address.phone,
      city: address.city,
      district: address.district,
      street: address.street,
      zipCode: address.zipCode,
      isDefault: address.isDefault,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      await updateAddress({ variables: { id: editingId, input: formData } })
    } else {
      await createAddress({ variables: { input: formData } })
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('∫öÅ*dd0@Œ')) {
      await deleteAddress({ variables: { id } })
    }
  }

  const handleSetDefault = async (id: string) => {
    await setDefaultAddress({ variables: { id } })
  }

  if (loading) return <div className="text-center py-16">	e-...</div>

  const addresses = data?.myAddresses || []

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">0@°</h1>
        <button
          onClick={() => {
            resetForm()
            setEditingId(null)
            setShowForm(true)
          }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          ∞û0@
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">{editingId ? 'Ë/0@' : '∞û0@'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">6ˆ∫ *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">K_ *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Œ *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">@ﬂ *</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ı^@_</label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">WS0@ *</label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="mr-2"
                />
                -∫-0@
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating || updating}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {creating || updating ? 'U-...' : '2X'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  resetForm()
                }}
                className="px-6 py-2 border text-gray-700 rounded-lg hover:bg-gray-50"
              >
                ÷à
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {addresses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-600">Ñí	0@</p>
          </div>
        ) : (
          addresses.map((address: Address) => (
            <div key={address.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">{address.name}</span>
                    {address.isDefault && (
                      <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded">-</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{address.phone}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {address.city} {address.district} {address.street}
                    {address.zipCode && ` (${address.zipCode})`}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleEdit(address)}
                    className="px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded"
                  >
                    Ë/
                  </button>
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded"
                    >
                      -∫-
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    *d
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Link href="/profile" className="inline-block mt-6 text-primary-600 hover:text-primary-700">
        ê ‘ﬁ∫«ô
      </Link>
    </div>
  )
}
