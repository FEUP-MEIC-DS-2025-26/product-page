import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Create or update user
  const user = await prisma.user.upsert({
    where: { email: 'diddy@madeinportugal.store' },
    update: { photo_url: '/Diddy.jpg' },
    create: {
      username: 'diddy',
      first_name: 'Diddy',
      last_name: 'User',
      email: 'diddy@madeinportugal.store',
      password_hash: 'dev-only',
      photo_url: '/Diddy.jpg',
    },
  });

  console.log('✅ User created or updated');

  // Create additional users for reviews
  const users = [
    {
      username: 'afonso_castro',
      first_name: 'Afonso',
      last_name: 'Castro',
      email: 'afonso@example.com',
      password_hash: 'dev-only',
      photo_url: null,
    },
    {
      username: 'filipa_geraldes',
      first_name: 'Filipa',
      last_name: 'Geraldes',
      email: 'filipa@example.com',
      password_hash: 'dev-only',
      photo_url: null,
    },
    {
      username: 'maria_silva',
      first_name: 'Maria',
      last_name: 'Silva',
      email: 'maria@example.com',
      password_hash: 'dev-only',
      photo_url: null,
    },
    {
      username: 'joao_santos',
      first_name: 'João',
      last_name: 'Santos',
      email: 'joao@example.com',
      password_hash: 'dev-only',
      photo_url: null,
    },
    {
      username: 'ana_costa',
      first_name: 'Ana',
      last_name: 'Costa',
      email: 'ana@example.com',
      password_hash: 'dev-only',
      photo_url: null,
    },
  ];

  const createdUsers = [];
  for (const u of users) {
    const createdUser = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
    createdUsers.push(createdUser);
  }

  console.log('✅ Review users created or updated');

  // Products to seed - REORDERED: Lenço de Linho is now first
  const productsData = [
    {
      title: 'Lenço de Linho Tecida à Mão',
      storytelling: 'Tecida à mão no norte de Portugal em teares tradicionais; respirável, durável e tingida naturalmente.',
      description: 'Lenço leve de linho com textura subtil e tintas naturais. Perfeito para usar em camadas durante todo o ano.',
      price: 39.5,
      avg_score: 4.6,
      specifications: [
        {
          title: 'Características principais',
          description: 'Origem: Minho, Portugal\nMaterial: Linho 100% natural\nTecelagem: Tecido à mão em tear tradicional\nTingimento: Tingimento natural com plantas\nDimensões: 180 x 70 cm\nCertificação: Artesanato Tradicional Português',
        },
        {
          title: 'Notas de prova',
          description: 'Textura macia e respirável com variações naturais na trama que refletem o trabalho artesanal. Cores suaves obtidas através de tingimento com plantas locais.',
        },
        {
          title: 'Sugestões de utilização',
          description: 'Ideal para usar em qualquer estação do ano, combina perfeitamente com looks casuais e elegantes. Pode ser usado como lenço, xaile ou até mesmo como toalha de mesa decorativa.',
        },
        {
          title: 'Benefícios',
          description: '• Fibra natural respirável e hipoalergénica\n• Tingimento natural sem químicos\n• Peça única feita à mão\n• Produção sustentável e local\n• Melhora com o uso e lavagens',
        },
        {
          title: 'Apresentação',
          description: 'Dobrado cuidadosamente e embalado em papel kraft com etiqueta artesanal que conta a história do artesão e da técnica tradicional utilizada.',
        },
      ],
      photos: [
        { photo_url: '/linen-scarf.jpg', alt_text: 'Lenço de linho artesanal pendurado', is_main: true },
      ],
    },
    {
      title: 'Carteira de Cortiça Artesanal',
      storytelling: 'Uma carteira fabricada em cortiça sustentável, produzida em Portugal.',
      description: 'Carteira durável, elegante e ecológica.',
      price: 29.99,
      avg_score: 4.2,
      specifications: [
        {
          title: 'Características principais',
          description: 'Origem: Alentejo, Portugal\nMaterial: Cortiça 100% natural\nProdução: Artesanal\nDimensões: 11 x 9 x 2 cm\nCertificação: Produto Sustentável',
        },
        {
          title: 'Notas de textura',
          description: 'Textura suave e macia ao toque, com acabamento natural que valoriza a beleza única da cortiça.',
        },
        {
          title: 'Sugestões de utilização',
          description: 'Ideal para uso diário, resistente à água e de fácil manutenção. Perfeita para quem valoriza produtos ecológicos e minimalistas.',
        },
        {
          title: 'Benefícios',
          description: '• Material 100% sustentável e renovável\n• Impermeável e resistente ao desgaste\n• Leve e durável\n• Hipoalergénica e vegana',
        },
        {
          title: 'Apresentação',
          description: 'Embalada em caixa de cartão reciclado com informações sobre a origem e processo de produção.',
        },
      ],
      photos: [
        { photo_url: '/cork-wallet.jpg', alt_text: 'Frente da carteira de cortiça', is_main: true },
      ],
    },
    {
      title: 'Caneca de Cerâmica com Azulejos',
      storytelling: 'Inspirada nos tradicionais azulejos portugueses.',
      description: 'Caneca de cerâmica com padrões de azulejos azuis.',
      price: 19.99,
      avg_score: 3.8,
      specifications: [
        {
          title: 'Características principais',
          description: 'Origem: Porto, Portugal\nMaterial: Cerâmica artesanal\nPadrão: Azulejos portugueses tradicionais\nCapacidade: 350 ml\nAcabamento: Vidrado à mão',
        },
        {
          title: 'Notas de design',
          description: 'Peça única com tons azuis vibrantes e desenhos geométricos tradicionais, cada caneca tem pequenas variações que a tornam especial.',
        },
        {
          title: 'Sugestões de utilização',
          description: 'Perfeita para café, chá ou chocolate quente. Pode ser utilizada no micro-ondas e lava-louças.',
        },
        {
          title: 'Benefícios',
          description: '• Peça artesanal única\n• Resistente ao calor\n• Fácil manutenção\n• Design atemporal',
        },
        {
          title: 'Apresentação',
          description: 'Embalada individualmente em caixa decorativa, ideal para presente.',
        },
      ],
      photos: [
        { photo_url: '/azulejo-mug.jpg', alt_text: 'Frente da caneca com azulejos', is_main: true },
      ],
    },
  ];

  let firstProduct;
  for (const p of productsData) {
    // Check if the product already exists by title
    const existing = await prisma.product.findFirst({
      where: { title: p.title },
    });

    let product;
    if (existing) {
      product = await prisma.product.update({
        where: { id: existing.id },
        data: {
          storytelling: p.storytelling,
          description: p.description,
          price: p.price,
          avg_score: p.avg_score ?? 0,
          specifications: p.specifications,
          updated_at: new Date(),
        },
      });
      console.log(`🔁 Updated product: ${p.title}`);
    } else {
      product = await prisma.product.create({
        data: {
          title: p.title,
          storytelling: p.storytelling,
          description: p.description,
          price: p.price,
          avg_score: p.avg_score ?? 0,
          specifications: p.specifications,
          created_by_user_id: user.id,
          updated_at: new Date(),
          photos: {
            create: p.photos,
          },
        },
      });
      console.log(`🆕 Created product: ${p.title}`);
    }

    if (!firstProduct) {
      firstProduct = product;
    }
  }

  // Create reviews for the first product
  if (firstProduct) {
    // more reviews for the first product
    const reviewsData = [
      { score: 1, comment: 'Comprei 200 litros', like_count: 12, dislike_count: 2, user_index: 0, created_at: new Date('2025-10-09') },
      { score: 5, comment: 'Vou comprar mais amanhã', like_count: 8, dislike_count: 1, user_index: 1, created_at: new Date('2025-10-03') },
      { score: 4, comment: 'Produto de excelente qualidade!', like_count: 15, dislike_count: 0, user_index: 2, created_at: new Date('2025-09-28') },
      { score: 5, comment: 'Adorei! Muito prático e sustentável. Recomendo a todos.', like_count: 20, dislike_count: 1, user_index: 3, created_at: new Date('2025-09-15') },
      { score: 3, comment: 'Bom produto.', like_count: 5, dislike_count: 3, user_index: 4, created_at: new Date('2025-09-10') },
      // adicionais
      { score: 4, comment: 'Entrega rápida e embalagem cuidada.', like_count: 6, dislike_count: 0, user_index: 1, created_at: new Date('2025-08-30') },
      { score: 5, comment: 'Excelente acabamento, recomendo.', like_count: 9, dislike_count: 0, user_index: 2, created_at: new Date('2025-08-20') },
      { score: 2, comment: 'Material diferente do esperado.', like_count: 1, dislike_count: 4, user_index: 0, created_at: new Date('2025-07-11') },
    ];

    // remove existing reviews for this product and insert fresh set
    await prisma.review.deleteMany({ where: { product_id: firstProduct.id } });
    for (const r of reviewsData) {
      await prisma.review.create({
        data: {
          score: r.score,
          comment: r.comment,
          like_count: r.like_count,
          dislike_count: r.dislike_count,
          user_id: createdUsers[r.user_index % createdUsers.length].id,
          product_id: firstProduct.id,
          created_at: r.created_at,
        },
      });
    }

    console.log('✅ Reviews created for the first product');

    // Optionally add reviews for the other seeded products (by title)
    const otherTitles = ['Carteira de Cortiça Artesanal', 'Caneca de Cerâmica com Azulejos'];
    for (const title of otherTitles) {
      const prod = await prisma.product.findFirst({ where: { title } });
      if (!prod) continue;

      // simple example reviews for each other product
      const extra = [
        { score: 5, comment: 'Óptimo produto, adorei.', user_index: 2, created_at: new Date('2025-08-01') },
        { score: 4, comment: 'Muito bom para o preço.', user_index: 4, created_at: new Date('2025-07-20') },
      ];

      // delete existing and create
      await prisma.review.deleteMany({ where: { product_id: prod.id } });
      for (const e of extra) {
        await prisma.review.create({
          data: {
            score: e.score,
            comment: e.comment,
            like_count: 0,
            dislike_count: 0,
            user_id: createdUsers[e.user_index % createdUsers.length].id,
            product_id: prod.id,
            created_at: e.created_at,
          },
        });
      }
      console.log(`✅ Reviews created for product: ${title}`);
    }
  }

  console.log('🌱 Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });