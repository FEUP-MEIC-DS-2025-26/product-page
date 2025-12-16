import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductDetail from '../components/ProductDetail';

// 1. Mocks dos Módulos Remotos (Federated Modules)
jest.mock('mips_reviews/ProductReviews', () => {
  return function DummyReviews() {
    return <div data-testid="remote-reviews">Reviews Component</div>;
  };
}, { virtual: true });

jest.mock('mips_bundle_suggestions/BundleSuggestions', () => () => <div>Bundle Mock</div>, { virtual: true });
jest.mock('mips_product_report/ReportModal', () => () => <div>Report Mock</div>, { virtual: true });
jest.mock('mips_product_customization/CustomizationModal', () => () => <div>Customization Mock</div>, { virtual: true });

// 2. Mock do matchMedia
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

// 3. Dados Mock de um produto completo
const mockJumpsellerResponse = {
  product: {
    id: 33007106,
    name: 'Galo de Barcelos',
    description: '<p>Uma história rica e colorida...</p>',
    price: 25.50,
    images: [
      { url: 'https://example.com/galo-main.jpg', description: 'Foto Principal' },
      { url: 'https://example.com/galo-side.jpg', description: 'Foto Lateral' },
    ],
    fields: [{ label: 'Material', value: 'Cerâmica' }]
  }
};

describe('ProductDetail Integration', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test('mostra o indicador de loading inicial', async () => {
    // Retorna uma promessa que nunca resolve para manter o estado "loading"
    (global as any).fetch = jest.fn(() => new Promise(() => {}));
    
    render(<ProductDetail productId={33007106} />);
    
    expect(screen.getByText(/A carregar produto/i)).toBeInTheDocument();
  });

  test('renderiza os dados corretamente (Happy Path)', async () => {
    (global as any).fetch = jest.fn((url: any) => {
      const urlStr = url.toString();

      // Mock Reviews
      if (urlStr.includes('/reviews')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      
      // Mock Calls Auxiliares (Wishlist/Rating)
      if (urlStr.includes('/wishlist') || urlStr.includes('/rating')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }

      // Mock Produto Principal
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockJumpsellerResponse),
      });
    });

    render(<ProductDetail productId={33007106} />);

    await screen.findByRole('heading', { name: /Galo de Barcelos/i, level: 1 });
    const descriptions = await screen.findAllByText(/Uma história rica e colorida/i);
    expect(descriptions.length).toBeGreaterThan(0);
    expect(screen.getByText('25.50 €')).toBeInTheDocument();
  });

  test('mostra mock de "Produto não encontrado" se falhar em todas as fontes', async () => {
    (global as any).fetch = jest.fn((url: any) => {
      const urlStr = url.toString();
      
      if (urlStr.includes('/reviews')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      
      // As chamadas de wishlist não devem impedir a renderização do 404
      if (urlStr.includes('/wishlist') || urlStr.includes('/rating')) {
         return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      
      // Falha no produto
      return Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });
    });

    render(<ProductDetail productId={99999} />);
    
    const notFoundTitle = await screen.findByRole('heading', { 
      name: /Produto não encontrado/i, 
      level: 1 
    });
    expect(notFoundTitle).toBeInTheDocument();
    
    expect(screen.getByText(/O produto que está a tentar aceder não existe/i)).toBeInTheDocument();
  });

  test('troca a imagem principal ao clicar na miniatura', async () => {
    (global as any).fetch = jest.fn((url: any) => {
      const urlStr = url.toString();

      if (urlStr.includes('/reviews')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }

      if (urlStr.includes('/wishlist') || urlStr.includes('/rating')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockJumpsellerResponse),
      });
    });

    render(<ProductDetail productId={33007106} />);

    // Espera carregar
    await screen.findByRole('heading', { name: /Galo de Barcelos/i });

    // Encontra a miniatura e clica
    const sideThumb = screen.getByAltText('Foto Lateral');
    fireEvent.click(sideThumb);

    // Verifica se a imagem principal mudou
    await waitFor(() => {
      const images = screen.getAllByAltText('Foto Lateral');
      // Procura a imagem que está a ser exibida como principal (src correto)
      const mainImage = images.find(img => (img as HTMLImageElement).src.includes('galo-side.jpg'));
      expect(mainImage).toBeInTheDocument();
    });
  });
});