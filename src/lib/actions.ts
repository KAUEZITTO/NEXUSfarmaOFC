
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, doc, query, where } from 'firebase/firestore';
import type { Product, Unit, Patient, PatientStatus } from './types';
import { revalidatePath } from 'next/cache';

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
    revalidatePath('/dashboard/inventory');
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
    revalidatePath('/dashboard/inventory');
}

// FIRESTORE ACTIONS - UNITS

export async function getUnits(): Promise<Unit[]> {
    const unitsCol = collection(db, 'units');
    const unitSnapshot = await getDocs(unitsCol);
    const unitList = unitSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Unit));
    return unitList;
}

export async function addUnit(unit: Omit<Unit, 'id'>) {
    await addDoc(collection(db, 'units'), unit);
    revalidatePath('/dashboard/units');
    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard/orders/new');
    revalidatePath('/dashboard/patients');
}

export async function updateUnit(unitId: string, unitData: Partial<Unit>) {
    if (!unitId) {
        throw new Error("Unit ID is required for updating.");
    }
    const unitRef = doc(db, 'units', unitId);
    await updateDoc(unitRef, unitData);
    revalidatePath('/dashboard/units');
    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard/orders/new');
    revalidatePath('/dashboard/patients');
}

// FIRESTORE ACTIONS - PATIENTS

export async function getPatients(): Promise<Patient[]> {
    const patientsCol = collection(db, 'patients');
    const patientSnapshot = await getDocs(patientsCol);
    const patientList = patientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
    return patientList;
}

export async function addPatient(patient: Omit<Patient, 'id'>) {
    // Add a default status if it's not provided
    const patientWithStatus = {
        status: 'Ativo' as PatientStatus,
        ...patient,
    }
    await addDoc(collection(db, 'patients'), patientWithStatus);
    revalidatePath('/dashboard/patients');
}

export async function updatePatient(patientId: string, patientData: Partial<Patient>) {
    if (!patientId) {
        throw new Error("Patient ID is required for updating.");
    }
    const patientRef = doc(db, 'patients', patientId);
    await updateDoc(patientRef, patientData);
    revalidatePath('/dashboard/patients');
    revalidatePath(`/dashboard/patients/${patientId}`);
}

export async function updatePatientStatus(patientId: string, status: PatientStatus) {
  if (!patientId) {
    throw new Error("Patient ID is required for updating status.");
  }
  const patientRef = doc(db, 'patients', patientId);
  await updateDoc(patientRef, { status });
  revalidatePath('/dashboard/patients');
}
