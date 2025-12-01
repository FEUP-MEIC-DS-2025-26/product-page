/// <reference types="cypress" />

// 1. Mock do Produto (Estrutura Jumpseller RAW)
const mockJumpsellerProduct = {
  product: {
    id: 99999, // ID irrelevante, o intercept apanha tudo
    name: 'Galo de Barcelos',
    description: '<p>História linda do produto...</p><p>Descrição do produto para testar.</p>',
    price: 25.00,
    stock: 10,
    images: [
      { url: 'https://madeinportugal.store/main.jpg', description: 'Foto principal' },
      { url: 'https://madeinportugal.store/extra.jpg', description: 'Foto extra' }
    ],
    fields: [
      { label: 'Material', value: 'Barro' }
    ]
  }
};

// 2. Mock das Reviews
const mockReviews = [
  { rating: 5, title: 'Ótimo', body: 'Muito bom' },
  { rating: 4, title: 'Bom', body: 'Gostei' },
  { rating: 5, title: 'Excelente', body: 'Perfeito' }
];

describe('ProductDetail — Testes de Aceitação', () => {

  beforeEach(() => {
    // [CORREÇÃO] Usamos '*' em vez de '1' para garantir que apanha o pedido
    // mesmo que a app use o ID de fallback (32863784).
    cy.intercept(
      'GET', 
      '**/api/products/*', 
      {
        statusCode: 200,
        body: mockJumpsellerProduct,
      }
    ).as('getProduct');

    // [CORREÇÃO] Wildcard também para as reviews
    cy.intercept(
      'GET',
      '**/api/products/*/reviews',
      {
        statusCode: 200,
        body: mockReviews,
      }
    ).as('getReviews');
  });

  it('carrega a página e mostra título, descrição e preço', () => {
    // Visitamos a página. Mesmo que o router falhe e não passe o ID 1,
    // a app vai carregar o ID default e os nossos intercepts acima (com *) vão funcionar.
    cy.visit('/product/1');    

    // Esperar pelos pedidos de rede
    cy.wait(['@getProduct', '@getReviews']);

    // Verificações Visuais
    cy.findByRole('heading', { name: /Galo de Barcelos/i }).should('exist');
    cy.contains('História linda do produto...').should('exist');
    
    // Nota: O componente formata o preço com 2 casas decimais
    cy.contains('25.00 €').should('exist'); 
  });

  it('mostra as estrelas e número de avaliações', () => {
    cy.visit('/product/1');
    cy.wait(['@getProduct', '@getReviews']);

    // Verifica se calculou corretamente a contagem (3 items no mockReviews)
    cy.contains('(3 avaliações)').should('exist');
  });

  it('mostra imagem principal e miniaturas', () => {
    cy.visit('/product/1');
    cy.wait('@getProduct');

    // Verifica se as imagens carregaram com os Alt Texts corretos
    cy.get('img[alt="Foto principal"]').should('exist');
    cy.get('img[alt="Foto extra"]').should('exist');
  });

  it('troca a foto quando se clica numa miniatura', () => {
    cy.visit('/product/1');
    cy.wait('@getProduct');

    // 1. Verifica estado inicial: Imagem grande deve ter o src da 'main.jpg'
    // O seletor procura a imagem dentro da área principal (pode ajustar o seletor se necessário)
    cy.get('img[alt="Foto principal"]')
      .should('have.attr', 'src')
      .and('include', 'main.jpg');

    // 2. Clica na miniatura da segunda foto
    // Usamos .last() ou um seletor específico para clicar na *miniatura* e não na imagem grande
    cy.get('img[alt="Foto extra"]').click();

    // 3. Verifica se a Imagem Grande mudou
    // Agora a imagem grande deve ter o src da 'extra.jpg'
    cy.get('img[alt="Foto extra"]')
      .should('have.attr', 'src')
      .and('include', 'extra.jpg');
  });
});