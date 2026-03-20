const createStore = () => {
  let store = {};
  return {
    getItem: jest.fn(async (key) => (key in store ? store[key] : null)),
    setItem: jest.fn(async (key, value) => {
      store[key] = String(value);
    }),
    removeItem: jest.fn(async (key) => {
      delete store[key];
    }),
    clear: jest.fn(async () => {
      store = {};
    }),
  };
};

jest.mock('@react-native-async-storage/async-storage', () => {
  const storage = createStore();
  return {
    __esModule: true,
    default: storage,
    ...storage,
  };
});
