import React, { createContext, useEffect, useReducer } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { ErrorLogin, LoginData, LoginResponse, RegisterData, Usuario } from '../interfaces/appInterfaces';
import { AuthState, authReducer } from './authReducer';
import cafeApi from '../api/cafeApi';
import { AxiosError } from 'axios';

type AuthContextProps = {
    errorMessage: string;
    token: string | null;
    user: Usuario | null;
    status: 'checking' | 'authenticated' | 'not-authenticated';
    signUp: ( RegisterData:RegisterData ) => void;
    signIn: ( LoginData:LoginData ) => void;
    logOut: () => void;
    removeError: () => void;
}

const authInitialState: AuthState = {
    status: 'checking',
    token: null,
    user: null,
    errorMessage: '',
};


export const AuthContext = createContext({} as AuthContextProps);


export const AuthProvider = ({ children }: any) => {

    const [ state, dispatch ] = useReducer( authReducer, authInitialState );


    useEffect(() => {
        checkToken();
    }, []);


    //TODO: as Helper
    const checkToken = async() => {
        const token = await AsyncStorage.getItem('token');

        //No token, no autenticado
        if ( !token ){
            return dispatch({ type: 'notAuthenticated' });
        }

        // Hay token
        const resp = await cafeApi.get('/auth');
        if ( resp.status !== 200 ) {
            return dispatch({ type: 'notAuthenticated' });
        }

        await AsyncStorage.setItem('token', resp.data.token);

        dispatch({
            type: 'signUp',
            payload: {
                token: resp.data.token,
                user: resp.data.usuario,
            },
        });

    };


    const signIn = async( { correo, password }: LoginData ) => {
        try {
            const { data } = await cafeApi.post<LoginResponse>('/auth/login', { correo, password } );
            dispatch({
                type: 'signUp',
                payload: {
                    token: data.token,
                    user: data.usuario,
                },
            });

            await AsyncStorage.setItem('token', data.token);


        } catch (err) {
            const  error = err as AxiosError<ErrorLogin>;
            //console.log(error.response.data.msg);
            //console.log(error);
            dispatch({
                type: 'addError',
                payload: error.response?.data.msg || 'Información Incorrecta',
            });
        }
    };


    const signUp = async ( { nombre, correo, password }: RegisterData ) => {
        try {
            const { data } = await cafeApi.post<LoginResponse>('/usuarios', { nombre, correo, password } );
            dispatch({
                type: 'signUp',
                payload: {
                    token: data.token,
                    user: data.usuario,
                },
            });

            await AsyncStorage.setItem('token', data.token);

        } catch (error: AxiosError | any) {
            const err = error as AxiosError;
            console.log(err.response!.data);
            dispatch({
                type: 'addError',
                payload: error.response.data.errors[0].msg || 'Revise los datos ingresados',
            });
        }
    };

    const logOut = async() => {
        await AsyncStorage.removeItem('token');
        dispatch({ type: 'logout' });
    };

    const removeError = () => {
        dispatch({
            type: 'removeError',
        });
    };

    return (
        <AuthContext.Provider value={{
            ...state,
            signUp,
            signIn,
            logOut,
            removeError,
        }}>
            { children }
        </AuthContext.Provider>
    );

};
