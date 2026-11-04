import express from 'express';
import { WalletController } from './wallet.controller';

const router = express.Router();

router.get('/:userId', WalletController.getMyWallets);
router.get('/:userId/walletType', WalletController.getMyWalletByType);


export const WalletRoutes = router;
