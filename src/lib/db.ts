import { collection, query, getDocs, doc, setDoc, Timestamp, orderBy, limit, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

export async function fetchStoreProducts(storeId: string) {
  const q = query(
    collection(db, `stores/${storeId}/products`),
    orderBy('name', 'asc')
  );
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("fetchStoreProducts Error", error);
    throw error;
  }
}

export async function fetchStoreTransactions(storeId: string) {
  const q = query(
    collection(db, `stores/${storeId}/transactions`),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("fetchStoreTransactions Error", error);
    throw error;
  }
}

export async function addProduct(storeId: string, productData: any) {
  const productId = `prod-${Date.now()}`;
  const now = Date.now();
  await setDoc(doc(db, `stores/${storeId}/products`, productId), {
    ...productData,
    createdAt: now,
    updatedAt: now
  });
  return productId;
}

export async function updateProduct(storeId: string, productId: string, productData: any) {
  const now = Date.now();
  await setDoc(doc(db, `stores/${storeId}/products`, productId), {
    ...productData,
    updatedAt: now
  }, { merge: true });
}

export async function recordTransaction(
  storeId: string, 
  cashierId: string, 
  type: 'sale' | 'stock_in', 
  items: any[], 
  totalAmount: number,
  notes: string = ''
) {
  const transactionId = `txn-${Date.now()}`;
  const now = Date.now();
  
  const batch = writeBatch(db);

  // 1. Create Transaction
  const txnRef = doc(db, `stores/${storeId}/transactions`, transactionId);
  batch.set(txnRef, {
    type,
    items,
    totalAmount,
    cashierId,
    notes,
    createdAt: now
  });

  // 2. Map items and perform stock updates & movements
  for (const item of items) {
    const movementId = `mov-${Date.now()}-${item.productId}`;
    const movRef = doc(db, `stores/${storeId}/stock_movements`, movementId);
    
    batch.set(movRef, {
      productId: item.productId,
      type,
      quantity: item.quantity,
      notes: type === 'sale' ? `Penjualan: ${notes}` : `Stock in: ${notes}`,
      createdAt: now
    });

    // Update product stock (note: ideally we read current stock and update, 
    // but in a batch, Firestore doesn't provide a way to read then write seamlessly without a full transaction.
    // However, since we just query before UI, we will apply the delta here via an update.)
    // Wait, let's use client-side computed updated-stock passed to this function, or do a transaction.
    // To keep rules simple and avoid transaction complexities for now, we will expect caller to provide NEW stock value
  }

  await batch.commit();
  return transactionId;
}

// Transaction function that increments/decrements safely
import { runTransaction } from 'firebase/firestore';

export async function processSaleOrStockIn(
  storeId: string,
  cashierId: string,
  type: 'sale' | 'stock_in',
  items: any[], // { productId, productName, quantity, price, subtotal }
  totalAmount: number,
  notes: string = ''
) {
  const transactionId = `txn-${Date.now()}`;
  const now = Date.now();

  await runTransaction(db, async (t) => {
    // Phase 1: Reads
    const productRefsAndData = await Promise.all(
      items.map(async (item) => {
        const ref = doc(db, `stores/${storeId}/products`, item.productId);
        const docSnap = await t.get(ref);
        if (!docSnap.exists()) throw new Error("Product not found");
        return { ref, data: docSnap.data(), item };
      })
    );

    // Phase 2: Logic checks
    if (type === 'sale') {
      for (const p of productRefsAndData) {
        if (p.data.stock < p.item.quantity) {
          throw new Error(`Stok tidak mencukupi untuk: ${p.data.name}`);
        }
      }
    }

    // Phase 3: Writes
    // Create transaction
    const txnRef = doc(db, `stores/${storeId}/transactions`, transactionId);
    t.set(txnRef, {
      type,
      items,
      totalAmount,
      cashierId,
      notes,
      createdAt: now
    });

    for (const p of productRefsAndData) {
      // Stock movement
      const movementId = `mov-${Date.now()}-${p.item.productId}-${Math.floor(Math.random()*1000)}`;
      const movRef = doc(db, `stores/${storeId}/stock_movements`, movementId);
      t.set(movRef, {
        productId: p.item.productId,
        type,
        quantity: p.item.quantity,
        notes: notes || (type === 'sale' ? 'Penjualan kasir' : 'Barang masuk'),
        createdAt: now
      });

      // Stock update
      const newStock = type === 'sale' 
        ? p.data.stock - p.item.quantity 
        : p.data.stock + p.item.quantity;
      
      t.update(p.ref, {
        stock: newStock,
        updatedAt: now
      });
    }
  });

  return transactionId;
}

