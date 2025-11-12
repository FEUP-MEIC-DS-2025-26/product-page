
    export type RemoteKeys = 'mips_shopping_cart_provider/ShoppingCartPage';
    type PackageType<T> = T extends 'mips_shopping_cart_provider/ShoppingCartPage' ? typeof import('mips_shopping_cart_provider/ShoppingCartPage') :any;