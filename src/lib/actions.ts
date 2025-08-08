
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, doc, query, where, getDoc, writeBatch, documentId, Timestamp, orderBy, CollectionReference, Query } from 'firebase/firestore';
import type { Product, Unit, Patient, PatientStatus, Order, Dispensation, OrderItem, DispensationItem, StockMovement, PatientFilter } from './types';
import { revalidatePath } from 'next/cache';
import { adminAuth } from './firebase-admin';

// ACTIVITY LOGGING
type ActivityLog = {
    user: string; // User's email or ID
    action: string;
    details: string;
    timestamp: Date;
}

async function getCurrentUser() {
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) return null;

    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        return {
            email: decodedToken.email || 'N/A',
            uid: decodedToken.uid,
        }
    } catch (error) {
        console.error("Error verifying session cookie:", error);
        return null;
    }
}

async function logActivity(action: string, details: string) {
    try {
        const user = await getCurrentUser();
        const logEntry: ActivityLog = {
            user: user?.email || 'Sistema',
            action,
            details,
            timestamp: new Date(),
        };
        await addDoc(collection(db, 'logs'), logEntry);
    } catch (error) {
        console.error("Failed to log activity:", error);
        // We don't throw an error here because logging should not block the main operation.
    }
}


// AUTH ACTIONS
export async function createSessionCookie(token: string) {
    const sevenDaysInSeconds = 60 * 60 * 24 * 7;
    cookies().set('session', token, { httpOnly: true, path: '/', maxAge: sevenDaysInSeconds });
    // We can't get user info here yet, so log it as a system action or on the client.
    // For simplicity, we'll log it as a general login event.
    await logActivity('Login', `Usuário fez login.`);
    redirect('/dashboard');
}

export async function logout() {
  const user = await getCurrentUser();
  await logActivity('Logout', `Usuário ${user?.email || 'desconhecido'} saiu.`);
  cookies().delete('session');
  redirect('/');
}

// STOCK MOVEMENT LOGGING
async function logStockMovement(
    productId: string,
    productName: string,
    type: StockMovement['type'],
    reason: StockMovement['reason'],
    quantityChange: number,
    quantityBefore: number,
    relatedId?: string
) {
    const user = await getCurrentUser();
    const movementRef = doc(collection(db, 'stockMovements'));
    const movement: StockMovement = {
        id: movementRef.id,
        productId,
        productName,
        type,
        reason,
        quantityChange,
        quantityBefore,
        quantityAfter: quantityBefore + quantityChange, // quantityChange is negative for 'Saída'
        date: new Date().toISOString(),
        relatedId: relatedId || '',
        user: user?.email || 'Sistema'
    };
    await addDoc(collection(db, 'stockMovements'), movement);
    await updateDoc(movementRef, { id: movementRef.id });
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
    const docRef = await addDoc(collection(db, 'products'), newProductData);

    // Log the initial stock movement
    await logStockMovement(docRef.id, product.name, 'Entrada', 'Entrada Inicial', product.quantity, 0);
    
    await logActivity('Produto Adicionado', `Novo produto "${product.name}" (ID: ${docRef.id}) foi adicionado com quantidade ${product.quantity}.`);
    revalidatePath('/dashboard/inventory');
}

export async function updateProduct(productId: string, productData: Partial<Product>) {
     if (!productId) {
        throw new Error("Product ID is required for updating.");
    }
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);
    if (!productSnap.exists()) {
        throw new Error(`Product with ID ${productId} not found.`);
    }
    const oldProductData = productSnap.data();
    const quantityBefore = oldProductData.quantity;


    const updatedData = { ...productData };

    if (productData.quantity !== undefined && productData.quantity !== quantityBefore) {
         updatedData.status = productData.quantity > 0 ? (productData.quantity < 20 ? 'Baixo Estoque' : 'Em Estoque') : 'Sem Estoque';
         const quantityChange = productData.quantity - quantityBefore;
         const type = quantityChange > 0 ? 'Entrada' : 'Saída';
         await logStockMovement(productId, productData.name || oldProductData.name, type, 'Ajuste de Inventário', quantityChange, quantityBefore);
    }

    await updateDoc(productRef, updatedData);
    await logActivity('Produto Atualizado', `Produto "${productData.name}" (ID: ${productId}) foi atualizado.`);
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
    const docRef = await addDoc(collection(db, 'units'), unit);
    await logActivity('Unidade Adicionada', `Nova unidade "${unit.name}" (ID: ${docRef.id}) foi adicionada.`);
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
    await logActivity('Unidade Atualizada', `Unidade "${unitData.name}" (ID: ${unitId}) foi atualizada.`);
    revalidatePath('/dashboard/units');
    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard/orders/new');
    revalidatePath('/dashboard/patients');
}

// FIRESTORE ACTIONS - PATIENTS
export async function getPatients(filter: PatientFilter = 'active'): Promise<Patient[]> {
    const patientsCol = collection(db, 'patients');
    let patientQuery: Query | CollectionReference = patientsCol;

    switch (filter) {
        case 'active':
            patientQuery = query(patientsCol, where('status', '==', 'Ativo'));
            break;
        case 'inactive':
            patientQuery = query(patientsCol, where('status', '!=', 'Ativo'));
            break;
        case 'insulin':
            patientQuery = query(patientsCol, where('isAnalogInsulinUser', '==', true), where('status', '==', 'Ativo'));
            break;
        case 'diapers':
            patientQuery = query(patientsCol, where('municipalItems', 'array-contains', 'Fraldas'), where('status', '==', 'Ativo'));
            break;
        case 'bedridden':
            patientQuery = query(patientsCol, where('isBedridden', '==', true), where('status', '==', 'Ativo'));
            break;
        case 'legal':
             patientQuery = query(patientsCol, where('mandateType', '==', 'Legal'), where('status', '==', 'Ativo'));
            break;
        case 'municipal':
             patientQuery = query(patientsCol, where('mandateType', '==', 'Municipal'), where('status', '==', 'Ativo'));
            break;
        case 'all':
        default:
            // No extra filter needed for 'all'
            break;
    }
    
    const patientSnapshot = await getDocs(patientQuery);
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
    const newPatientRef = await addDoc(collection(db, 'patients'), patientWithStatus);
    await updateDoc(newPatientRef, { id: newPatientRef.id });

    await logActivity('Paciente Adicionado', `Novo paciente "${patient.name}" (ID: ${newPatientRef.id}) foi cadastrado.`);
    revalidatePath('/dashboard/patients');
}

export async function updatePatient(patientId: string, patientData: Partial<Patient>) {
    if (!patientId) {
        throw new Error("Patient ID is required for updating.");
    }
    const patientRef = doc(db, 'patients', patientId);
    await updateDoc(patientRef, patientData);
    await logActivity('Paciente Atualizado', `Paciente "${patientData.name}" (ID: ${patientId}) foi atualizado.`);
    revalidatePath('/dashboard/patients');
    revalidatePath(`/dashboard/patients/${patientId}`);
}

export async function updatePatientStatus(patientId: string, status: PatientStatus) {
  if (!patientId) {
    throw new Error("Patient ID is required for updating status.");
  }
  const patientRef = doc(db, 'patients', patientId);
  const patientSnap = await getDoc(patientRef);
  const patientName = patientSnap.data()?.name || 'Desconhecido';
  await updateDoc(patientRef, { status });
  await logActivity('Status do Paciente Alterado', `Status do paciente "${patientName}" (ID: ${patientId}) foi alterado para "${status}".`);
  revalidatePath('/dashboard/patients');
}


// FIRESTORE ACTIONS - ORDERS / REMESSAS
async function processStockUpdate(items: (OrderItem[] | DispensationItem[]), reason: StockMovement['reason'], relatedId?: string) {
    const batch = writeBatch(db);
    const productIds = items.map(item => item.productId);
    if (productIds.length === 0) return;

    const productsRef = collection(db, 'products');
    const productsQuery = query(productsRef, where(documentId(), 'in', productIds));
    const productSnapshots = await getDocs(productsQuery);

    const productMap = new Map<string, Product>();
    productSnapshots.forEach(doc => {
        productMap.set(doc.id, { id: doc.id, ...doc.data() } as Product);
    });

    for (const item of items) {
        const product = productMap.get(item.productId);
        if (product) {
            const quantityBefore = product.quantity;
            const newQuantity = quantityBefore - item.quantity;
            if (newQuantity < 0) {
                throw new Error(`Estoque insuficiente para o produto ${product.name}. Apenas ${quantityBefore} disponíveis.`);
            }
            const productRef = doc(db, 'products', item.productId);
            const newStatus = newQuantity > 0 ? (newQuantity < 20 ? 'Baixo Estoque' : 'Em Estoque') : 'Sem Estoque';
            batch.update(productRef, { quantity: newQuantity, status: newStatus });
            
            // Log movement
            await logStockMovement(item.productId, item.name, 'Saída', reason, -item.quantity, quantityBefore, relatedId);

        } else {
            throw new Error(`Produto com ID ${item.productId} não encontrado.`);
        }
    }

    await batch.commit();
}


export async function addOrder(orderData: Omit<Order, 'id' | 'status' | 'sentDate' | 'itemCount'>): Promise<Order> {
  const newOrderRef = doc(collection(db, 'orders'));
  const newOrderId = newOrderRef.id;

  // 1. Update product quantities first and log movements
  await processStockUpdate(orderData.items, 'Saída por Remessa', newOrderId);

  // 2. Create the new order
  const newOrder: Order = {
    ...orderData,
    id: newOrderId,
    sentDate: new Date().toISOString(),
    status: 'Em Trânsito',
    itemCount: orderData.items.reduce((sum, item) => sum + item.quantity, 0),
  };
  
  await addDoc(collection(db, 'orders'), newOrder);
  await updateDoc(newOrderRef, { id: newOrderId });

  // 3. Log and Revalidate
  await logActivity('Remessa Criada', `Nova remessa (ID: ${newOrder.id}) com ${newOrder.itemCount} itens foi criada para a unidade "${newOrder.unitName}".`);
  revalidatePath('/dashboard/orders');
  revalidatePath('/dashboard/inventory');
  revalidatePath('/dashboard');
  
  return { ...newOrder, id: newOrderId };
}

export async function getOrdersForUnit(unitId: string): Promise<Order[]> {
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, where('unitId', '==', unitId));
    const orderSnapshot = await getDocs(q);
    const orderList = orderSnapshot.docs.map(doc => doc.data() as Order);
    // Sort in-memory after fetching
    orderList.sort((a, b) => new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime());
    return orderList;
}

export async function getOrders(): Promise<Order[]> {
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, orderBy('sentDate', 'desc'));
    const orderSnapshot = await getDocs(q);
    const orderList = orderSnapshot.docs.map(doc => doc.data() as Order);
    return orderList;
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
    const newDispensationRef = doc(collection(db, 'dispensations'));
    const newDispensationId = newDispensationRef.id;

    // 1. Update product stock and log movements
    await processStockUpdate(dispensationData.items, 'Saída por Dispensação', newDispensationId);

    // 2. Create dispensation record
    const newDispensation: Dispensation = {
        ...dispensationData,
        id: newDispensationId,
        date: new Date().toISOString(),
    };
    await addDoc(collection(db, 'dispensations'), newDispensation);
    await updateDoc(newDispensationRef, { id: newDispensationId });

    // 3. Log and Revalidate
    const totalItems = dispensationData.items.reduce((sum, item) => sum + item.quantity, 0);
    await logActivity('Dispensação Registrada', `Nova dispensação (ID: ${newDispensation.id}) com ${totalItems} itens foi registrada para o paciente "${dispensationData.patient.name}".`);
    revalidatePath(`/dashboard/patients/${dispensationData.patientId}`);
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard');

    return { ...newDispensation, id: newDispensationId };
}

export async function getDispensationsForPatient(patientId: string): Promise<Dispensation[]> {
    const dispensationsCol = collection(db, 'dispensations');
    const q = query(dispensationsCol, where('patientId', '==', patientId), orderBy('date', 'desc'));
    const dispensationSnapshot = await getDocs(q);
    const dispensationList = dispensationSnapshot.docs.map(doc => doc.data() as Dispensation);
    return dispensationList;
}

export async function getAllDispensations(): Promise<Dispensation[]> {
    const dispensationsCol = collection(db, 'dispensations');
    const q = query(dispensationsCol, orderBy('date', 'desc'));
    const dispensationSnapshot = await getDocs(q);
    const dispensationList = dispensationSnapshot.docs.map(doc => doc.data() as Dispensation);
    return dispensationList;
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

// FIRESTORE ACTIONS - REPORTS
export async function getStockMovements(): Promise<StockMovement[]> {
    const movementsCol = collection(db, 'stockMovements');
    const q = query(movementsCol, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    const movementList = snapshot.docs.map(doc => doc.data() as StockMovement);
    return movementList;
}
