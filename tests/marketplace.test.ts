import { describe, it, expect, beforeEach } from 'vitest'

// Mock blockchain state
let products: { [key: number]: any } = {}
let lastProductId = 0
let stxBalances: { [key: string]: number } = {}

// Mock contract functions
const listProduct = (sender: string, name: string, description: string, price: number) => {
  lastProductId++
  products[lastProductId] = {
    name,
    description,
    price,
    seller: sender,
    available: true
  }
  return { success: true, value: lastProductId }
}

const updateProduct = (sender: string, productId: number, newPrice: number, newAvailable: boolean) => {
  const product = products[productId]
  if (!product) return { success: false, error: 404 }
  if (product.seller !== sender) return { success: false, error: 401 }
  
  product.price = newPrice
  product.available = newAvailable
  return { success: true }
}

const buyProduct = (sender: string, productId: number) => {
  const product = products[productId]
  if (!product || !product.available) return { success: false, error: 404 }
  if ((stxBalances[sender] || 0) < product.price) return { success: false, error: 402 }
  
  stxBalances[sender] -= product.price
  stxBalances[product.seller] = (stxBalances[product.seller] || 0) + product.price
  product.available = false
  return { success: true }
}

const getProduct = (productId: number) => {
  return products[productId] || null
}

describe('Marketplace', () => {
  beforeEach(() => {
    products = {}
    lastProductId = 0
    stxBalances = {}
  })
  
  it('allows listing a product', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    
    const result = listProduct(wallet1, 'Probiotic Supplement', 'High-quality probiotic supplement', 100)
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
    
    const product = getProduct(1)
    expect(product).toEqual({
      name: 'Probiotic Supplement',
      description: 'High-quality probiotic supplement',
      price: 100,
      seller: wallet1,
      available: true
    })
  })
  
  it('allows updating a product', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    
    listProduct(wallet1, 'Probiotic Supplement', 'High-quality probiotic supplement', 100)
    
    const updateResult = updateProduct(wallet1, 1, 120, true)
    expect(updateResult.success).toBe(true)
    
    const product = getProduct(1)
    expect(product.price).toBe(120)
    expect(product.available).toBe(true)
  })
  
  it('prevents updating a product by non-seller', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    const wallet2 = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
    
    listProduct(wallet1, 'Probiotic Supplement', 'High-quality probiotic supplement', 100)
    
    const updateResult = updateProduct(wallet2, 1, 120, true)
    expect(updateResult.success).toBe(false)
    expect(updateResult.error).toBe(401)
  })
  
  it('allows buying a product with STX', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    const wallet2 = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
    
    listProduct(wallet1, 'Probiotic Supplement', 'High-quality probiotic supplement', 100)
    stxBalances[wallet2] = 200
    
    const buyResult = buyProduct(wallet2, 1)
    expect(buyResult.success).toBe(true)
    
    expect(stxBalances[wallet1]).toBe(100)
    expect(stxBalances[wallet2]).toBe(100)
    
    const product = getProduct(1)
    expect(product.available).toBe(false)
  })
  
  it('prevents buying a product with insufficient STX', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    const wallet2 = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
    
    listProduct(wallet1, 'Probiotic Supplement', 'High-quality probiotic supplement', 100)
    stxBalances[wallet2] = 50
    
    const buyResult = buyProduct(wallet2, 1)
    expect(buyResult.success).toBe(false)
    expect(buyResult.error).toBe(402)
    
    const product = getProduct(1)
    expect(product.available).toBe(true)
  })
})

