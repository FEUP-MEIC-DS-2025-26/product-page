
    export type RemoteKeys = 'provider/ProductPage';
    type PackageType<T> = T extends 'provider/ProductPage' ? typeof import('provider/ProductPage') :any;