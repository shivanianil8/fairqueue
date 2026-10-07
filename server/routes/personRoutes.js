import { Router } from 'express';
import { personController } from '../controllers/personController.js';

const router = Router();

router.get('/', personController.getAllPeople);
router.post('/', personController.createPerson);
router.post('/seed', personController.seedDemo);
router.delete('/clear', personController.clearQueue);
router.get('/:id', personController.getPersonById);
router.delete('/:id', personController.deletePerson);

export default router;
