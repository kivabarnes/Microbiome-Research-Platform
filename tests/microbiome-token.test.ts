import { describe, it, expect, beforeEach } from 'vitest'

// Mock blockchain state
let tokenBalances: { [key: string]: number } = {}
let contractOwner = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'

// Mock contract functions
const mint = (sender: string, amount: number, recipient: string) => {
  if (sender !== contractOwner) {
    return { success: false, error: 100 }
  }
  tokenBalances[recipient] = (tokenBalances[recipient] || 0) + amount
  return { success: true }
}

const transfer = (sender: string, amount: number, recipient: string) => {
  if (tokenBalances[sender] < amount) {
    return { success: false, error: 101 }
  }
  tokenBalances[sender] -= amount
  tokenBalances[recipient] = (tokenBalances[recipient] || 0) + amount
  return { success: true }
}

const getBalance = (account: string) => {
  return tokenBalances[account] || 0
}

describe('MicrobiomeToken', () => {
  beforeEach(() => {
    tokenBalances = {}
  })
  
  it('allows minting tokens by the contract owner', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    
    const mintResult = mint(contractOwner, 1000, wallet1)
    expect(mintResult.success).toBe(true)
    
    const balance = getBalance(wallet1)
    expect(balance).toBe(1000)
  })
  
  it('prevents minting tokens by non-owners', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    const wallet2 = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
    
    const mintResult = mint(wallet1, 1000, wallet2)
    expect(mintResult.success).toBe(false)
    expect(mintResult.error).toBe(100)
    
    const balance = getBalance(wallet2)
    expect(balance).toBe(0)
  })
  
  it('allows transferring tokens between accounts', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    const wallet2 = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
    
    mint(contractOwner, 1000, wallet1)
    
    const transferResult = transfer(wallet1, 500, wallet2)
    expect(transferResult.success).toBe(true)
    
    expect(getBalance(wallet1)).toBe(500)
    expect(getBalance(wallet2)).toBe(500)
  })
  
  it('prevents transferring more tokens than available', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    const wallet2 = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
    
    mint(contractOwner, 1000, wallet1)
    
    const transferResult = transfer(wallet1, 1500, wallet2)
    expect(transferResult.success).toBe(false)
    expect(transferResult.error).toBe(101)
    
    expect(getBalance(wallet1)).toBe(1000)
    expect(getBalance(wallet2)).toBe(0)
  })
})

