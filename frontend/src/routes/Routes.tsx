import { createBrowserRouter } from 'react-router-dom';
import Home from '@/pages/HomePage';

export const routes = createBrowserRouter([
    {
        path: '/',
        element: <Home />,
    }
]);