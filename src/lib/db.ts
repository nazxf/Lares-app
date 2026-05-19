export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'cashier';
  storeId?: string;
  createdAt: number;
}

export interface LocalUser {
  uid: string;
  email: string;
  displayName: string;
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    let message = 'Terjadi kesalahan';
    try {
      const error = await response.json();
      message = error.message || message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

function toLocalUser(profile: UserProfile): LocalUser {
  return {
    uid: profile.id,
    email: profile.email,
    displayName: profile.name,
  };
}

export async function loginWithSql(email: string, name: string) {
  const profile = await apiRequest<UserProfile>('/api/auth/login', {
    method: 'POST',
    body: { email, name },
  });

  return {
    currentUser: toLocalUser(profile),
    profile,
  };
}

export async function fetchUserProfile(userId: string) {
  const profile = await apiRequest<UserProfile>(`/api/users/${encodeURIComponent(userId)}`);

  return {
    currentUser: toLocalUser(profile),
    profile,
  };
}

export async function updateUserProfile(userId: string, profileUpdate: Partial<UserProfile>) {
  const profile = await apiRequest<UserProfile>(`/api/users/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    body: profileUpdate,
  });

  return {
    currentUser: toLocalUser(profile),
    profile,
  };
}

export async function createStore(name: string, ownerId: string) {
  return apiRequest<{ id: string; name: string; ownerId: string; createdAt: number }>('/api/stores', {
    method: 'POST',
    body: { name, ownerId },
  });
}

export async function fetchStoreProducts(storeId: string) {
  return apiRequest<any[]>(`/api/stores/${encodeURIComponent(storeId)}/products`);
}

export async function fetchStoreTransactions(storeId: string, limit = 50) {
  return apiRequest<any[]>(`/api/stores/${encodeURIComponent(storeId)}/transactions?limit=${limit}`);
}

export async function fetchStockMovements(storeId: string, limit = 100) {
  return apiRequest<any[]>(`/api/stores/${encodeURIComponent(storeId)}/stock-movements?limit=${limit}`);
}

export async function addProduct(storeId: string, productData: any) {
  const result = await apiRequest<{ id: string }>(`/api/stores/${encodeURIComponent(storeId)}/products`, {
    method: 'POST',
    body: productData,
  });

  return result.id;
}

export async function updateProduct(storeId: string, productId: string, productData: any) {
  await apiRequest<void>(
    `/api/stores/${encodeURIComponent(storeId)}/products/${encodeURIComponent(productId)}`,
    {
      method: 'PATCH',
      body: productData,
    }
  );
}

export async function processSaleOrStockIn(
  storeId: string,
  cashierId: string,
  type: 'sale' | 'stock_in',
  items: any[],
  totalAmount: number,
  notes = ''
) {
  const result = await apiRequest<{ id: string }>(
    `/api/stores/${encodeURIComponent(storeId)}/transactions/process`,
    {
      method: 'POST',
      body: {
        cashierId,
        type,
        items,
        totalAmount,
        notes,
      },
    }
  );

  return result.id;
}
