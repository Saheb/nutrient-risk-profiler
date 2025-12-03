import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ProductPage from './pages/ProductPage';
import AddProduct from './pages/AddProduct';
import QuickScan from './pages/QuickScan';

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4">
      <header className="w-full max-w-md py-6 flex flex-col items-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">Nutrient Risk Profiler</h1>
        <p className="text-muted-foreground text-center">Instantly check the risk profile of food items.</p>
      </header>

      <main className="w-full max-w-md flex-1 flex flex-col gap-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/add-product" element={<AddProduct />} />
          <Route path="/quick-scan" element={<QuickScan />} />
        </Routes>
      </main>

      <footer className="py-6 text-sm text-muted-foreground">
        Powered by OpenFoodFacts
      </footer>
    </div>
  );
}

export default App;
