import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductDetail from '../components/ProductDetail';
import { getJumpsellerApi } from '../services/jumpsellerApi'; // Import the original path

// --- Mock Setup ---

// 1. Create variables to hold the mock functions
// This allows us to reference them inside tests to check if they were called
const mockGetProduct = jest.fn();
const mockGetProductReviews = jest.fn();

// 2. Mock the entire module
// This replaces the actual 'getJumpsellerApi' with our mock version
jest.mock('../services/jumpsellerApi', () => ({
  getJumpsellerApi: jest.fn(() => ({
    getProduct: mockGetProduct,
    getProductReviews: mockGetProductReviews,
  })),
}));

// 3. Mock window.matchMedia (for MUI's useMediaQuery)
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

// 4. Mock global.fetch (for the database fallback)
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.Mock;

// 5. Define mock data
const mockApiProduct = {
  id: 32614736,
  name: 'Galo de Barcelos (API)',
  description: 'A beautiful rooster from the API.',
  price: 30.0,
  images: [
    { url: 'http://api.com/image1.jpg', description: 'API image 1' },
    { url: 'http://api.com/image2.jpg', description: 'API image 2' },
  ],
  fields: [{ label: 'Material', value: 'Ceramic' }],
};

const mockDbProduct = {
  id: 123,
  title: 'Galo de Barcelos (DB)',
  storytelling: 'Database storytelling...',
  description: 'Database description...',
  price: 25.99,
  avg_score: 4.5,
  reviewCount: 10,
  mainPhoto: {
    photo_url: 'https://db.com/main.jpg',
    alt_text: 'DB main photo',
  },
  photos: [
    {
      photo_url: 'https://db.com/main.jpg',
      alt_text: 'DB main photo',
    },
    {
      photo_url: 'https://db.com/extra.jpg',
      alt_text: 'DB extra photo',
    },
  ],
  specifications: [{ title: 'Origin', description: 'Portugal' }],
};

// --- Test Suite ---

describe('ProductDetail', () => {
  beforeEach(() => {
    // Reset all mock implementations and call counts before each test
    jest.clearAllMocks();
    mockGetProduct.mockReset();
    mockGetProductReviews.mockReset();
    mockFetch.mockReset();
  });

  test('shows loading state initially', () => {
    // Set up mocks to be pending
    mockGetProduct.mockReturnValue(new Promise(() => {})); // Never resolves
    mockFetch.mockReturnValue(new Promise(() => {})); // Never resolves

    render(<ProductDetail />);

    // Check for the correct loading text. 
    // The regex /A carregar produto/i failed because the text is "A carregar Galo de Barcelos..."
    expect(
      screen.getByText('A carregar Galo de Barcelos...')
    ).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('loads product from Jumpseller API successfully (happy path)', async () => {
    // Mock a successful API response
    mockGetProduct.mockResolvedValue(mockApiProduct);
    mockGetProductReviews.mockResolvedValue([]); // No reviews for simplicity

    render(<ProductDetail />);

    // Wait for the loading to be replaced by the product title
    expect(await screen.findByText('Galo de Barcelos (API)')).toBeInTheDocument();

    // Check that the correct source is displayed
    expect(screen.getByText(/Fonte: Jumpseller API/i)).toBeInTheDocument();
    
    // Check that the database was NOT called
    expect(mockFetch).not.toHaveBeenCalled();
    
    // Check that the API was called
    expect(mockGetProduct).toHaveBeenCalledWith(32614736);
  });

  test('falls back to database if Jumpseller API fails', async () => {
    // 1. Mock Jumpseller API to fail
    mockGetProduct.mockRejectedValue(new Error('Mocked Jumpseller API failure'));

    // 2. Mock 'fetch' (database) to succeed
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDbProduct),
    } as Response);

    render(<ProductDetail />);

    // Wait for the final title from the database to appear
    const finalTitle = await screen.findByText('Galo de Barcelos (DB)');
    expect(finalTitle).toBeInTheDocument();

    // Check that the loading spinner is gone
    expect(
      screen.queryByText('A carregar Galo de Barcelos...')
    ).not.toBeInTheDocument();

    // Check that the data source is 'database'
    expect(screen.getByText(/Fonte: Base de Dados/i)).toBeInTheDocument();

    // Check that both services were called
    expect(mockGetProduct).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3002/products/jumpseller/32614736'
    );
  });

  test('shows an error message if both Jumpseller and database fail', async () => {
    // 1. Mock Jumpseller API to fail
    mockGetProduct.mockRejectedValue(new Error('Jumpseller API failure'));

    // 2. Mock 'fetch' (database) to also fail
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Database fetch failed' }),
    } as Response);

    render(<ProductDetail />);

    // Wait for the error message to appear
    const errorMsg = await screen.findByText('❌ Erro ao carregar produto');
    expect(errorMsg).toBeInTheDocument();

    // Check that the specific error message from the DB is shown
    expect(await screen.findByText(/Database fetch failed/i)).toBeInTheDocument();

    // Check that the loading spinner is gone
    expect(
      screen.queryByText('A carregar Galo de Barcelos...')
    ).not.toBeInTheDocument();
  });

  test('allows changing the main image by clicking a thumbnail', async () => {
    // We'll use the database fallback mock for this test
    mockFallbackSuccess();
    render(<ProductDetail />);

    // Wait for the component to load
    await screen.findByText('Galo de Barcelos (DB)');

    // Find the main image. It should be the first one in the array.
    // The component uses the alt text for the main image.
    const mainImg = screen.getByAltText('DB main photo');
    expect(mainImg).toBeInTheDocument();
    expect((mainImg as HTMLImageElement).src).toContain('main.jpg');

    // Find the thumbnail for the second image
    const thumbExtra = screen.getByRole('img', { name: /DB extra photo/i });
    expect(thumbExtra).toBeInTheDocument();

    // Click the thumbnail
    fireEvent.click(thumbExtra);

    // Now the main image should have the 'alt_text' of the second photo
    const mainImgAfter = await screen.findByAltText('DB extra photo');
    expect(mainImgAfter).toBeInTheDocument();
    
    // And the src should have updated
    expect((mainImgAfter as HTMLImageElement).src).toContain('extra.jpg');
  });
});