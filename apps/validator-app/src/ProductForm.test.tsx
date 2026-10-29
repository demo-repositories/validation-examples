/** @vitest-environment jsdom */
import {act} from 'react'
import {createRoot, type Root} from 'react-dom/client'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {getValidationSchema} from '@validation-examples/content-schema'
import {ProductForm} from './ProductForm.js'

;(globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT?: boolean}).IS_REACT_ACT_ENVIRONMENT = true

function validationClient() {
  const client: any = {
    fetch: vi.fn().mockResolvedValue(false),
    getDataUrl: vi.fn(),
    observable: {fetch: vi.fn(), request: vi.fn()},
  }
  client.withConfig = vi.fn().mockReturnValue(client)
  return client
}

describe('ProductForm', () => {
  let root: Root | undefined

  afterEach(() => {
    act(() => root?.unmount())
    document.body.innerHTML = ''
  })

  it('shows schema errors and warnings on the matching inputs', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)

    await act(async () => {
      root?.render(<ProductForm client={validationClient()} schema={getValidationSchema()} />)
    })
    await vi.waitFor(
      () => {
        expect(container.textContent).toContain('Sale price must be lower than price')
      },
      {timeout: 2000},
    )

    const text = container.textContent ?? ''
    expect(text).toContain('Sale price must be lower than price')
    expect(text).toContain('Active products need an SEO description')
    expect(text).toContain('Variant SKU "BLUE-0001" is repeated')
    expect(text).toContain('Titles under 50 characters usually display better')
  })
})
