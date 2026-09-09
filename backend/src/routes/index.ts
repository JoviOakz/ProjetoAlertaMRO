import { Router } from 'express';
import { ListController } from '@/controllers/ListController.js';
import { AndonController } from '@/controllers/AndonController.js';
import { DashboardController } from '@/controllers/DashboardController.js';

const routes = Router();

const listaController = new ListController();
const andonController = new AndonController();
const dashboardController = new DashboardController();

// Endpoints da API
routes.get('/lista', (req, res) => listaController.getListaData(req, res));
routes.get('/andon', (req, res) => andonController.getAndonData(req, res));
routes.get('/dashboard', (req, res) => dashboardController.getDashboardData(req, res));

export default routes;