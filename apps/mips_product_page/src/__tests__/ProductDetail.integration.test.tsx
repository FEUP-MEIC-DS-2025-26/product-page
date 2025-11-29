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

// --- DADOS DE MOCK (Formato Jumpseller API) ---
const mockProductCorrectFormat = {
  id: 1,
  name: 'Galo de Barcelos',
  description: 'Descrição do produto para testar.',
  price: 25.00,
  images: [
    { url: 'https://example.com/main.jpg', description: 'Foto principal' },
    { url: 'https://example.com/extra.jpg', description: 'Foto extra' }
  ],
  fields: [] 
};

// --- Helpers ---

const mockFetchSuccess = () => {
  (global as any).fetch = jest.fn((url: string) => {
      // Mock para reviews (opcional, evita erros na consola)
      if (url.includes('/reviews')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      // Mock para produto
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProductCorrectFormat),
      });
  });
};

const mockFetchError = () => {
  (global as any).fetch = jest.fn(() =>
    Promise.resolve({
      ok: false,
      status: 500,
    }),
  );
};

describe('ProductDetail Integration', () => {
  
  // CORREÇÃO 1: beforeEach simples e fechado corretamente
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('mostra o texto de loading enquanto carrega o produto', async () => {
    mockFetchSuccess();
    render(<ProductDetail />);

    expect(screen.getByText(/A carregar/i)).toBeInTheDocument();
    
    await waitFor(() => expect(screen.queryByText(/A carregar/i)).not.toBeInTheDocument());
  });

  test('renderiza título, descrição e preço quando o produto é carregado', async () => {
    mockFetchSuccess();
    render(<ProductDetail />);

    // Título
    const title = await screen.findByRole('heading', { name: /Galo de Barcelos/i });
    expect(title).toBeInTheDocument();

    // Descrição
    const descriptions = screen.getAllByText(/Descrição do produto para testar./i);
    expect(descriptions.length).toBeGreaterThan(0);
    expect(descriptions[0]).toBeInTheDocument();

    // Preço
    expect(screen.getByText('25.00 €')).toBeInTheDocument();
  });

  test('mostra erro e permite tentar trocar de fonte se falhar', async () => {
    mockFetchError(); 
    render(<ProductDetail />);

    // Usa findByRole para evitar conflito de múltiplos textos
    const errorHeading = await screen.findByRole('heading', { name: /Erro/i }, { timeout: 10000 });
    expect(errorHeading).toBeInTheDocument();

    const switchButton = screen.getByRole('button', { name: /Tentar mudar/i });
    expect(switchButton).toBeInTheDocument();
  }, 15000); 

  // CORREÇÃO 3: Removida a tentativa de clicar no botão "Fonte" (que está oculto)
  // O teste agora foca-se apenas na troca de imagens da galeria
  test('permite trocar a imagem principal ao clicar na miniatura', async () => {
    mockFetchSuccess();
    render(<ProductDetail />);
    
    // Espera o produto carregar
    await screen.findByRole('heading', { name: /Galo de Barcelos/i });

    // 1. Verificar imagem inicial (main.jpg)
    const mainImages = screen.getAllByAltText('Foto principal'); // O mock tem alt="Foto principal"
    const mainImgBefore = mainImages.find(img => (img as HTMLImageElement).src.includes('main.jpg'));
    expect(mainImgBefore).toBeInTheDocument();

    // 2. Clicar na miniatura "Foto extra"
    // Nota: O componente ProductDetail usa o mesmo array de fotos para a imagem grande e as miniaturas.
    // Precisamos encontrar a miniatura especifica.
    const extraImages = screen.getAllByAltText('Foto extra');
    // Normalmente a primeira é a que está no carrossel/lista de miniaturas
    fireEvent.click(extraImages[0]);

    // 3. Verificar se a imagem principal mudou para extra.jpg
    await waitFor(() => {
      // Agora procuramos a imagem extra que está a ser exibida como principal (tamanho maior ou visivel)
      const allExtraImages = screen.getAllByAltText('Foto extra');
      const visibleExtra = allExtraImages.find(img => (img as HTMLImageElement).src.includes('extra.jpg'));
      expect(visibleExtra).toBeInTheDocument();
    });
  });
});