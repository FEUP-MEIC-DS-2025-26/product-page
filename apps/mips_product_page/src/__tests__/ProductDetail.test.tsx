import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductDetail from '../components/ProductDetail';

jest.mock('mips_reviews/ProductReviews', () => () => <div>Reviews Mock</div>, { virtual: true });

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: any) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

describe('ProductDetail Unit Logic', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    (global as any).fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test('Faz fallback automático para Base de Dados quando API falha', async () => {
    const mockFetch = jest.fn((url: any) => {
      const urlStr = url.toString();
      
      if (urlStr.includes('/reviews')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
    
      if (urlStr.includes('/products/123') && !urlStr.includes('/products/jumpseller/123')) {
        return Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        });
      }

      if (urlStr.includes('/products/jumpseller/123')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 123,
            title: 'Produto vindo da BD',
            description: 'Descricao BD',
            price: 50,
            photos: [],
            specifications: []
          })
        });
      }

      return Promise.reject('URL desconhecido');
    });
    
    (global as any).fetch = mockFetch;

    render(<ProductDetail productId="123" />);

    await screen.findByText('Produto vindo da BD', {}, { timeout: 4000 });

    expect(screen.getByText('50.00 €')).toBeInTheDocument();
  });
});