import { Router } from 'express';
import { ListController } from '@/controllers/ListController.js';
import { AndonController } from '@/controllers/AndonController.js';
import { DashboardController } from '@/controllers/DashboardController.js';
import { SyncController } from '@/controllers/SyncController.js';

const routes = Router();

const listaController = new ListController();
const andonController = new AndonController();
const dashboardController = new DashboardController();
const syncController = new SyncController();

routes.get('/lista', (req, res) => listaController.getListaData(req, res));
routes.get('/andon', (req, res) => andonController.getAndonData(req, res));
routes.get('/dashboard', (req, res) => dashboardController.getDashboardData(req, res));
routes.post('/sync', (req, res) => syncController.handle(req, res));

export default routes;