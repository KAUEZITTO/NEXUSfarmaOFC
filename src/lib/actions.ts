
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, doc, query, where, getDoc, writeBatch, documentId, Timestamp } from 'firebase/firestore';
import type { Product, Unit, Patient, PatientStatus, Order, Dispensation, OrderItem, DispensationItem } from './types';
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

export async function getUnit(unitId: string): Promise<Unit | null> {
    if (!unitId) return null;
    const unitRef = doc(db, 'units', unitId);
    const unitSnap = await getDoc(unitRef);
    if (!unitSnap.exists()) return null;
    return { id: unitSnap.id, ...unitSnap.data() } as Unit;
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
    const q = query(patientsCol, where('status', '==', 'Ativo'));
    const patientSnapshot = await getDocs(q);
    const patientList = patientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
    return patientList;
}

export async function getAllPatients(): Promise<Patient[]> {
    const patientsCol = collection(db, 'patients');
    const patientSnapshot = await getDocs(patientsCol);
    const patientList = patientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
    return patientList;
}


export async function getPatient(patientId: string): Promise<Patient | null> {
  if (!patientId) return null;
  const patientRef = doc(db, 'patients', patientId);
  const patientSnap = await getDoc(patientRef);
  if (!patientSnap.exists()) {
    return null;
  }
  return { id: patientSnap.id, ...patientSnap.data() } as Patient;
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


// FIRESTORE ACTIONS - ORDERS / REMESSAS

async function updateStock(items: (OrderItem[] | DispensationItem[])) {
    const batch = writeBatch(db);
    const productIds = items.map(item => item.productId);
    if (productIds.length === 0) return;

    const productsQuery = query(collection(db, 'products'), where(documentId(), 'in', productIds));
    const productSnapshots = await getDocs(productsQuery);

    const productUpdates = new Map<string, number>();

    productSnapshots.forEach(docSnap => {
        const product = { id: docSnap.id, ...docSnap.data() } as Product;
        const orderItem = items.find(item => item.productId === product.id);
        if (orderItem) {
            const newQuantity = product.quantity - orderItem.quantity;
            if (newQuantity < 0) {
                throw new Error(`Estoque insuficiente para o produto ${product.name}`);
            }
            productUpdates.set(product.id, newQuantity);
        }
    });

    for (const [productId, newQuantity] of productUpdates.entries()) {
        const productRef = doc(db, 'products', productId);
        const newStatus = newQuantity > 0 ? (newQuantity < 20 ? 'Baixo Estoque' : 'Em Estoque') : 'Sem Estoque';
        batch.update(productRef, { quantity: newQuantity, status: newStatus });
    }

    await batch.commit();
}


export async function addOrder(orderData: Omit<Order, 'id' | 'status' | 'sentDate' | 'itemCount'>): Promise<Order> {
  // 1. Update product quantities first (this will throw if not enough stock)
  await updateStock(orderData.items);

  // 2. Create the new order
  const newOrderRef = doc(collection(db, 'orders'));
  const newOrder: Order = {
    ...orderData,
    id: newOrderRef.id,
    sentDate: new Date().toISOString(),
    status: 'Em Trânsito',
    itemCount: orderData.items.reduce((sum, item) => sum + item.quantity, 0),
  };
  await addDoc(collection(db, 'orders'), newOrder);

  // 3. Revalidate paths
  revalidatePath('/dashboard/orders');
  revalidatePath('/dashboard/inventory');
  
  return newOrder;
}

export async function getOrdersForUnit(unitId: string): Promise<Order[]> {
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, where('unitId', '==', unitId));
    const orderSnapshot = await getDocs(q);
    const orderList = orderSnapshot.docs.map(doc => doc.data() as Order);
    return orderList.sort((a, b) => new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime());
}

export async function getOrder(orderId: string): Promise<Order | null> {
    if (!orderId) return null;
    const q = query(collection(db, "orders"), where("id", "==", orderId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    return querySnapshot.docs[0].data() as Order;
}


// FIRESTORE ACTIONS - DISPENSATIONS

export async function addDispensation(dispensationData: Omit<Dispensation, 'id' | 'date'>): Promise<Dispensation> {
    
    // 1. Update product stock
    await updateStock(dispensationData.items);

    // 2. Create dispensation record
    const newDispensationRef = doc(collection(db, 'dispensations'));
    const newDispensation: Dispensation = {
        ...dispensationData,
        id: newDispensationRef.id,
        date: new Date().toISOString(),
    };
    await addDoc(collection(db, 'dispensations'), newDispensation);

    // 3. Revalidate paths
    revalidatePath(`/dashboard/patients/${dispensationData.patientId}`);
    revalidatePath('/dashboard/inventory');

    return newDispensation;
}

export async function getDispensationsForPatient(patientId: string): Promise<Dispensation[]> {
    const dispensationsCol = collection(db, 'dispensations');
    const q = query(dispensationsCol, where('patientId', '==', patientId));
    const dispensationSnapshot = await getDocs(q);
    const dispensationList = dispensationSnapshot.docs.map(doc => doc.data() as Dispensation);
    return dispensationList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getDispensation(dispensationId: string): Promise<Dispensation | null> {
    if (!dispensationId) return null;
    const q = query(collection(db, "dispensations"), where("id", "==", dispensationId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    return querySnapshot.docs[0].data() as Dispensation;
}
