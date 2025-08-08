'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, doc, query, where } from 'firebase/firestore';
import type { Product } from './types';

// AUTH ACTIONS
export async function createSessionCookie(token: string) {
    cookies().set('session', token, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 });
    redirect('/dashboard');
}

export async function logout() {
  cookies().delete('session');
  redirect('/');
}

// FIRESTORE ACTIONS - PRODUCTS

export async function getProducts(): Promise<Product[]> {
    const productsCol = collection(db, 'products');
    const productSnapshot = await getDocs(productsCol);
    const productList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    return productList;
}

export async function addProduct(product: Omit<Product, 'id' | 'status'>) {
    const newProductData = {
        ...product,
        status: product.quantity > 0 ? (product.quantity < 20 ? 'Baixo Estoque' : 'Em Estoque') : 'Sem Estoque',
    }
    await addDoc(collection(db, 'products'), newProductData);
}

export async function updateProduct(productId: string, productData: Partial<Product>) {
     if (!productId) {
        throw new Error("Product ID is required for updating.");
    }
    const productRef = doc(db, 'products', productId);

    const updatedData = { ...productData };

    if (productData.quantity !== undefined) {
         updatedData.status = productData.quantity > 0 ? (productData.quantity < 20 ? 'Baixo Estoque' : 'Em Estoque') : 'Sem Estoque';
    }

    await updateDoc(productRef, updatedData);
}
