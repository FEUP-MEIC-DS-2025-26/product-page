
    export type RemoteKeys = 'mips_product_page_provider/ProductPage';
    type PackageType<T> = T extends 'mips_product_page_provider/ProductPage' ? typeof import('mips_product_page_provider/ProductPage') :any;