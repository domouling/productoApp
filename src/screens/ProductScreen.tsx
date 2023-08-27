/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useEffect, useState } from 'react';
import { Button, Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { StackScreenProps } from '@react-navigation/stack';

import {Picker} from '@react-native-picker/picker';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

import { ProductsStackParams } from '../navigation/ProductsNavigator';
import { useCategories } from '../hooks/useCategories';
import { useForm } from '../hooks/useForm';
import { ProductsContext } from '../context/ProductsContext';

interface Props extends StackScreenProps<ProductsStackParams,'ProductScreen'>{}

export const ProductScreen = ({ navigation, route }: Props) => {

    const { id = '', name = '' } = route.params;

    const [ tempUri, setTempUri ] = useState<string>();

    const { categories } = useCategories();

    const { loadProductById, addProduct, updateProduct, uploadImage } = useContext(ProductsContext);

    const { _id, categoriaId, nombre, img, onChange, setFormValue } = useForm({
        _id: id,
        categoriaId: '',
        nombre: name,
        img: '',
    });

    useEffect(() => {
        navigation.setOptions({
            title: ( nombre ) ? nombre : 'Sin nombre del producto',
        });
    }, [ nombre ]);

    useEffect(() => {
        loadProduct();
    }, []);

    const loadProduct = async() => {
        if ( id.length === 0 ) { return; }
        const product = await loadProductById( id );
        setFormValue({
            _id: id,
            categoriaId: product.categoria._id,
            img: product.img || '',
            nombre: product.nombre,
        });
    };

    const saveOrUpdate = async() => {
        if ( id.length > 0) {
            updateProduct( categoriaId, nombre, id );
        } else {
            const tempCategoriaId = categoriaId || categories[0]._id;
            const newProduct = await addProduct( tempCategoriaId, nombre );
            onChange( newProduct._id, '_id' );
        }
    };

    const takePhoto = () => {
        launchCamera({
            cameraType: 'back',
            mediaType: 'photo',
            quality: 0.5,
        }, (resp) => {
            if ( resp.didCancel ) { return; }
            if ( !resp.assets![0].uri ) { return; }
            setTempUri( resp.assets![0].uri );
            uploadImage( resp, _id );
        });
    };


    const takePhotoFromGallery = () => {
        launchImageLibrary({
            mediaType: 'photo',
            quality: 0.5,
        }, (resp) => {
            if ( resp.didCancel ) { return; }
            if ( !resp.assets![0].uri ) { return; }
            setTempUri( resp.assets![0].uri );
            uploadImage( resp, _id );
        });
    };

    return (
        <View style={ styles.container }>
            <ScrollView>
                <Text style={ styles.label }>Nombre del Producto:</Text>
                <TextInput
                    placeholder="Producto"
                    style={ styles.textInput }
                    value={ nombre }
                    onChangeText={ (value) => onChange(value,'nombre') }
                />

                {/* Selector o Picker */}
                <Text style={ styles.label }>Categoría:</Text>
                <Picker
                    selectedValue={ categoriaId }
                    onValueChange={(value) => onChange( value, 'categoriaId' )}
                >
                        {
                            categories.map( c => (
                                <Picker.Item
                                    key={ c._id }
                                    label={ c.nombre }
                                    value={ c._id }
                                />
                            ))
                        }
                </Picker>

                <Button
                    title="Guardar"
                    onPress={ saveOrUpdate }
                    color="#5856D6"
                />

                <View  style={{ height: 10 }}/>

                {
                    (_id.length > 0) && (
                        <Button
                            title="Eliminar"
                            onPress={ () => console.log('borrar') }
                            color="#5856D6"
                        />
                    )
                }


                {
                    ( _id.length > 0 ) && (
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'center',
                            marginTop: 10,
                        }}>
                            <Button
                                title="Cámara"
                                onPress={ takePhoto }
                                color="#5856D6"
                            />

                            <View style={{ width: 10 }} />

                            <Button
                                title="Galería"
                                onPress={ takePhotoFromGallery }
                                color="#5856D6"
                            />
                        </View>
                    )
                }


                {
                    (img.length > 0 && !tempUri) && (
                        <Image
                            source={{ uri: img }}
                            style={{
                                width: '100%',
                                height: 350,
                                marginTop: 20,
                                borderRadius: 20,
                            }}
                        />
                    )
                }

                {/* Mostrar Imagen temporal */}
                {
                    (tempUri) && (
                        <Image
                            source={{ uri: tempUri }}
                            style={{
                                width: '100%',
                                height: 350,
                                marginTop: 20,
                                borderRadius: 20,
                            }}
                        />
                    )
                }

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 10,
        marginHorizontal: 20,
    },
    label: {
        fontWeight: 'bold',
        fontSize: 18,
    },
    textInput: {
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        borderColor: 'rgba(0,0,0,0.2)',
        height: 45,
        marginTop: 5,
        marginBottom: 15,
        fontSize: 18,
    },
});
