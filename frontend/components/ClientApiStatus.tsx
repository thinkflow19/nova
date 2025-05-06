'use client';

import dynamic from 'next/dynamic';

const ApiStatus = dynamic(() => import('./ApiStatus'), { ssr: false });

const ClientApiStatus = () => {
  return <ApiStatus />;
};

export default ClientApiStatus;