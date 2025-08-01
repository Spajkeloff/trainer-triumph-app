import React from 'react';
import { Outlet } from 'react-router-dom';
import ClientHeader from './ClientHeader';

const ClientLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <ClientHeader />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default ClientLayout;