import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductDetail from '../components/ProductDetail';

// --- Mock Setup ---

// 1. Mock window.matchMedia
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

// 2. Mock global.fetch
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.Mock;

// 3. Mock Data
const mockRawApiData = {
  product: {
    id: 32614736,
    name: 'Galo de Barcelos (API)',
    description: '<p>Um galo muito bonito vindo da API.</p>',
    price: 30.0,
    images: [
      { url: 'http://api.com/image1.jpg', description: 'API image 1' },
      { url: 'http://api.com/image2.jpg', description: 'API image 2' },
    ],
    fields: [{ label: 'Material', value: 'Cerâmica' }],
    brand: 'Artesanato Luso'
  }
};

const mockDbData = {
  id: 32614736,
  title: 'Galo de Barcelos (DB)',
  storytelling: 'História linda vinda da Base de Dados...',
  description: 'Descrição DB...',
  price: 25.00,
  avg_score: 4.8,
  reviewCount: 12,
  mainPhoto: {
    photo_url: 'https://db.com/main.jpg',
    alt_text: 'DB main photo',
  },
  photos: [
    { photo_url: 'https://db.com/main.jpg', alt_text: 'DB main photo' },
    { photo_url: 'https://db.com/extra.jpg', alt_text: 'DB extra photo' },
  ],
  specifications: [{ title: 'Origem', description: 'Barcelos' }],
  brand: 'Brand DB'
};

const mockReviews = [
  { rating: 5, title: 'Ótimo', body: 'Gostei muito' },
  { rating: 4, title: 'Bom', body: 'Ok' }
];

// --- Test Suite ---

describe('ProductDetail Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configuração base do fetch
    mockFetch.mockImplementation((url) => {
      if (url.includes('/reviews')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockReviews),
        });
      }
      
      if (url.includes('/products/jumpseller/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDbData),
        });
      }

      if (url.includes('/products/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRawApiData),
        });
      }

      return Promise.reject(new Error('URL desconhecido no mock'));
    });
  });

  test('mostra estado de loading inicial (API por defeito)', () => {
    mockFetch.mockReturnValue(new Promise(() => {})); 

    render(<ProductDetail />);

    expect(screen.getByText('A carregar (API)...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('carrega produto da API Jumpseller com sucesso (Caminho Feliz)', async () => {
    render(<ProductDetail />);

    expect(await screen.findByText('Galo de Barcelos (API)')).toBeInTheDocument();
    expect(screen.getByText(/Fonte: Jumpseller API/i)).toBeInTheDocument();
    expect(screen.getByText('30.00 €')).toBeInTheDocument();

    // CORREÇÃO: getAllByAltText porque existem 2 imagens (Principal + Thumbnail)
    const imgs = screen.getAllByAltText('API image 1');
    expect(imgs.length).toBeGreaterThan(0);
    expect(imgs[0]).toHaveAttribute('src', 'http://api.com/image1.jpg');
    
    expect(screen.getByText(/4.5/)).toBeInTheDocument();
  });

  test('permite alternar para a Base de Dados clicando no Badge', async () => {
    render(<ProductDetail />);

    await screen.findByText('Galo de Barcelos (API)');

    const toggleBtn = screen.getByText(/Fonte: Jumpseller API/i);
    fireEvent.click(toggleBtn);

    expect(screen.getByText('A carregar (BD)...')).toBeInTheDocument();
    expect(await screen.findByText('Galo de Barcelos (DB)')).toBeInTheDocument();
    expect(screen.getByText(/Fonte: Base de Dados/i)).toBeInTheDocument();
    expect(screen.getByText('25.00 €')).toBeInTheDocument();
  });

  test('mostra erro e permite tentar trocar de fonte se falhar', async () => {
    mockFetch.mockImplementation((url) => {
        // Importante: reviews tem de responder array vazio para não crashar antes do erro do produto
        if (url.includes('/reviews')) return Promise.resolve({ ok: true, json: () => [] });

        if (url.includes('/products/') && !url.includes('jumpseller')) {
            return Promise.reject(new Error('API Down'));
        }
        return Promise.resolve({ ok: true });
    });

    render(<ProductDetail />);

    expect(await screen.findByText(/Erro \(jumpseller\)/i)).toBeInTheDocument();
    expect(screen.getByText('API Down')).toBeInTheDocument();

    const switchButton = screen.getByRole('button', { name: /Tentar mudar para Base de Dados/i });
    expect(switchButton).toBeInTheDocument();

    mockFetch.mockImplementation((url) => {
        if (url.includes('/reviews')) return Promise.resolve({ ok: true, json: () => [] });
        if (url.includes('/products/jumpseller/')) {
             return Promise.resolve({ ok: true, json: () => Promise.resolve(mockDbData) });
        }
        return Promise.reject(new Error('API Down'));
    });

    fireEvent.click(switchButton);

    expect(await screen.findByText('Galo de Barcelos (DB)')).toBeInTheDocument();
  });

  test('permite trocar a imagem principal ao clicar na miniatura', async () => {
    // CORREÇÃO CRÍTICA AQUI: Ordem dos IFs e inclusão do /reviews
    mockFetch.mockImplementation((url) => {
        if (url.includes('/reviews')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        if (url.includes('/products/jumpseller/')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockDbData) });
        if (url.includes('/products/')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRawApiData) });
        return Promise.resolve({ ok: true, json: () => [] });
    });

    render(<ProductDetail />);
    
    // O botão pode não estar imediatamente disponível se ainda estiver a carregar ou se houver erro
    // Usamos findByText para garantir que carregou a versão API primeiro
    const toggleBtn = await screen.findByText(/Fonte: Jumpseller API/i);
    fireEvent.click(toggleBtn);
    
    await screen.findByText('Galo de Barcelos (DB)');

    // Verificar imagem atual (Index 0)
    const mainImgs = screen.getAllByAltText('DB main photo');
    expect(mainImgs[0]).toBeInTheDocument();

    // Encontrar a thumbnail da segunda imagem
    // Procuramos todas as imagens e filtramos pela URL da extra
    const allImages = screen.getAllByRole('img');
    const thumbExtra = allImages.find(img => img.getAttribute('src') === 'https://db.com/extra.jpg');
    
    if (thumbExtra) {
        fireEvent.click(thumbExtra.parentElement!); // Clicar no Box pai
    } else {
        throw new Error('Thumbnail não encontrada');
    }

    await waitFor(() => {
        // Agora a imagem principal deve ter o alt da segunda foto
        const bigImageContainer = screen.getAllByAltText('DB extra photo'); 
        expect(bigImageContainer.length).toBeGreaterThan(0);
        expect(bigImageContainer[0]).toHaveAttribute('src', 'https://db.com/extra.jpg');
    });
  });
});