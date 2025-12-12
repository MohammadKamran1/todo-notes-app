import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 300000
});

// simple wrapper for consistent error shape
const handle = async (fn) => {
  try {
    const res = await fn();
    return res.data;
  } catch (err) {
    if (err.response && err.response.data) throw err.response.data;
    throw { success: false, error: err.message || 'Network Error' };
  }
};

export const fetchItems = (params) => handle(() => client.get('/items', { params }));
export const createItem = (payload) => handle(() => client.post('/items', payload));
export const updateItem = (id, payload) => handle(() => client.put(`/items/${id}`, payload));
export const deleteItem = (id) => handle(() => client.delete(`/items/${id}`));
