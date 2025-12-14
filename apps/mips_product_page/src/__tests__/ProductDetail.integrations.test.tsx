import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductDetail from '../components/ProductDetail';

// --- MOCKS ---

jest.mock('mips_reviews/ProductReviews', () => {
  return function MockReviews({ productId, customerId }: any) {
    // Renderiza apenas se tiver ID, mas o teste garante que passamos o ID
    return (
      <div data-testid="reviews-logged-in">
        Reviews for Product {productId} by User {customerId}
      </div>
    );
  };
}, { virtual: true });

jest.mock('mips_product_report/ReportModal', () => {
  return function MockReportModal({ visible, onClose, productTitle }: any) {
    if (!visible) return null;
    return (
      <div role="dialog" data-testid="report-modal">
        <h2>Reportar {productTitle}</h2>
        <button onClick={onClose}>Fechar</button>
      </div>
    );
  };
}, { virtual: true });

jest.mock('mips_bundle_suggestions/BundleSuggestions', () => () => <div />, { virtual: true });

const mockProduct = {
    id: 999,
    name: 'Galo Dourado', 
    description: 'Edição limitada',
    price: 100.0,
    images: [],
    fields: []
};

describe('ProductDetail - External Integrations', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        jest.clearAllMocks();
        (global as any).fetch = jest.fn((url: string) => {
            if (url.includes('/products/999') && !url.includes('wishlist')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ product: mockProduct }),
                });
            }
            if (url.includes('wishlist')) {
                return Promise.resolve({ ok: true, json: () => ({ inWishlist: false }) });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        });
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    test('Reviews: Passa os dados corretos (IDs) para o componente de Reviews', async () => {
        const buyerId = 18005446;
        
        render(<ProductDetail productId={999} buyerId={buyerId} />);
        
        await screen.findByRole('heading', { name: /Galo Dourado/i });

        const reviewsComponent = await screen.findByTestId('reviews-logged-in');
        
        expect(reviewsComponent).toHaveTextContent('Reviews for Product 999');
        expect(reviewsComponent).toHaveTextContent(`by User ${buyerId}`);
    });

    test('Report Modal: Abre o modal ao clicar na bandeira', async () => {
        // Simulamos user logado para garantir que o modal abre
        render(<ProductDetail productId={999} buyerId={55} />);
        
        await screen.findByRole('heading', { name: /Galo Dourado/i });

        // Modal fechado inicialmente
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

        // Clicar na bandeira
        const reportBtn = screen.getByLabelText('Reportar produto');
        fireEvent.click(reportBtn);

        // Modal deve abrir
        const modal = await screen.findByRole('dialog');
        expect(modal).toBeInTheDocument();
        expect(modal).toHaveTextContent('Reportar Galo Dourado');

        // Fechar modal
        const closeBtn = screen.getByText('Fechar');
        fireEvent.click(closeBtn);

        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
    });
});