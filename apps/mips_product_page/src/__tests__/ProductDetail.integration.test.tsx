import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductDetail from '../components/ProductDetail';

// 1. Mock do Módulo Remoto (Reviews)
jest.mock('mips_reviews/ProductReviews', () => {
  return function DummyReviews() {
    return <div data-testid="remote-reviews">Reviews Component</div>;
  };
}, { virtual: true });

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

// 3. Dados Mock
const mockJumpsellerResponse = {
  product: {
    id: 32863784,
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
    (global as any).fetch = jest.fn(() => new Promise(() => {}));
    render(<ProductDetail />);
    expect(screen.getByText(/A carregar \(API\)/i)).toBeInTheDocument();
  });

  test('renderiza os dados corretamente (Happy Path)', async () => {
    (global as any).fetch = jest.fn((url: any) => {
      if (url.toString().includes('/reviews')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockJumpsellerResponse),
      });
    });

    render(<ProductDetail />);

    await screen.findByRole('heading', { name: /Galo de Barcelos/i, level: 1 });
    const descriptions = await screen.findAllByText(/Uma história rica e colorida/i);
    expect(descriptions.length).toBeGreaterThan(0);
    expect(screen.getByText('25.50 €')).toBeInTheDocument();
  });

  test('mostra mensagem de erro (404) após retries', async () => {
    (global as any).fetch = jest.fn((url: any) => {
      // Reviews OK para não crashar
      if (url.toString().includes('/reviews')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      
      // Produto falha com 404
      return Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });
    });

    render(<ProductDetail />);

    // CORREÇÃO: Aumentamos o timeout para 6000ms (6s).
    // O componente faz retries (1s + 1.5s + ...) antes de mostrar o erro.
    const errorMsg = await screen.findByText(/Erro/i, {}, { timeout: 6000 });
    expect(errorMsg).toBeInTheDocument();
    
    expect(screen.getByText(/404/i)).toBeInTheDocument();
  });

  test('troca a imagem principal ao clicar na miniatura', async () => {
    (global as any).fetch = jest.fn((url: any) => {
      if (url.toString().includes('/reviews')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockJumpsellerResponse),
      });
    });

    render(<ProductDetail />);

    await screen.findByRole('heading', { name: /Galo de Barcelos/i });

    const sideThumb = screen.getByAltText('Foto Lateral');
    fireEvent.click(sideThumb);

    await waitFor(() => {
      const images = screen.getAllByAltText('Foto Lateral');
      const mainImage = images.find(img => (img as HTMLImageElement).src.includes('galo-side.jpg'));
      expect(mainImage).toBeInTheDocument();
    });
  });
});