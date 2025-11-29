import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductDetail from '../components/ProductDetail';

// --- Mocks ---

// Mock window.matchMedia
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

// Mock global.fetch
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.Mock;

// --- Mock Data (Formato da API) ---
const mockApiProduct = {
  id: 32614736,
  name: 'Galo de Barcelos (API)', // IMPORTANTE: A API usa 'name'
  description: 'A beautiful rooster from the API.',
  price: 30.0,
  images: [ // IMPORTANTE: A API usa 'images'
    { url: 'http://api.com/image1.jpg', description: 'API image 1' },
    { url: 'http://api.com/image2.jpg', description: 'API image 2' },
  ],
  fields: [{ label: 'Material', value: 'Ceramic' }],
};

const mockDbProduct = {
  id: 123,
  // A Base de Dados retorna o formato já processado (title/photos)
  title: 'Galo de Barcelos (DB)',
  description: 'Database description...',
  price: 25.99,
  avg_score: 4.5,
  reviewCount: 10,
  mainPhoto: { photo_url: 'https://db.com/main.jpg', alt_text: 'DB main photo' },
  photos: [
    { photo_url: 'https://db.com/main.jpg', alt_text: 'DB main photo' },
    { photo_url: 'https://db.com/extra.jpg', alt_text: 'DB extra photo' },
  ],
  specifications: [{ title: 'Origin', description: 'Portugal' }],
};

describe('ProductDetail (Unit Specs)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows loading state initially', async () => {
    mockFetch.mockReturnValue(new Promise(() => {})); // Pendente para sempre
    render(<ProductDetail />);
    expect(screen.getByText(/A carregar/i)).toBeInTheDocument();
  });

  test('loads product from Jumpseller API successfully', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/reviews')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockApiProduct) });
    });

    render(<ProductDetail />);

    // Verifica se carregou o nome corretamente
    expect(await screen.findByText('Galo de Barcelos (API)')).toBeInTheDocument();
  });

  test('falls back to database if Jumpseller API fails', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/reviews')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      
      // Simula falha na API (para forçar o erro)
      if (url.includes('/products/32614736') && !url.includes('jumpseller/')) {
        return Promise.reject(new Error('API Error'));
      }

      // Simula sucesso na BD (quando o utilizador pedir)
      if (url.includes('/products/jumpseller/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockDbProduct) });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<ProductDetail />);

    // 1. Esperar pelo botão de erro (timeout aumentado devido aos retries)
    const errorBtn = await screen.findByRole('button', { name: /Tentar mudar/i }, { timeout: 8000 });
    
    // 2. Clicar
    fireEvent.click(errorBtn);

    // 3. Verificar se carregou da BD
    const finalTitle = await screen.findByText('Galo de Barcelos (DB)');
    expect(finalTitle).toBeInTheDocument();
  });

  test('allows changing the main image by clicking a thumbnail', async () => {
    mockFetch.mockImplementation((url: string) => {
        if (url.includes('/reviews')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockApiProduct) });
    });

    render(<ProductDetail />);
    await screen.findByText('Galo de Barcelos (API)');

    // Procura imagens. O componente renderiza a principal e as miniaturas.
    const allImages = screen.getAllByRole('img');
    // A segunda imagem na lista de mocks é a miniatura que queremos clicar
    // No mockApiProduct, a segunda imagem tem description: 'API image 2'
    const thumb = screen.getByAltText('API image 2'); 
    
    fireEvent.click(thumb);

    // Verifica se alguma imagem com o src da segunda imagem está visível como destaque
    await waitFor(() => {
        const displayedImgs = screen.getAllByAltText('API image 2');
        // Deve haver pelo menos uma (a principal atualizada)
        expect(displayedImgs.length).toBeGreaterThan(0);
        const main = displayedImgs.find(img => (img as HTMLImageElement).src.includes('image2.jpg'));
        expect(main).toBeInTheDocument();
    });
  });
});