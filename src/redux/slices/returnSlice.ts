import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

interface ReturnState {
  returns: any[];
  currentReturn: any;
  pagination: {
    totalRecords: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: ReturnState = {
  returns: [],
  currentReturn: null,
  pagination: {
    totalRecords: 0,
    currentPage: 1,
    totalPages: 0,
    limit: 10,
  },
  loading: false,
  error: null,
};

export const fetchAllReturns = createAsyncThunk(
  'return/fetchAll',
  async ({ page, limit, search }: { page?: number; limit?: number; search?: string } = {}) => {
    const response = await api.get('/return', {
      params: { page, limit, search },
    });
    return response.data;
  }
);

export const fetchReturnById = createAsyncThunk('return/fetchById', async (id: string) => {
  const response = await api.get(`/return/${id}`);
  return response.data.data;
});

export const createReturn = createAsyncThunk('return/create', async (data: any) => {
  const response = await api.post('/return/create', data);
  return response.data.data;
});

export const updateReturn = createAsyncThunk('return/update', async ({ id, data }: { id: string; data: any }) => {
  const response = await api.put(`/return/${id}`, data);
  return response.data.data;
});

export const deleteReturn = createAsyncThunk('return/delete', async (id: string) => {
  await api.delete(`/return/${id}`);
  return id;
});

const returnSlice = createSlice({
  name: 'return',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllReturns.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllReturns.fulfilled, (state, action) => {
        state.loading = false;
        state.returns = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllReturns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch returns';
      })
      .addCase(fetchReturnById.fulfilled, (state, action) => {
        state.currentReturn = action.payload;
      })
      .addCase(createReturn.fulfilled, (state, action) => {
        state.returns.unshift(action.payload);
      })
      .addCase(updateReturn.fulfilled, (state, action) => {
        const index = state.returns.findIndex((r) => r._id === action.payload._id);
        if (index !== -1) state.returns[index] = action.payload;
      })
      .addCase(deleteReturn.fulfilled, (state, action) => {
        state.returns = state.returns.filter((r) => r._id !== action.payload);
      });
  },
});

export default returnSlice.reducer;
