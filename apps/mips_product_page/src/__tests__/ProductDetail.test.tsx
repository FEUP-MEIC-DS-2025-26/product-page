import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductDetail from '../components/ProductDetail';

// Mock matchMedia
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

// Mock Data Simplificado
const mockApiProduct = {
  product: {
    id: 1,
    name: 'Galo de Barcelos',
    description: 'Descrição do produto para testar.',
    price: 25.00,
    images: [{ url: 'https://example.com/main.jpg', description: 'Foto principal' }],
    fields: []
  }
};

describe('ProductDetail Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).fetch = jest.fn((url) => {
        if (url.includes('/reviews')) return Promise.resolve({ ok: true, json: () => [] });
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockApiProduct),
        });
    });
  });

  test('fluxo completo de renderização do produto', async () => {
    render(<ProductDetail />);

    // 1. Loading
    expect(screen.getByText(/A carregar/i)).toBeInTheDocument();

    // 2. Renderização de conteúdo
    const title = await screen.findByRole('heading', { name: /Galo de Barcelos/i, level: 1 });
    expect(title).toBeInTheDocument();

    // Preço
    expect(screen.getByText('25.00 €')).toBeInTheDocument();

    // Botões de Ação
    expect(screen.getByText(/Comprar/i)).toBeInTheDocument();
    expect(screen.getByText(/Falar com o Vendedor/i)).toBeInTheDocument();

    // Secção de História
    expect(screen.getByText('História do Produto')).toBeInTheDocument();
    
    // CORREÇÃO: Como o texto aparece em 2 sítios (Storytelling e Descrição completa),
    // usamos getAllByText e verificamos se pelo menos um existe.
    const descriptions = screen.getAllByText('Descrição do produto para testar.');
    expect(descriptions.length).toBeGreaterThan(0);
    expect(descriptions[0]).toBeInTheDocument();
  });

  test('exibe mensagem de erro quando fetch falha', async () => {
    (global as any).fetch = jest.fn(() => Promise.reject(new Error('Network Error')));

    render(<ProductDetail />);

    const errorMsg = await screen.findByText(/Erro \(jumpseller\)/i);
    expect(errorMsg).toBeInTheDocument();
    
    // Verifica se o botão de tentar outra fonte aparece
    expect(screen.getByText(/Tentar mudar para/i)).toBeInTheDocument();
  });
});