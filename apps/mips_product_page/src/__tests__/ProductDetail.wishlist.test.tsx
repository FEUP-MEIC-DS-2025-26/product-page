import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductDetail from '../components/ProductDetail';

// Mocks dos módulos remotos
jest.mock('mips_reviews/ProductReviews', () => () => <div data-testid="reviews-mock" />, { virtual: true });
jest.mock('mips_bundle_suggestions/BundleSuggestions', () => () => <div data-testid="bundles-mock" />, { virtual: true });
jest.mock('mips_product_report/ReportModal', () => () => <div data-testid="report-mock" />, { virtual: true });

// Mock do matchMedia
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

const mockProduct = {
  id: 100,
  name: 'Produto Teste Wishlist',
  price: 10.0,
  images: [],
  fields: []
};

describe('ProductDetail - Wishlist Integration', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('Adiciona à wishlist e muda o ícone quando o utilizador clica', async () => {
    (global as any).fetch = jest.fn((url: string) => {
      // 1. Fetch do Produto
      if (url.includes('/products/100') && !url.includes('wishlist')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ product: mockProduct }),
        });
      }
      // 2. Estado inicial: NÃO está na wishlist
      if (url.includes('/wishlist/check')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ inWishlist: false }),
        });
      }
      // 3. Ação de Adicionar
      if (url.includes('/wishlist/add')) {
        return Promise.resolve({ ok: true });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    render(<ProductDetail productId={100} buyerId={1} />);

    await screen.findByRole('heading', { name: /Produto Teste Wishlist/i });

    // Botão inicial (Coração Vazio -> "Adicionar")
    const wishlistBtn = screen.getByLabelText('Adicionar à wishlist');
    expect(wishlistBtn).toBeInTheDocument();

    // CLICAR NO BOTÃO
    fireEvent.click(wishlistBtn);

    // Verificar se chamou a API de adicionar
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/wishlist/add?buyerId=1&productId=100'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    // Verificar se o ícone mudou (Coração Cheio -> "Remover")
    await waitFor(() => {
        expect(screen.getByLabelText('Remover da wishlist')).toBeInTheDocument();
    });
  });
});