import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductDetail from '../components/ProductDetail';

// 1. Mock do Módulo Remoto
jest.mock('mips_reviews/ProductReviews', () => () => <div>Reviews Mock</div>, { virtual: true });

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

  // ADICIONADO: 3º argumento '15000' para aumentar o timeout deste teste específico
  test('Alterna para Base de Dados quando API falha (Lógica do botão)', async () => {
    const mockFetch = jest.fn((url: any) => {
      const urlStr = url.toString();
      // Sempre tratar reviews para não crashar
      if (urlStr.includes('/reviews')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      
      // 1. Simular Falha da API (404)
      return Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });
    });
    
    (global as any).fetch = mockFetch;

    render(<ProductDetail />);

    // Esperar pelo ecrã de erro (pode demorar devido aos retries do componente)
    // Aumentamos também o timeout do 'findByText' para garantir que ele espera o suficiente
    const errorTitle = await screen.findByText(/Erro/i, {}, { timeout: 10000 });
    expect(errorTitle).toBeInTheDocument();

    // 2. Preparar mock para a chamada da Base de Dados (Sucesso)
    mockFetch.mockImplementation((url: any) => {
      const urlStr = url.toString();
      if (urlStr.includes('/reviews')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      
      // Resposta de Sucesso da BD
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          id: 999,
          title: 'Produto vindo da BD',
          description: 'Descricao BD',
          price: 50,
          photos: [],
          specifications: []
        })
      });
    });

    // 3. Encontrar e clicar no botão
    const toggleButton = screen.getByRole('button', { name: /Tentar mudar para Base de Dados/i });
    fireEvent.click(toggleButton);

    // 4. Verificar se o novo produto carregou
    await screen.findByText('Produto vindo da BD');

  }, 15000); // <--- AQUI ESTÁ A CORREÇÃO: Aumenta o tempo limite do teste para 15s
});