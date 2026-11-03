import express from 'express';
import { WalletController } from './wallet.controller';
import validationRequest from '../../middlewares/validateRequest';
import { WalletValidations } from './wallet.validations';

const router = express.Router();

router.get('/', WalletController.getAllWallets);
router.get('/:userId', WalletController.getWalletByUser);
router.patch('/:userId', 
     validationRequest(WalletValidations.updateWalletValidation), 
    WalletController.updateWallet);
router.delete('/:userId', WalletController.deleteWallet);

export const WalletRoutes = router;
