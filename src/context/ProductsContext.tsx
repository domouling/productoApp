import React, { createContext, useEffect, useState } from 'react';
import { ImagePickerResponse } from 'react-native-image-picker';
import { Producto, ProductsResponse } from '../interfaces/appInterfaces';
import cafeApi from '../api/cafeApi';

type ProductsContextProps = {
    products: Producto[];
    loadProducts: () => Promise<void>;
    addProduct: ( categoryId: string, productName: string ) => Promise<Producto>;
    updateProduct: ( categoryId: string, productName: string, productId: string ) => Promise<void>;
    deleteProduct: ( productId: string ) => Promise<void>;
    loadProductById: ( productId: string ) => Promise<Producto>;
    uploadImage: ( data: any, productId: string ) => Promise<void>; //TODO: cambiar any
};


export const ProductsContext = createContext({} as ProductsContextProps);

export const ProductsProvider = ({ children }: any) => {

    const [ products, setProducts ] = useState<Producto[]>([]);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async (): Promise<void> => {
        const resp = await cafeApi.get<ProductsResponse>('/productos?limite=50');
        //setProducts([ ...products, ...resp.data.productos ]);
        setProducts([ ...resp.data.productos ]);
    };

    const addProduct = async ( categoryId: string, productName: string ): Promise<Producto> => {
        const resp = await cafeApi.post<Producto>('/productos',{
            nombre: productName,
            categoria: categoryId,
        });
        setProducts([ ...products, resp.data ]);

        return resp.data;
    };

    const updateProduct = async ( categoryId: string, productName: string, productId: string ) => {
        const resp = await cafeApi.put<Producto>(`/productos/${ productId }`,{
            nombre: productName,
            categoria: categoryId,
        });
        setProducts( products.map( prod => {
            return ( prod._id === productId ) ? resp.data : prod;
        }));
    };

    const deleteProduct = async ( productId: string ) => {
        await cafeApi.delete(`/productos/${ productId }`);
        setProducts( products.filter( prod => prod._id !== productId ));
    };

    const loadProductById = async ( productId: string ): Promise<Producto> => {
        const resp = await cafeApi.get<Producto>(`/productos/${ productId }`);
        return resp.data;
    };

    const uploadImage = async ( data: ImagePickerResponse, productId: string ) => {
        const fileToUpload = {
            uri: data.assets![0].uri,
            type: data.assets![0].type,
            name: data.assets![0].fileName,
        };

        const formData = new FormData();
        formData.append('archivo', fileToUpload);

        try {
            await cafeApi.put(`/uploads/productos/${ productId }`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                transformRequest: () => {
                    return formData;
                },
            });
            //console.log(resp);
        } catch (error) {
            console.log({ error });
        }
    };



    return (
        <ProductsContext.Provider value={{
            products,
            loadProducts,
            addProduct,
            updateProduct,
            deleteProduct,
            loadProductById,
            uploadImage,
        }}>
            { children }
        </ProductsContext.Provider>
    );
};
