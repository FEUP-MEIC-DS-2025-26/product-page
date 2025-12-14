import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductDetail from '../components/ProductDetail';

// --- MOCKS DOS MÓDULOS REMOTOS (FEDERATED MODULES) ---
// É crucial mockar estes componentes pois eles não existem localmente no ambiente de teste
jest.mock('mips_reviews/ProductReviews', () => () => <div>Reviews Mock</div>, { virtual: true });
jest.mock('mips_bundle_suggestions/BundleSuggestions', () => () => <div>Bundle Mock</div>, { virtual: true });
jest.mock('mips_product_report/ReportModal', () => () => <div>Report Mock</div>, { virtual: true });
jest.mock('mips_product_customization/CustomizationModal', () => () => <div>Customization Mock</div>, { virtual: true });

// Mock do window.matchMedia (necessário para componentes responsivos do MUI)
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
    // Silencia erros/avisos da consola durante os testes para manter o output limpo
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    (global as any).fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test('Faz fallback automático para Base de Dados quando API principal (Jumpseller) falha', async () => {
    const mockFetch = jest.fn((url: any) => {
      const urlStr = url.toString();
      
      // 1. Mock para as reviews
      if (urlStr.includes('/reviews')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }

      // 2. Mock para ignorar chamadas secundárias (wishlist, rating)
      // Estas chamadas acontecem no mount, se falharem ou rejeitarem, o teste falha.
      if (urlStr.includes('/wishlist') || urlStr.includes('/rating')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ inWishlist: false }) });
      }
    
      // 3. Cenário de Teste: Falha no endpoint principal (/products/ID)
      if (urlStr.includes('/products/123') && !urlStr.includes('/products/jumpseller/123')) {
        return Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        });
      }

      // 4. Cenário de Teste: Sucesso no endpoint de Fallback (BD)
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

      return Promise.reject(`URL desconhecido: ${urlStr}`);
    });
    
    (global as any).fetch = mockFetch;

    render(<ProductDetail productId="123" />);

    // Espera que o texto do produto de fallback apareça no ecrã
    await screen.findByText('Produto vindo da BD', {}, { timeout: 4000 });

    expect(screen.getByText('50.00 €')).toBeInTheDocument();
  });
});